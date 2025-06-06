/**
 * FluentUI Style Extractor for Heft
 * Implements style extraction following RushStack patterns
 */

import {
  FileSystem,
  Async,
} from '@rushstack/node-core-library';
import { Terminal } from '@rushstack/terminal';
import * as path from 'path';

import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import { mergeStyles, Stylesheet } from '@fluentui/merge-styles';

import { IFluentStyleExtractorConfiguration, IExtractionResult, IStyleExtractionMetrics, IFileExtractionResult, IAnalysisReport } from './interfaces';

/**
 * Options for the FluentStyleExtractor
 * @beta
 */
export interface IFluentStyleExtractorOptions extends IFluentStyleExtractorConfiguration {
  buildFolderPath: string;
  projectFolderPath: string;
  terminal: Terminal;
}

/**
 * Main class for extracting FluentUI styles at build time
 * Integrates with Heft's build pipeline
 * @beta
 */
export class FluentStyleExtractor {
  private readonly _options: IFluentStyleExtractorOptions;
  private readonly _terminal: Terminal;
  private readonly _metrics: IStyleExtractionMetrics = {
    filesProcessed: 0,
    stylesExtracted: 0,
    cssGenerated: 0,
    errors: [],
    warnings: [],
    extractionTime: 0,
  };

  constructor(options: IFluentStyleExtractorOptions) {
    this._options = options;
    this._terminal = options.terminal;
  }

  /**
   * Extract styles from the entire project
   */
  public async extractFromProject(): Promise<IExtractionResult> {
    console.log(`>>> extractFromProject called`);
    const startTime = Date.now();
    this._terminal.writeVerboseLine('Starting FluentUI style extraction...');

    try {
      // Find all style files
      console.log(`>>> Finding style files...`);
      const styleFiles = await this._findStyleFiles();
      console.log(`>>> Found ${styleFiles.length} style files`);
      this._terminal.writeVerboseLine(`Found ${styleFiles.length} style files to process`);

      // Process files in parallel with controlled concurrency
      const extractionPromises = styleFiles.map(filePath => 
        this._processStyleFile(filePath)
      );

      const extractionResults = await Async.mapAsync(
        extractionPromises,
        async (promise) => await promise,
        { concurrency: 10 } // Limit concurrency to avoid overwhelming the system
      );

      // Combine all extracted CSS
      const combinedCSS = await this._combineExtractedCSS(extractionResults);

      // Generate output files
      await this._generateOutputFiles(combinedCSS);

      // Generate analysis report
      const analysisReport = this._generateAnalysisReport(extractionResults);

      this._metrics.extractionTime = Date.now() - startTime;

      return {
        success: true,
        metrics: this._metrics,
        extractedFiles: extractionResults,
        generatedCSS: combinedCSS,
        analysisReport,
      };

    } catch (error) {
      this._metrics.extractionTime = Date.now() - startTime;
      this._metrics.errors.push({
        file: 'project',
        message: `Extraction failed: ${error}`,
        error,
      });

      return {
        success: false,
        metrics: this._metrics,
        extractedFiles: [],
        generatedCSS: '',
        analysisReport: null,
      };
    }
  }

  /**
   * Find all style files matching the configured patterns
   */
  private async _findStyleFiles(): Promise<string[]> {
    const { include, exclude } = this._options;
    const allFiles: string[] = [];

    this._terminal.writeVerboseLine(`Looking for style files in: ${this._options.projectFolderPath}`);
    this._terminal.writeVerboseLine(`Include patterns: ${JSON.stringify(include)}`);
    this._terminal.writeVerboseLine(`Exclude patterns: ${JSON.stringify(exclude)}`);

    // Use FileSystem.readFolderItemsAsync for efficient file discovery
    const srcPath = path.resolve(this._options.projectFolderPath, 'src');
    
    this._terminal.writeVerboseLine(`Checking src path: ${srcPath}`);
    
    if (await FileSystem.existsAsync(srcPath)) {
      this._terminal.writeVerboseLine(`Src path exists, collecting files...`);
      await this._collectFilesRecursively(srcPath, allFiles);
    } else {
      this._terminal.writeVerboseLine(`Src path does not exist, checking project root...`);
      // Also check the project root for style files
      if (await FileSystem.existsAsync(this._options.projectFolderPath)) {
        await this._collectFilesRecursively(this._options.projectFolderPath, allFiles);
      }
    }

    this._terminal.writeVerboseLine(`Found ${allFiles.length} total files before filtering`);

    // Filter files based on include/exclude patterns
    const filteredFiles = allFiles.filter(filePath => {
      const relativePath = path.relative(this._options.projectFolderPath, filePath);
      
      this._terminal.writeVerboseLine(`Checking file: ${relativePath}`);
      
      // Check include patterns
      const included = include.some(pattern => this._matchesGlob(relativePath, pattern));
      if (!included) {
        this._terminal.writeVerboseLine(`File ${relativePath} not included by patterns`);
        return false;
      }

      // Check exclude patterns
      const excluded = exclude.some(pattern => this._matchesGlob(relativePath, pattern));
      if (excluded) {
        this._terminal.writeVerboseLine(`File ${relativePath} excluded by patterns`);
        return false;
      }

      this._terminal.writeVerboseLine(`File ${relativePath} passed filtering`);
      return true;
    });

    this._terminal.writeVerboseLine(`Found ${filteredFiles.length} style files after filtering`);
    filteredFiles.forEach(file => {
      this._terminal.writeVerboseLine(`  - ${path.relative(this._options.projectFolderPath, file)}`);
    });

    return filteredFiles;
  }

  /**
   * Recursively collect files from a directory
   */
  private async _collectFilesRecursively(dirPath: string, files: string[]): Promise<void> {
    try {
      this._terminal.writeVerboseLine(`Collecting files from: ${dirPath}`);
      const items = await FileSystem.readFolderItemsAsync(dirPath);
      
      this._terminal.writeVerboseLine(`Found ${items.length} items in ${dirPath}`);
      
      for (const item of items) {
        const itemPath = path.resolve(dirPath, item.name);
        
        if (item.isDirectory()) {
          this._terminal.writeVerboseLine(`Recursing into directory: ${item.name}`);
          await this._collectFilesRecursively(itemPath, files);
        } else if (item.isFile() && this._isStyleFile(item.name)) {
          this._terminal.writeVerboseLine(`Found style file: ${item.name}`);
          files.push(itemPath);
        } else if (item.isFile()) {
          this._terminal.writeVerboseLine(`Skipping non-style file: ${item.name}`);
        }
      }
    } catch (error) {
      this._terminal.writeWarningLine(`Failed to read directory ${dirPath}: ${error}`);
    }
  }

  /**
   * Check if a file is a style file based on naming convention
   */
  private _isStyleFile(fileName: string): boolean {
    return /\.styles\.(ts|tsx|js|jsx)$/.test(fileName);
  }

  /**
   * Simple glob pattern matching
   */
  private _matchesGlob(filePath: string, pattern: string): boolean {
    // Convert glob pattern to regex (simplified)
    const regexPattern = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '[^/]');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(filePath.replace(/\\/g, '/'));
  }

  /**
   * Process a single style file
   */
  private async _processStyleFile(filePath: string): Promise<IFileExtractionResult> {
    const relativePath = path.relative(this._options.projectFolderPath, filePath);
    
    try {
      this._terminal.writeVerboseLine(`Processing: ${relativePath}`);
      
      const sourceCode = await FileSystem.readFileAsync(filePath);
      const result = await this._extractStylesFromCode(sourceCode, filePath);
      
      if (result.extractedClasses.length > 0) {
        this._metrics.filesProcessed++;
        this._metrics.stylesExtracted += result.extractedClasses.length;
        this._metrics.cssGenerated += result.css.length;
      }

      return {
        filePath,
        relativePath,
        originalCode: sourceCode,
        transformedCode: result.code,
        extractedCSS: result.css,
        extractedClasses: result.extractedClasses,
        success: true,
      };

    } catch (error) {
      this._metrics.errors.push({
        file: relativePath,
        message: `Failed to process: ${error}`,
        error,
      });

      this._terminal.writeWarningLine(`Failed to process ${relativePath}: ${error}`);
      
      return {
        filePath,
        relativePath,
        success: false,
        error: (error as Error).toString(),
      };
    }
  }

  /**
   * Extract styles from source code using AST transformation and merge-styles execution
   */
  private async _extractStylesFromCode(sourceCode: string, filePath: string): Promise<{
    code: string;
    css: string;
    extractedClasses: string[];
    hasChanges: boolean;
  }> {
    console.log(`>>> _extractStylesFromCode called for: ${filePath}`);
    console.log(`>>> Source code preview: ${sourceCode.substring(0, 100)}`);
    
    this._terminal.writeVerboseLine(`Starting _extractStylesFromCode for: ${filePath}`);
    this._terminal.writeVerboseLine(`Source code length: ${sourceCode.length}`);
    
    const ast = parse(sourceCode, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx', 'decorators-legacy'],
    });

    console.log(`>>> AST parsed successfully`);
    this._terminal.writeVerboseLine(`AST parsed successfully`);

    const fileStyleId = this._generateFileStyleId(filePath);
    let extractedCSS = '';
    const extractedClasses: string[] = [];
    let hasChanges = false;

    // Create a fresh stylesheet instance for this extraction
    const stylesheet = Stylesheet.getInstance();
    const initialRuleCount = stylesheet.getRules() ? stylesheet.getRules().split('}').length - 1 : 0;
    console.log(`>>> Initial stylesheet rule count: ${initialRuleCount}`);

    this._terminal.writeVerboseLine(`Starting AST traversal...`);

    // Transform getStyles functions
    traverse(ast, {
      VariableDeclarator: (path) => {
        console.log(`>>> Found VariableDeclarator: ${path.node.id?.type === 'Identifier' ? path.node.id.name : 'unknown'}`);
        this._terminal.writeVerboseLine(`Found VariableDeclarator in traversal`);
        if (this._isGetStylesFunction(path.node)) {
          console.log(`>>> Processing getStyles function (VariableDeclarator)`);
          this._terminal.writeVerboseLine(`Processing getStyles function (VariableDeclarator)`);
          const extractedData = this._extractStylesFromFunction(path.node.init!, fileStyleId, stylesheet);
          if (extractedData) {
            console.log(`>>> Successfully extracted data, creating precompiled function`);
            this._terminal.writeVerboseLine(`Successfully extracted data, creating precompiled function`);
            path.node.init = this._createPrecompiledFunction(extractedData);
            extractedClasses.push(...(Object.values(extractedData.cssClasses) as string[]));
            hasChanges = true;
          } else {
            console.log(`>>> No data extracted from getStyles function`);
            this._terminal.writeVerboseLine(`No data extracted from getStyles function`);
          }
        }
      },

      FunctionDeclaration: (path) => {
        console.log(`>>> Found FunctionDeclaration: ${path.node.id?.name}`);
        this._terminal.writeVerboseLine(`Found FunctionDeclaration: ${path.node.id?.name}`);
        if (path.node.id?.name === 'getStyles') {
          console.log(`>>> Processing getStyles function (FunctionDeclaration)`);
          this._terminal.writeVerboseLine(`Processing getStyles function (FunctionDeclaration)`);
          const extractedData = this._extractStylesFromFunction(path.node, fileStyleId, stylesheet);
          if (extractedData) {
            console.log(`>>> Successfully extracted data, creating precompiled function`);
            this._terminal.writeVerboseLine(`Successfully extracted data, creating precompiled function`);
            const newFunction = this._createPrecompiledFunction(extractedData);
            path.replaceWith(
              t.variableDeclaration('const', [
                t.variableDeclarator(t.identifier('getStyles'), newFunction),
              ])
            );
            extractedClasses.push(...(Object.values(extractedData.cssClasses) as string[]));
            hasChanges = true;
          } else {
            console.log(`>>> No data extracted from getStyles function`);
            this._terminal.writeVerboseLine(`No data extracted from getStyles function`);
          }
        }
      },
    });

    console.log(`>>> AST traversal completed. hasChanges: ${hasChanges}, extractedClasses: ${extractedClasses.length}`);
    this._terminal.writeVerboseLine(`AST traversal completed. hasChanges: ${hasChanges}, extractedClasses: ${extractedClasses.length}`);

    // Extract the CSS that was generated by merge-styles
    const allRules = stylesheet.getRules();
    console.log(`>>> Final stylesheet rules type: ${typeof allRules}, length: ${allRules ? allRules.length : 0}`);
    if (allRules && typeof allRules === 'string' && allRules.trim().length > 0) {
      console.log(`>>> All rules content preview: ${allRules.substring(0, 200)}`);
      extractedCSS = allRules;
      console.log(`>>> Extracted CSS (${extractedCSS.length} chars): ${extractedCSS.substring(0, 200)}...`);
      this._terminal.writeVerboseLine(`Extracted CSS (${extractedCSS.length} chars): ${extractedCSS.substring(0, 200)}...`);
    } else {
      console.log(`>>> No CSS rules to extract`);
    }

    // Generate transformed code
    const transformedCode = hasChanges ? generate(ast).code : sourceCode;

    console.log(`>>> Extraction complete. CSS: ${extractedCSS.length} chars, Classes: ${extractedClasses.length}, Changes: ${hasChanges}`);

    return {
      code: transformedCode,
      css: extractedCSS,
      extractedClasses,
      hasChanges,
    };
  }

  /**
   * Combine all extracted CSS with PostCSS processing
   */
  private async _combineExtractedCSS(extractionResults: IFileExtractionResult[]): Promise<string> {
    let combinedCSS = '/* FluentUI Extracted Styles */\n/* Generated by Heft FluentUI Style Extractor */\n\n';

    // Add CSS custom properties for theme tokens
    combinedCSS += this._generateThemeTokenCSS();

    // Combine all extracted CSS
    extractionResults.forEach(result => {
      if (result.success && result.extractedCSS) {
        combinedCSS += `/* ${result.relativePath} */\n${result.extractedCSS}\n\n`;
      }
    });

    // Process with PostCSS
    if (this._options.enableSourceMaps || this._options.minifyCSS) {
      const plugins: any[] = [autoprefixer()];
      if (this._options.minifyCSS) {
        plugins.push(cssnano);
      }

      const processed = await postcss(plugins).process(combinedCSS, {
        from: undefined,
        map: this._options.enableSourceMaps ? { inline: false } : false,
      });

      return processed.css;
    }

    return combinedCSS;
  }

  /**
   * Generate CSS custom properties for theme tokens
   */
  private _generateThemeTokenCSS(): string {
    const { themeTokens } = this._options;
    if (!themeTokens || Object.keys(themeTokens).length === 0) {
      return '';
    }

    let css = ':root {\n';
    Object.entries(themeTokens).forEach(([token, value]) => {
      css += `  --${token}: ${value};\n`;
    });
    css += '}\n\n';

    return css;
  }

  /**
   * Generate output files
   */
  private async _generateOutputFiles(combinedCSS: string): Promise<void> {
    const outputDir = path.resolve(this._options.projectFolderPath, this._options.outputDir);
    await FileSystem.ensureFolderAsync(outputDir);

    // Write CSS file
    const cssFilePath = path.resolve(outputDir, this._options.cssFileName);
    await FileSystem.writeFileAsync(cssFilePath, combinedCSS);
    this._terminal.writeLine(`Generated CSS: ${path.relative(this._options.projectFolderPath, cssFilePath)}`);

    // Write source map if enabled
    if (this._options.enableSourceMaps) {
      const sourceMapPath = `${cssFilePath}.map`;
      // Source map would be generated by PostCSS
      this._terminal.writeVerboseLine(`Source map: ${path.relative(this._options.projectFolderPath, sourceMapPath)}`);
    }
  }

  /**
   * Generate analysis report
   */
  private _generateAnalysisReport(extractionResults: IFileExtractionResult[]): IAnalysisReport {
    const successfulExtractions = extractionResults.filter(r => r.success);
    const failedExtractions = extractionResults.filter(r => !r.success);

    const totalCSSSize = successfulExtractions.reduce((sum, r) => sum + (r.extractedCSS?.length || 0), 0);
    const totalClasses = successfulExtractions.reduce((sum, r) => sum + (r.extractedClasses?.length || 0), 0);

    return {
      summary: {
        filesProcessed: this._metrics.filesProcessed,
        stylesExtracted: this._metrics.stylesExtracted,
        cssSize: Math.round(totalCSSSize / 1024), // KB
        totalClasses,
        errors: this._metrics.errors.length,
        warnings: this._metrics.warnings.length,
        extractionTime: this._metrics.extractionTime,
      },
      performance: {
        bundleReduction: this._estimateBundleReduction(),
        avgExtractionTimePerFile: this._metrics.extractionTime / Math.max(this._metrics.filesProcessed, 1),
      },
      optimizations: this._generateOptimizationSuggestions(),
      files: successfulExtractions.map(r => ({
        path: r.relativePath,
        classes: r.extractedClasses?.length || 0,
        cssSize: r.extractedCSS?.length || 0,
      })),
      errors: failedExtractions.map(r => ({
        path: r.relativePath,
        error: r.error || 'Unknown error',
      })),
    };
  }

  // Helper methods for style extraction (simplified implementations)
  private _isGetStylesFunction(node: t.VariableDeclarator): boolean {
    console.log(`>>> Checking VariableDeclarator: ${node.id?.type === 'Identifier' ? node.id.name : 'unknown'}`);
    console.log(`>>>   - id.type: ${node.id?.type}`);
    console.log(`>>>   - id.name: ${node.id?.type === 'Identifier' ? node.id.name : 'n/a'}`);
    console.log(`>>>   - init.type: ${node.init?.type}`);
    
    this._terminal.writeVerboseLine(`Checking VariableDeclarator: ${node.id?.type === 'Identifier' ? node.id.name : 'unknown'}`);
    this._terminal.writeVerboseLine(`  - id.type: ${node.id?.type}`);
    this._terminal.writeVerboseLine(`  - id.name: ${node.id?.type === 'Identifier' ? node.id.name : 'n/a'}`);
    this._terminal.writeVerboseLine(`  - init.type: ${node.init?.type}`);
    
    const result = (
      node.id?.type === 'Identifier' &&
      node.id.name === 'getStyles' &&
      (node.init?.type === 'ArrowFunctionExpression' || 
       node.init?.type === 'FunctionExpression')
    );
    
    console.log(`>>>   - isGetStyles: ${result}`);
    this._terminal.writeVerboseLine(`  - isGetStyles: ${result}`);
    return result;
  }

  private _extractStylesFromFunction(
    functionNode: t.Node, 
    fileStyleId: string, 
    stylesheet: any
  ): {
    cssClasses: Record<string, string>;
    styles: unknown[];
    themeTokens: Set<unknown>;
  } | null {
    try {
      // Get the current CSS to compare against later
      const initialCSS = stylesheet.getRules() || '';
      const initialRuleCount = initialCSS.split('}').length - 1;
      
      console.log(`>>> Initial CSS for function extraction: ${initialCSS.length} chars, ${initialRuleCount} rules`);
      
      this._terminal.writeVerboseLine(`Processing function node type: ${functionNode.type}`);
      
      // Extract style objects from the function AST
      const styleObjects = this._extractStyleObjectsFromAST(functionNode);
      
      console.log(`>>> Found ${styleObjects.length} style objects`);
      this._terminal.writeVerboseLine(`Found ${styleObjects.length} style objects`);
      
      if (styleObjects.length === 0) {
        console.log(`>>> No style objects found, returning null`);
        this._terminal.writeVerboseLine('No style objects found, returning null');
        return null;
      }

      const cssClasses: Record<string, string> = {};
      const styles: unknown[] = [];
      const themeTokens = new Set<unknown>();

      // Process each style object through merge-styles
      styleObjects.forEach((styleObj, index) => {
        try {
          console.log(`>>> Processing style object ${index}: ${styleObj.key}`);
          console.log(`>>> Style object content: ${JSON.stringify(styleObj.styles).substring(0, 200)}`);
          
          this._terminal.writeVerboseLine(`Processing style object ${index}: ${styleObj.key}`);
          this._terminal.writeVerboseLine(`Style object content: ${JSON.stringify(styleObj.styles, null, 2)}`);
          
          // Execute merge-styles on the extracted style object
          const className = mergeStyles(styleObj.styles);
          
          console.log(`>>> Generated class name: ${className}`);
          this._terminal.writeVerboseLine(`Generated class name: ${className}`);
          
          // Get the CSS that was just generated
          const currentCSS = stylesheet.getRules() || '';
          console.log(`>>> CSS after merge-styles: ${currentCSS.length} chars`);
          
          // Map the generated class name to our naming convention
          const stableClassName = `${this._options.classPrefix}-${fileStyleId}-${styleObj.key || `style${index}`}`;
          cssClasses[styleObj.key || `style${index}`] = className;
          styles.push(styleObj.styles);

          // Extract theme tokens if present
          this._extractThemeTokensFromStyles(styleObj.styles, themeTokens);
        } catch (error) {
          console.log(`>>> Error processing style object: ${error}`);
          this._terminal.writeWarningLine(`Failed to process style object in ${fileStyleId}: ${error}`);
        }
      });

      this._terminal.writeVerboseLine(`Final CSS classes: ${JSON.stringify(cssClasses, null, 2)}`);
      console.log(`>>> Final CSS classes: ${JSON.stringify(cssClasses, null, 2)}`);

      return {
        cssClasses,
        styles,
        themeTokens,
      };
    } catch (error) {
      console.log(`>>> Error in _extractStylesFromFunction: ${error}`);
      this._terminal.writeWarningLine(`Failed to extract styles from function in ${fileStyleId}: ${error}`);
      return null;
    }
  }

  /**
   * Extract style objects from AST nodes
   */
  private _extractStyleObjectsFromAST(functionNode: t.Node): Array<{
    key: string;
    styles: any;
  }> {
    const styleObjects: Array<{ key: string; styles: any }> = [];

    if (t.isArrowFunctionExpression(functionNode) || t.isFunctionExpression(functionNode) || t.isFunctionDeclaration(functionNode)) {
      const body = functionNode.body;
      
      if (t.isBlockStatement(body)) {
        // Look for return statements in block
        body.body.forEach(statement => {
          if (t.isReturnStatement(statement) && statement.argument) {
            this._extractStylesFromReturnStatement(statement.argument, styleObjects);
          }
        });
      } else if (t.isObjectExpression(body)) {
        // Direct object return in arrow function (like: () => ({ root: {...} }))
        this._extractStylesFromObjectExpression(body, styleObjects);
      } else if (t.isExpression(body)) {
        // Handle other direct expression returns
        if (t.isObjectExpression(body)) {
          this._extractStylesFromObjectExpression(body, styleObjects);
        }
      }
    }

    return styleObjects;
  }

  /**
   * Extract styles from a return statement
   */
  private _extractStylesFromReturnStatement(node: t.Expression, styleObjects: Array<{ key: string; styles: any }>): void {
    if (t.isObjectExpression(node)) {
      this._extractStylesFromObjectExpression(node, styleObjects);
    }
  }

  /**
   * Extract styles from an object expression
   */
  private _extractStylesFromObjectExpression(node: t.ObjectExpression, styleObjects: Array<{ key: string; styles: any }>): void {
    node.properties.forEach(prop => {
      if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
        const key = prop.key.name;
        
        // Convert the AST node back to a style object
        if (t.isExpression(prop.value)) {
          const styles = this._astNodeToStyleObject(prop.value);
          if (styles) {
            styleObjects.push({ key, styles });
          }
        }
      }
    });
  }

  /**
   * Convert AST node to style object for merge-styles
   */
  private _astNodeToStyleObject(node: t.Expression): any {
    try {
      if (t.isObjectExpression(node)) {
        const styles: any = {};
        
        node.properties.forEach(prop => {
          if (t.isObjectProperty(prop)) {
            let key: string;
            
            if (t.isIdentifier(prop.key)) {
              key = prop.key.name;
            } else if (t.isStringLiteral(prop.key)) {
              key = prop.key.value;
            } else {
              return; // Skip complex keys for now
            }

            if (t.isExpression(prop.value)) {
              const value = this._astNodeToValue(prop.value);
              if (value !== undefined) {
                styles[key] = value;
              }
            }
          }
        });

        return styles;
      } else if (t.isArrayExpression(node)) {
        // Handle array of styles
        return node.elements.map(element => {
          if (element && t.isExpression(element)) {
            return this._astNodeToStyleObject(element);
          }
          return null;
        }).filter(item => item !== null);
      }
      
      return null;
    } catch (error) {
      this._terminal.writeWarningLine(`Failed to convert AST node to style object: ${error}`);
      return null;
    }
  }

  /**
   * Convert AST node to primitive value
   */
  private _astNodeToValue(node: t.Expression): any {
    if (t.isStringLiteral(node)) {
      return node.value;
    } else if (t.isNumericLiteral(node)) {
      return node.value;
    } else if (t.isBooleanLiteral(node)) {
      return node.value;
    } else if (t.isObjectExpression(node)) {
      return this._astNodeToStyleObject(node);
    } else if (t.isArrayExpression(node)) {
      return node.elements.map(element => {
        if (element && t.isExpression(element)) {
          return this._astNodeToValue(element);
        }
        return null;
      });
    } else if (t.isTemplateLiteral(node)) {
      // Handle template literals - simplified conversion
      if (node.expressions.length === 0) {
        return node.quasis[0]?.value.cooked || '';
      }
      // For complex template literals, we'd need to evaluate the expressions
      return node.quasis[0]?.value.cooked || '';
    }
    
    // For other complex expressions, return a placeholder
    // In a full implementation, this would handle member expressions,
    // function calls, conditionals, etc.
    return undefined;
  }

  /**
   * Extract theme tokens from style objects
   */
  private _extractThemeTokensFromStyles(styles: any, themeTokens: Set<unknown>): void {
    if (typeof styles === 'object' && styles !== null) {
      Object.values(styles).forEach(value => {
        if (typeof value === 'string' && value.includes('theme.')) {
          themeTokens.add(value);
        } else if (typeof value === 'object') {
          this._extractThemeTokensFromStyles(value, themeTokens);
        }
      });
    }
  }

  private _createPrecompiledFunction(extractedData: { cssClasses: Record<string, string> }): t.ArrowFunctionExpression {
    // Simplified implementation - would generate actual pre-compiled function
    return t.arrowFunctionExpression(
      [t.identifier('props')],
      t.blockStatement([
        t.returnStatement(
          t.objectExpression([
            t.objectProperty(
              t.identifier('root'),
              t.arrayExpression([
                t.stringLiteral(extractedData.cssClasses.base),
                t.identifier('props.className')
              ])
            )
          ])
        )
      ])
    );
  }



  private _generateFileStyleId(filePath: string): string {
    const fileName = path.basename(filePath, '.styles.ts').replace(/[^a-zA-Z0-9]/g, '');
    const hash = this._simpleHash(filePath);
    return `${fileName}-${hash.substring(0, 6)}`;
  }

  private _simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private _estimateBundleReduction(): number {
    // Estimate based on typical merge-styles overhead
    return Math.min(75, Math.max(0, this._metrics.stylesExtracted * 0.8));
  }

  private _generateOptimizationSuggestions(): Array<{
    type: string;
    suggestion: string;
  }> {
    const suggestions = [];

    if (this._metrics.stylesExtracted > 100) {
      suggestions.push({
        type: 'high_style_count',
        suggestion: `${this._metrics.stylesExtracted} styles extracted. Consider style consolidation.`,
      });
    }

    if (this._metrics.errors.length > 0) {
      suggestions.push({
        type: 'extraction_errors',
        suggestion: `${this._metrics.errors.length} files failed extraction. Review error logs.`,
      });
    }

    return suggestions;
  }
}