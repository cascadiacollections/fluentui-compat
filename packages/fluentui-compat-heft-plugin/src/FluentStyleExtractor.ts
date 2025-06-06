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
import * as semver from 'semver';

import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import { mergeStyles, Stylesheet } from '@fluentui/merge-styles';

import { 
  IFluentStyleExtractorConfiguration, 
  IExtractionResult, 
  IStyleExtractionMetrics, 
  IFileExtractionResult, 
  IAnalysisReport,
  IVendorPackageInfo,
  IVendorPackageConfig
} from './interfaces';

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
   * Find all style files matching the configured patterns (including vendor packages if configured)
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

    // Collect vendor package files if configured
    if (this._options.vendorExtraction?.enabled) {
      const vendorFiles = await this._findVendorStyleFiles();
      allFiles.push(...vendorFiles);
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
   * Generates all possible CSS variants by evaluating getStyles with different prop combinations
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
    // Clear any existing styles to start fresh
    stylesheet.reset();
    console.log(`>>> Stylesheet reset for fresh extraction`);

    this._terminal.writeVerboseLine(`Starting AST traversal...`);

    // Transform all merge-styles API usage patterns
    traverse(ast, {
      VariableDeclarator: (path) => {
        console.log(`>>> Found VariableDeclarator: ${path.node.id?.type === 'Identifier' ? path.node.id.name : 'unknown'}`);
        this._terminal.writeVerboseLine(`Found VariableDeclarator in traversal`);
        
        // Handle getStyles and other style functions
        if (this._isStyleFunction(path.node)) {
          console.log(`>>> Processing style function (VariableDeclarator)`);
          this._terminal.writeVerboseLine(`Processing style function (VariableDeclarator)`);
          const extractedData = this._extractStylesFromFunction(path.node.init!, fileStyleId, stylesheet);
          if (extractedData) {
            console.log(`>>> Successfully extracted data, creating precompiled function`);
            this._terminal.writeVerboseLine(`Successfully extracted data, creating precompiled function`);
            path.node.init = this._createPrecompiledFunction(extractedData);
            extractedClasses.push(...(Object.values(extractedData.cssClasses) as string[]));
            hasChanges = true;
          } else {
            console.log(`>>> No data extracted from style function`);
            this._terminal.writeVerboseLine(`No data extracted from style function`);
          }
        }
      },

      FunctionDeclaration: (path) => {
        console.log(`>>> Found FunctionDeclaration: ${path.node.id?.name}`);
        this._terminal.writeVerboseLine(`Found FunctionDeclaration: ${path.node.id?.name}`);
        
        // Handle getStyles and other style functions
        if (this._isStyleFunctionDeclaration(path.node)) {
          console.log(`>>> Processing style function (FunctionDeclaration)`);
          this._terminal.writeVerboseLine(`Processing style function (FunctionDeclaration)`);
          const extractedData = this._extractStylesFromFunction(path.node, fileStyleId, stylesheet);
          if (extractedData) {
            console.log(`>>> Successfully extracted data, creating precompiled function`);
            this._terminal.writeVerboseLine(`Successfully extracted data, creating precompiled function`);
            const newFunction = this._createPrecompiledFunction(extractedData);
            path.replaceWith(
              t.variableDeclaration('const', [
                t.variableDeclarator(t.identifier(path.node.id?.name || 'getStyles'), newFunction),
              ])
            );
            extractedClasses.push(...(Object.values(extractedData.cssClasses) as string[]));
            hasChanges = true;
          } else {
            console.log(`>>> No data extracted from style function`);
            this._terminal.writeVerboseLine(`No data extracted from style function`);
          }
        }
      },

      // Handle direct merge-styles API calls
      CallExpression: (path) => {
        const result = this._handleMergeStylesCalls(path, fileStyleId, stylesheet);
        if (result) {
          extractedClasses.push(...result.classes);
          hasChanges = hasChanges || result.hasChanges;
        }
      },

      // Handle class method declarations that contain styles
      ClassMethod: (path) => {
        if (this._isStyleClassMethod(path.node)) {
          console.log(`>>> Processing style class method: ${path.node.key.type === 'Identifier' ? path.node.key.name : 'unknown'}`);
          const extractedData = this._extractStylesFromFunction(path.node, fileStyleId, stylesheet);
          if (extractedData) {
            console.log(`>>> Successfully extracted data from class method`);
            extractedClasses.push(...(Object.values(extractedData.cssClasses) as string[]));
            hasChanges = true;
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
  private _isGetStylesFunction = (node: t.VariableDeclarator): boolean => {
    console.log(`>>> Checking VariableDeclarator: ${node.id?.type === 'Identifier' ? node.id.name : 'unknown'}`);
    console.log(`>>>   - id.type: ${node.id?.type}`);
    console.log(`>>>   - id.name: ${node.id?.type === 'Identifier' ? node.id.name : 'n/a'}`);
    console.log(`>>>   - init.type: ${node.init?.type}`);
    
    // Check if we have a terminal instance before using it
    if (this && this._terminal && typeof this._terminal.writeVerboseLine === 'function') {
      this._terminal.writeVerboseLine(`Checking VariableDeclarator: ${node.id?.type === 'Identifier' ? node.id.name : 'unknown'}`);
      this._terminal.writeVerboseLine(`  - id.type: ${node.id?.type}`);
      this._terminal.writeVerboseLine(`  - id.name: ${node.id?.type === 'Identifier' ? node.id.name : 'n/a'}`);
      this._terminal.writeVerboseLine(`  - init.type: ${node.init?.type}`);
    }
    
    const result = (
      node.id?.type === 'Identifier' &&
      node.id.name === 'getStyles' &&
      (node.init?.type === 'ArrowFunctionExpression' || 
       node.init?.type === 'FunctionExpression')
    );
    
    console.log(`>>>   - isGetStyles: ${result}`);
    if (this && this._terminal && typeof this._terminal.writeVerboseLine === 'function') {
      this._terminal.writeVerboseLine(`  - isGetStyles: ${result}`);
    }
    return result;
  }

  /**
   * Enhanced function to detect various style function patterns
   * Handles getStyles, useStyles, createStyles, etc.
   */
  private _isStyleFunction = (node: t.VariableDeclarator): boolean => {
    if (node.id?.type !== 'Identifier') return false;
    if (!(node.init?.type === 'ArrowFunctionExpression' || node.init?.type === 'FunctionExpression')) return false;

    const functionName = node.id.name;
    
    // Check for common style function naming patterns
    const stylePatterns = [
      'getStyles',
      'useStyles', 
      'createStyles',
      'makeStyles',
      'buildStyles',
      /.*Styles$/,  // Any function ending with "Styles"
      /.*Style$/,   // Any function ending with "Style"
    ];

    return stylePatterns.some(pattern => {
      if (typeof pattern === 'string') {
        return functionName === pattern;
      } else {
        return pattern.test(functionName);
      }
    });
  }

  /**
   * Check if a function declaration is a style function
   */
  private _isStyleFunctionDeclaration = (node: t.FunctionDeclaration): boolean => {
    if (!node.id?.name) return false;

    const functionName = node.id.name;
    
    // Check for common style function naming patterns
    const stylePatterns = [
      'getStyles',
      'useStyles', 
      'createStyles',
      'makeStyles',
      'buildStyles',
      /.*Styles$/,  // Any function ending with "Styles"
      /.*Style$/,   // Any function ending with "Style"
    ];

    return stylePatterns.some(pattern => {
      if (typeof pattern === 'string') {
        return functionName === pattern;
      } else {
        return pattern.test(functionName);
      }
    });
  }

  /**
   * Check if a class method contains style definitions
   */
  private _isStyleClassMethod = (node: t.ClassMethod): boolean => {
    if (node.key.type !== 'Identifier') return false;

    const methodName = node.key.name;
    
    // Check for common style method naming patterns
    const stylePatterns = [
      'getStyles',
      'useStyles', 
      'createStyles',
      'styles',
      'render', // Sometimes styles are in render methods
      /.*Styles$/,
      /.*Style$/,
    ];

    return stylePatterns.some(pattern => {
      if (typeof pattern === 'string') {
        return methodName === pattern;
      } else {
        return pattern.test(methodName);
      }
    });
  }

  /**
   * Handle various merge-styles API calls
   * Supports: mergeStyles, mergeStyleSets, concatStyleSets, fontFace, keyframes, etc.
   */
  private _handleMergeStylesCalls = (path: any, fileStyleId: string, stylesheet: any): { classes: string[], hasChanges: boolean } | null => {
    const node = path.node;
    
    if (!t.isCallExpression(node)) return null;

    // Get the function name being called
    let functionName: string | null = null;
    
    if (t.isIdentifier(node.callee)) {
      functionName = node.callee.name;
    } else if (t.isMemberExpression(node.callee) && t.isIdentifier(node.callee.property)) {
      functionName = node.callee.property.name;
    }

    if (!functionName) return null;

    console.log(`>>> Found function call: ${functionName}`);
    this._terminal.writeVerboseLine(`Found function call: ${functionName}`);

    const mergeStylesApis = [
      'mergeStyles',
      'mergeStyleSets', 
      'concatStyleSets',
      'concatStyleSetsWithProps',
      'mergeCss',
      'mergeCssSets',
      'fontFace',
      'keyframes',
    ];

    if (!mergeStylesApis.includes(functionName)) return null;

    console.log(`>>> Processing merge-styles API call: ${functionName}`);
    this._terminal.writeVerboseLine(`Processing merge-styles API call: ${functionName}`);

    try {
      const extractedClasses: string[] = [];
      
      // Handle different API patterns
      switch (functionName) {
        case 'mergeStyles':
          return this._handleMergeStylesCall(node, path, stylesheet, extractedClasses);
        
        case 'mergeStyleSets':
          return this._handleMergeStyleSetsCall(node, path, stylesheet, extractedClasses);
        
        case 'concatStyleSets':
        case 'concatStyleSetsWithProps':
          return this._handleConcatStyleSetsCall(node, path, stylesheet, extractedClasses);
        
        case 'fontFace':
          return this._handleFontFaceCall(node, path, stylesheet, extractedClasses);
        
        case 'keyframes':
          return this._handleKeyframesCall(node, path, stylesheet, extractedClasses);
        
        case 'mergeCss':
        case 'mergeCssSets':
          return this._handleMergeCssCall(node, path, stylesheet, extractedClasses);
        
        default:
          console.log(`>>> Unsupported merge-styles API: ${functionName}`);
          return null;
      }
    } catch (error) {
      console.log(`>>> Error processing ${functionName} call: ${error}`);
      this._terminal.writeWarningLine(`Error processing ${functionName} call: ${error}`);
      return null;
    }
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
      console.log(`>>> Starting _extractStylesFromFunction for: ${fileStyleId}`);
      this._terminal.writeVerboseLine(`Processing function node type: ${functionNode.type}`);
      
      // Create evaluation context with theme tokens and sample props
      const evaluationContext = this._createEvaluationContext();
      
      // Generate all possible prop combinations for boolean conditions
      const propVariants = this._generatePropVariants(functionNode);
      console.log(`>>> Generated ${propVariants.length} prop variants`);
      this._terminal.writeVerboseLine(`Generated ${propVariants.length} prop variants`);
      
      const cssClasses: Record<string, string> = {};
      const styles: unknown[] = [];
      const themeTokens = new Set<unknown>();
      
      // Evaluate getStyles function with each prop variant
      for (const [variantIndex, props] of propVariants.entries()) {
        console.log(`>>> Evaluating variant ${variantIndex}: ${JSON.stringify(props)}`);
        this._terminal.writeVerboseLine(`Evaluating variant ${variantIndex}: ${JSON.stringify(props)}`);
        
        try {
          // Execute the getStyles function with the current props
          const styleResult = this._executeGetStylesFunction(functionNode, props, evaluationContext);
          
          if (styleResult) {
            console.log(`>>> Got style result with ${Object.keys(styleResult).length} style keys`);
            
            // Process each style key (root, header, content, etc.)
            Object.entries(styleResult).forEach(([styleKey, styleValue]) => {
              if (styleValue) {
                console.log(`>>> Processing style key: ${styleKey}`);
                console.log(`>>> Style value type: ${Array.isArray(styleValue) ? 'array' : typeof styleValue}`);
                
                // Flatten and merge styles (handle arrays and conditional styles)
                const flattenedStyles = this._flattenStyleValue(styleValue, props, evaluationContext);
                
                if (flattenedStyles && Object.keys(flattenedStyles).length > 0) {
                  console.log(`>>> Flattened styles: ${JSON.stringify(flattenedStyles).substring(0, 200)}`);
                  
                  // Execute merge-styles on the flattened style object
                  const className = mergeStyles(flattenedStyles);
                  console.log(`>>> Generated class name: ${className} for ${styleKey}`);
                  
                  // Use a unique key that includes the variant
                  const variantKey = propVariants.length > 1 ? `${styleKey}_variant${variantIndex}` : styleKey;
                  if (!cssClasses[variantKey]) {
                    cssClasses[variantKey] = className;
                    styles.push(flattenedStyles);
                    
                    // Extract theme tokens
                    this._extractThemeTokensFromStyles(flattenedStyles, themeTokens);
                  }
                }
              }
            });
          }
        } catch (error) {
          console.log(`>>> Error evaluating variant ${variantIndex}: ${error}`);
          this._terminal.writeWarningLine(`Failed to evaluate variant ${variantIndex}: ${error}`);
        }
      }

      console.log(`>>> Final CSS classes: ${JSON.stringify(cssClasses, null, 2)}`);
      this._terminal.writeVerboseLine(`Final CSS classes: ${JSON.stringify(cssClasses, null, 2)}`);

      if (Object.keys(cssClasses).length === 0) {
        console.log(`>>> No CSS classes generated, returning null`);
        return null;
      }

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
   * Create evaluation context with theme tokens and default values
   */
  private _createEvaluationContext(): any {
    const { themeTokens } = this._options;
    
    // Create a comprehensive theme object based on FluentUI patterns
    const defaultTheme = {
      palette: {
        white: '#ffffff',
        black: '#000000',
        themePrimary: themeTokens?.colorBrandBackground || '#0078d4',
        neutralPrimary: '#323130',
        neutralSecondary: '#605e5c',
        neutralTertiary: '#a19f9d',
        neutralTertiaryAlt: '#c8c6c4',
        neutralQuaternaryAlt: '#e1dfdd',
        neutralLight: '#f3f2f1',
        neutralLighter: '#faf9f8',
        neutralDark: '#201f1e',
        neutralPrimaryAlt: '#3b3a39',
        neutralSecondaryAlt: '#8a8886',
        neutralQuaternary: '#d2d0ce',
        neutralLighterAlt: '#f8f7f6',
      },
      fonts: {
        small: { fontSize: '12px', fontWeight: '400', fontFamily: 'Segoe UI' },
        medium: { fontSize: themeTokens?.fontSizeBase300 || '14px', fontWeight: '400', fontFamily: 'Segoe UI' },
        mediumPlus: { fontSize: '16px', fontWeight: '400', fontFamily: 'Segoe UI' },
        large: { fontSize: '18px', fontWeight: '400', fontFamily: 'Segoe UI' },
      },
      effects: {
        elevation4: '0 1.6px 3.6px 0 rgba(0, 0, 0, 0.132), 0 0.3px 0.9px 0 rgba(0, 0, 0, 0.108)',
        elevation8: '0 3.2px 7.2px 0 rgba(0, 0, 0, 0.132), 0 0.6px 1.8px 0 rgba(0, 0, 0, 0.108)',
        roundedCorner2: themeTokens?.borderRadiusSmall || '2px',
        roundedCorner4: '4px',
      },
      spacing: {
        xs: '4px',
        s1: '8px',
        s2: '12px',
        m: '16px',
        l: '20px',
        xl: '24px',
      },
    };

    // Add custom theme tokens
    if (themeTokens) {
      Object.entries(themeTokens).forEach(([key, value]) => {
        // Try to map theme tokens to palette/fonts/effects
        if (key.startsWith('color')) {
          const colorKey = key.replace(/^color/, '').toLowerCase();
          if (colorKey.includes('background')) {
            defaultTheme.palette.themePrimary = value;
          } else if (colorKey.includes('neutral')) {
            defaultTheme.palette.neutralPrimary = value;
          }
        } else if (key.startsWith('fontSize')) {
          const sizeKey = key.replace(/^fontSize/, '').toLowerCase();
          if (sizeKey.includes('base')) {
            defaultTheme.fonts.medium.fontSize = value;
          }
        }
      });
    }

    return {
      theme: defaultTheme,
      palette: defaultTheme.palette, // Direct access to palette for easier evaluation
      fonts: defaultTheme.fonts,     // Direct access to fonts for easier evaluation
      effects: defaultTheme.effects, // Direct access to effects for easier evaluation
      // Helper functions that might be used in getStyles
      getGlobalClassNames: (classNames: any, theme: any) => classNames, // Simplified implementation
    };
  }

  /**
   * Generate different prop combinations to test all conditional branches
   */
  private _generatePropVariants(functionNode: t.Node): Array<Record<string, any>> {
    // Analyze the function to identify boolean props and conditions
    const booleanProps = this._extractBooleanPropsFromFunction(functionNode);
    console.log(`>>> Found boolean props: ${JSON.stringify(booleanProps)}`);
    
    if (booleanProps.length === 0) {
      // Return a single variant with basic props
      return [{ className: undefined }];
    }

    // Generate all combinations of boolean props
    const variants: Array<Record<string, any>> = [];
    const numCombinations = Math.pow(2, booleanProps.length);
    
    for (let i = 0; i < numCombinations; i++) {
      const props: Record<string, any> = { className: undefined };
      
      booleanProps.forEach((prop, index) => {
        props[prop] = Boolean(i & (1 << index));
      });
      
      // Add some additional prop variants for non-boolean conditions
      if (booleanProps.includes('variant')) {
        const variantProps = { ...props };
        delete variantProps.variant;
        variantProps.variant = 'elevated';
        variants.push(variantProps);
      }
      
      variants.push(props);
    }

    // Limit to reasonable number of variants to avoid performance issues
    return variants.slice(0, 16);
  }

  /**
   * Extract boolean props from function AST by analyzing conditional expressions
   */
  private _extractBooleanPropsFromFunction(functionNode: t.Node): string[] {
    const booleanProps = new Set<string>();
    
    try {
      // Traverse the function AST to find logical expressions and member accesses
      const traverseVisitor = {
        LogicalExpression: (path: any) => {
          if (path.node.operator === '&&' && t.isIdentifier(path.node.left)) {
            booleanProps.add(path.node.left.name);
          } else if (path.node.operator === '&&' && t.isMemberExpression(path.node.left)) {
            const memberName = this._getMemberExpressionName(path.node.left);
            if (memberName) {
              booleanProps.add(memberName);
            }
          }
        },
        BinaryExpression: (path: any) => {
          if (path.node.operator === '===' || path.node.operator === '==') {
            if (t.isMemberExpression(path.node.left)) {
              const memberName = this._getMemberExpressionName(path.node.left);
              if (memberName && memberName !== 'variant') {
                booleanProps.add(memberName);
              }
            }
          }
        },
        ConditionalExpression: (path: any) => {
          if (t.isIdentifier(path.node.test)) {
            booleanProps.add(path.node.test.name);
          } else if (t.isMemberExpression(path.node.test)) {
            const memberName = this._getMemberExpressionName(path.node.test);
            if (memberName) {
              booleanProps.add(memberName);
            }
          }
        },
      };

      // Create a minimal AST with the function as the root
      const program = t.program([t.expressionStatement(functionNode as any)]);
      traverse(program, traverseVisitor);
    } catch (error) {
      console.log(`>>> Error extracting boolean props: ${error}`);
      // Fallback to common boolean props if traversal fails
      return ['actionable', 'compact', 'disabled', 'primary', 'selected', 'checked'];
    }

    return Array.from(booleanProps);
  }

  /**
   * Get the name from a member expression (e.g., props.actionable -\> actionable)
   */
  private _getMemberExpressionName(node: t.MemberExpression): string | null {
    if (t.isIdentifier(node.object) && node.object.name === 'props' && t.isIdentifier(node.property)) {
      return node.property.name;
    }
    return null;
  }

  /**
   * Execute getStyles function with given props and context
   */
  private _executeGetStylesFunction(functionNode: t.Node, props: Record<string, any>, context: any): any {
    try {
      // Create a complete props object
      const fullProps = {
        ...props,
        theme: context.theme,
        className: props.className,
      };

      console.log(`>>> Executing getStyles with props: ${JSON.stringify(fullProps, null, 2).substring(0, 300)}`);
      
      // Extract and evaluate the function body
      if (t.isArrowFunctionExpression(functionNode) || t.isFunctionExpression(functionNode) || t.isFunctionDeclaration(functionNode)) {
        const body = functionNode.body;
        
        if (t.isBlockStatement(body)) {
          // Look for return statements
          for (const statement of body.body) {
            if (t.isReturnStatement(statement) && statement.argument) {
              return this._evaluateStyleExpression(statement.argument, fullProps, context);
            }
          }
        } else if (t.isExpression(body)) {
          // Direct expression return (arrow function)
          return this._evaluateStyleExpression(body, fullProps, context);
        }
      }
      
      return null;
    } catch (error) {
      console.log(`>>> Error executing getStyles function: ${error}`);
      return null;
    }
  }

  /**
   * Evaluate a style expression with given props and context
   */
  private _evaluateStyleExpression(node: t.Expression, props: Record<string, any>, context: any): any {
    if (t.isObjectExpression(node)) {
      const result: Record<string, any> = {};
      
      node.properties.forEach(prop => {
        if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
          const key = prop.key.name;
          
          if (t.isExpression(prop.value)) {
            const value = this._evaluateStyleValue(prop.value, props, context);
            if (value !== undefined) {
              result[key] = value;
            }
          }
        }
      });
      
      return result;
    }
    
    return this._evaluateStyleValue(node, props, context);
  }

  /**
   * Evaluate a style value expression (handles arrays, conditionals, objects)
   */
  private _evaluateStyleValue(node: t.Expression, props: Record<string, any>, context: any): any {
    if (t.isArrayExpression(node)) {
      // Handle array of styles with conditional logic
      const result: any[] = [];
      
      node.elements.forEach(element => {
        if (element && t.isExpression(element)) {
          const value = this._evaluateStyleValue(element, props, context);
          if (value !== undefined && value !== null && value !== false) {
            result.push(value);
          }
        }
      });
      
      return result;
    } else if (t.isLogicalExpression(node)) {
      // Handle boolean && style expressions
      if (node.operator === '&&') {
        const leftValue = this._evaluateExpression(node.left, props, context);
        if (leftValue) {
          return this._evaluateStyleValue(node.right, props, context);
        }
        return null;
      }
    } else if (t.isConditionalExpression(node)) {
      // Handle ternary expressions
      const testValue = this._evaluateExpression(node.test, props, context);
      if (testValue) {
        return this._evaluateStyleValue(node.consequent, props, context);
      } else {
        return this._evaluateStyleValue(node.alternate, props, context);
      }
    } else if (t.isObjectExpression(node)) {
      // Handle object styles with special processing for selectors
      const result: Record<string, any> = {};
      
      node.properties.forEach(prop => {
        if (t.isObjectProperty(prop)) {
          let key: string;
          
          if (t.isIdentifier(prop.key)) {
            key = prop.key.name;
          } else if (t.isStringLiteral(prop.key)) {
            key = prop.key.value;
          } else {
            return;
          }

          if (t.isExpression(prop.value)) {
            const value = this._evaluateExpression(prop.value, props, context);
            if (value !== undefined) {
              // Handle special selector patterns
              result[key] = this._processStyleValue(key, value, context);
            }
          }
        }
      });
      
      return result;
    } else if (t.isCallExpression(node)) {
      // Handle function calls that might be custom wrapper functions
      return this._evaluateCustomWrapperFunction(node, props, context);
    } else {
      // Handle primitive expressions
      return this._evaluateExpression(node, props, context);
    }
  }

  /**
   * Process style values to handle special patterns like :global() selectors
   */
  private _processStyleValue(key: string, value: any, context: any): any {
    // Handle selectors object specially
    if (key === 'selectors' && typeof value === 'object' && value !== null) {
      const processedSelectors: Record<string, any> = {};
      
      Object.entries(value).forEach(([selector, selectorValue]) => {
        // Handle :global() selectors
        if (selector.includes(':global(')) {
          console.log(`>>> Processing global selector: ${selector}`);
          // Extract the selector from :global() wrapper
          const globalSelector = selector.replace(/:global\(([^)]+)\)/g, '$1');
          processedSelectors[globalSelector] = selectorValue;
        } else {
          processedSelectors[selector] = selectorValue;
        }
      });
      
      return processedSelectors;
    }
    
    return value;
  }

  /**
   * Evaluate custom wrapper functions that might wrap merge-styles APIs
   */
  private _evaluateCustomWrapperFunction(node: t.CallExpression, props: Record<string, any>, context: any): any {
    // Check if this is a call to a potential wrapper function
    let functionName: string | null = null;
    
    if (t.isIdentifier(node.callee)) {
      functionName = node.callee.name;
    } else if (t.isMemberExpression(node.callee) && t.isIdentifier(node.callee.property)) {
      functionName = node.callee.property.name;
    }

    if (!functionName) return undefined;

    console.log(`>>> Evaluating potential wrapper function: ${functionName}`);

    // Common wrapper function patterns
    const wrapperPatterns = [
      /^create.*Style/i,   // createButtonStyle, createCardStyle, etc.
      /^make.*Style/i,     // makeButtonStyle, etc.
      /^get.*Style/i,      // getButtonStyle, etc.
      /^build.*Style/i,    // buildButtonStyle, etc.
      /^use.*Style/i,      // useButtonStyle, etc.
      /.*StyleHelper$/i,   // buttonStyleHelper, etc.
      /.*StyleUtil$/i,     // buttonStyleUtil, etc.
    ];

    const isLikelyWrapper = wrapperPatterns.some(pattern => pattern.test(functionName!));

    if (isLikelyWrapper) {
      console.log(`>>> Detected wrapper function: ${functionName}`);
      
      // Try to evaluate the arguments and see if they look like style objects
      const evaluatedArgs = node.arguments.map(arg => {
        if (t.isExpression(arg)) {
          return this._evaluateExpression(arg, props, context);
        }
        return undefined;
      }).filter(arg => arg !== undefined);

      // If the wrapper takes style-like arguments, return a placeholder
      if (evaluatedArgs.some(arg => typeof arg === 'object' && arg !== null)) {
        console.log(`>>> Wrapper function ${functionName} appears to process styles, creating placeholder`);
        return {
          __wrapperFunction: functionName,
          __arguments: evaluatedArgs,
          // Return a basic style object as fallback
          display: 'block',
        };
      }
    }

    return undefined;
  }

  /**
   * Evaluate a general expression (member access, template literals, etc.)
   */
  private _evaluateExpression(node: t.Expression, props: Record<string, any>, context: any): any {
    if (t.isStringLiteral(node)) {
      return node.value;
    } else if (t.isNumericLiteral(node)) {
      return node.value;
    } else if (t.isBooleanLiteral(node)) {
      return node.value;
    } else if (t.isIdentifier(node)) {
      // Look up identifier in props or context
      if (props.hasOwnProperty(node.name)) {
        return props[node.name];
      } else if (context.hasOwnProperty(node.name)) {
        return context[node.name];
      }
      return undefined;
    } else if (t.isMemberExpression(node)) {
      // Handle member expressions like props.primary, theme.palette.white
      return this._evaluateMemberExpression(node, props, context);
    } else if (t.isTemplateLiteral(node)) {
      // Handle template literals with interpolation
      return this._evaluateTemplateLiteral(node, props, context);
    } else if (t.isBinaryExpression(node)) {
      // Handle binary expressions like === comparisons
      const left = t.isExpression(node.left) ? this._evaluateExpression(node.left, props, context) : undefined;
      const right = t.isExpression(node.right) ? this._evaluateExpression(node.right, props, context) : undefined;
      
      switch (node.operator) {
        case '===': return left === right;
        case '==': return left == right;
        case '!==': return left !== right;
        case '!=': return left != right;
        default: return undefined;
      }
    } else if (t.isLogicalExpression(node)) {
      // Handle logical expressions
      const left = this._evaluateExpression(node.left, props, context);
      
      if (node.operator === '&&') {
        return left ? this._evaluateExpression(node.right, props, context) : left;
      } else if (node.operator === '||') {
        return left || this._evaluateExpression(node.right, props, context);
      }
    }
    
    return undefined;
  }

  /**
   * Evaluate member expressions (e.g., props.theme.palette.white)
   */
  private _evaluateMemberExpression(node: t.MemberExpression, props: Record<string, any>, context: any): any {
    try {
      let current: any = undefined;
      
      // Start with the object
      if (t.isIdentifier(node.object)) {
        const objName = node.object.name;
        if (objName === 'props') {
          current = props;
        } else if (objName === 'theme') {
          current = context.theme;
        } else if (objName === 'palette') {
          current = context.palette;
        } else if (objName === 'fonts') {
          current = context.fonts;
        } else if (objName === 'effects') {
          current = context.effects;
        } else if (props.hasOwnProperty(objName)) {
          current = props[objName];
        } else if (context.hasOwnProperty(objName)) {
          current = context[objName];
        }
      } else if (t.isMemberExpression(node.object)) {
        current = this._evaluateMemberExpression(node.object, props, context);
      }
      
      if (current === undefined || current === null) {
        return undefined;
      }
      
      // Access the property
      let propertyName: string;
      if (t.isIdentifier(node.property)) {
        propertyName = node.property.name;
      } else if (t.isStringLiteral(node.property)) {
        propertyName = node.property.value;
      } else {
        return undefined;
      }
      
      const result = current[propertyName];
      console.log(`>>> Member expression ${this._memberExpressionToString(node)} = ${result}`);
      return result;
    } catch (error) {
      console.log(`>>> Error evaluating member expression: ${error}`);
      return undefined;
    }
  }
  
  /**
   * Convert member expression to string for debugging
   */
  private _memberExpressionToString(node: t.MemberExpression): string {
    try {
      let objectStr: string;
      if (t.isIdentifier(node.object)) {
        objectStr = node.object.name;
      } else if (t.isMemberExpression(node.object)) {
        objectStr = this._memberExpressionToString(node.object);
      } else {
        objectStr = '[complex]';
      }
      
      let propertyStr: string;
      if (t.isIdentifier(node.property)) {
        propertyStr = node.property.name;
      } else if (t.isStringLiteral(node.property)) {
        propertyStr = node.property.value;
      } else {
        propertyStr = '[complex]';
      }
      
      return `${objectStr}.${propertyStr}`;
    } catch {
      return '[error]';
    }
  }

  /**
   * Evaluate template literals with interpolation
   */
  private _evaluateTemplateLiteral(node: t.TemplateLiteral, props: Record<string, any>, context: any): string {
    let result = '';
    
    for (let i = 0; i < node.quasis.length; i++) {
      result += node.quasis[i].value.cooked || '';
      
      if (i < node.expressions.length) {
        const expression = node.expressions[i];
        if (t.isExpression(expression)) {
          const expressionValue = this._evaluateExpression(expression, props, context);
          result += expressionValue !== undefined ? String(expressionValue) : '';
        }
      }
    }
    
    return result;
  }

  /**
   * Flatten style value (handle arrays and merge objects)
   */
  private _flattenStyleValue(styleValue: any, props: Record<string, any>, context: any): any {
    if (Array.isArray(styleValue)) {
      // Merge array elements into a single style object
      const result: Record<string, any> = {};
      
      styleValue.forEach(item => {
        if (item && typeof item === 'object') {
          Object.assign(result, item);
        } else if (typeof item === 'string') {
          // Handle className strings - merge-styles will handle these
          if (!result.className) {
            result.className = item;
          } else {
            result.className += ' ' + item;
          }
        }
      });
      
      return result;
    } else if (styleValue && typeof styleValue === 'object') {
      return styleValue;
    } else if (typeof styleValue === 'string') {
      return { className: styleValue };
    }
    
    return null;
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
    // Create a mapping from the generated variant classes back to a simplified structure
    const cssClasses = extractedData.cssClasses;
    console.log(`>>> Creating precompiled function with classes: ${JSON.stringify(cssClasses)}`);
    
    // Find the root class (could be root, root_variant0, etc.)
    const rootClassKey = Object.keys(cssClasses).find(key => key.startsWith('root')) || 'root';
    const rootClassName = cssClasses[rootClassKey] || 'css-0';
    
    console.log(`>>> Using root class: ${rootClassKey} -> ${rootClassName}`);
    
    return t.arrowFunctionExpression(
      [t.identifier('props')],
      t.blockStatement([
        t.returnStatement(
          t.objectExpression([
            t.objectProperty(
              t.identifier('root'),
              t.arrayExpression([
                t.stringLiteral(rootClassName),
                t.memberExpression(t.identifier('props'), t.identifier('className'))
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

  /**
   * Handle direct mergeStyles() calls
   */
  private _handleMergeStylesCall(node: t.CallExpression, path: any, stylesheet: any, extractedClasses: string[]): { classes: string[], hasChanges: boolean } {
    console.log(`>>> Handling mergeStyles call with ${node.arguments.length} arguments`);
    
    try {
      // Evaluate the style arguments and call mergeStyles
      const styleArgs: any[] = [];
      
      for (const arg of node.arguments) {
        if (t.isExpression(arg)) {
          const evaluatedStyle = this._evaluateStyleExpression(arg, {}, this._createEvaluationContext());
          if (evaluatedStyle) {
            styleArgs.push(evaluatedStyle);
          }
        }
      }

      if (styleArgs.length > 0) {
        // Import mergeStyles dynamically to avoid conflicts
        const { mergeStyles } = require('@fluentui/merge-styles');
        const className = mergeStyles(...styleArgs);
        console.log(`>>> Generated class from mergeStyles: ${className}`);
        
        extractedClasses.push(className);
        
        // Replace the call with the pre-generated class name
        path.replaceWith(t.stringLiteral(className));
        
        return { classes: [className], hasChanges: true };
      }
    } catch (error) {
      console.log(`>>> Error handling mergeStyles call: ${error}`);
    }
    
    return { classes: [], hasChanges: false };
  }

  /**
   * Handle mergeStyleSets() calls
   */
  private _handleMergeStyleSetsCall(node: t.CallExpression, path: any, stylesheet: any, extractedClasses: string[]): { classes: string[], hasChanges: boolean } {
    console.log(`>>> Handling mergeStyleSets call`);
    
    try {
      if (node.arguments.length > 0 && t.isExpression(node.arguments[0])) {
        const styleSetExpression = node.arguments[0];
        const evaluatedStyleSet = this._evaluateStyleExpression(styleSetExpression, {}, this._createEvaluationContext());
        
        if (evaluatedStyleSet && typeof evaluatedStyleSet === 'object') {
          // Import mergeStyleSets dynamically
          const { mergeStyleSets } = require('@fluentui/merge-styles');
          const classNameMap = mergeStyleSets(evaluatedStyleSet);
          console.log(`>>> Generated class map from mergeStyleSets: ${JSON.stringify(classNameMap)}`);
          
          extractedClasses.push(...Object.values(classNameMap).filter(v => typeof v === 'string') as string[]);
          
          // Replace the call with the pre-generated class name map
          const objectProperties = Object.entries(classNameMap)
            .filter(([key, value]) => typeof value === 'string') // Only include string values
            .map(([key, value]) => 
              t.objectProperty(t.identifier(key), t.stringLiteral(value as string))
            );
          
          path.replaceWith(t.objectExpression(objectProperties));
          
          return { classes: Object.values(classNameMap).filter(v => typeof v === 'string') as string[], hasChanges: true };
        }
      }
    } catch (error) {
      console.log(`>>> Error handling mergeStyleSets call: ${error}`);
    }
    
    return { classes: [], hasChanges: false };
  }

  /**
   * Handle concatStyleSets() and concatStyleSetsWithProps() calls
   */
  private _handleConcatStyleSetsCall(node: t.CallExpression, path: any, stylesheet: any, extractedClasses: string[]): { classes: string[], hasChanges: boolean } {
    console.log(`>>> Handling concatStyleSets call`);
    
    try {
      const styleSetArgs: any[] = [];
      
      for (const arg of node.arguments) {
        if (t.isExpression(arg)) {
          const evaluatedStyleSet = this._evaluateStyleExpression(arg, {}, this._createEvaluationContext());
          if (evaluatedStyleSet) {
            styleSetArgs.push(evaluatedStyleSet);
          }
        }
      }

      if (styleSetArgs.length > 0) {
        // Import concatStyleSets dynamically
        const { concatStyleSets } = require('@fluentui/merge-styles');
        const mergedStyleSet = concatStyleSets(...styleSetArgs);
        console.log(`>>> Generated merged style set: ${JSON.stringify(mergedStyleSet)}`);
        
        if (typeof mergedStyleSet === 'object' && mergedStyleSet !== null) {
          const classNames = Object.values(mergedStyleSet).filter(v => typeof v === 'string');
          extractedClasses.push(...classNames);
          
          // Replace with the merged result
          const objectProperties = Object.entries(mergedStyleSet).map(([key, value]) => 
            t.objectProperty(t.identifier(key), 
              typeof value === 'string' ? t.stringLiteral(value) : t.stringLiteral(String(value))
            )
          );
          
          path.replaceWith(t.objectExpression(objectProperties));
          
          return { classes: classNames, hasChanges: true };
        }
      }
    } catch (error) {
      console.log(`>>> Error handling concatStyleSets call: ${error}`);
    }
    
    return { classes: [], hasChanges: false };
  }

  /**
   * Handle fontFace() calls
   */
  private _handleFontFaceCall(node: t.CallExpression, path: any, stylesheet: any, extractedClasses: string[]): { classes: string[], hasChanges: boolean } {
    console.log(`>>> Handling fontFace call`);
    
    try {
      if (node.arguments.length > 0 && t.isExpression(node.arguments[0])) {
        const fontDescriptor = this._evaluateStyleExpression(node.arguments[0], {}, this._createEvaluationContext());
        
        if (fontDescriptor && typeof fontDescriptor === 'object') {
          // Import fontFace dynamically
          const { fontFace } = require('@fluentui/merge-styles');
          const fontFamilyName = fontFace(fontDescriptor);
          console.log(`>>> Generated font family: ${fontFamilyName}`);
          
          // Replace with the generated font family name
          path.replaceWith(t.stringLiteral(fontFamilyName));
          
          return { classes: [], hasChanges: true }; // Font faces don't generate classes but do generate CSS
        }
      }
    } catch (error) {
      console.log(`>>> Error handling fontFace call: ${error}`);
    }
    
    return { classes: [], hasChanges: false };
  }

  /**
   * Handle keyframes() calls
   */
  private _handleKeyframesCall(node: t.CallExpression, path: any, stylesheet: any, extractedClasses: string[]): { classes: string[], hasChanges: boolean } {
    console.log(`>>> Handling keyframes call`);
    
    try {
      if (node.arguments.length > 0 && t.isExpression(node.arguments[0])) {
        const keyframeDefinition = this._evaluateStyleExpression(node.arguments[0], {}, this._createEvaluationContext());
        
        if (keyframeDefinition && typeof keyframeDefinition === 'object') {
          // Import keyframes dynamically
          const { keyframes } = require('@fluentui/merge-styles');
          const animationName = keyframes(keyframeDefinition);
          console.log(`>>> Generated animation name: ${animationName}`);
          
          // Replace with the generated animation name
          path.replaceWith(t.stringLiteral(animationName));
          
          return { classes: [], hasChanges: true }; // Keyframes don't generate classes but do generate CSS
        }
      }
    } catch (error) {
      console.log(`>>> Error handling keyframes call: ${error}`);
    }
    
    return { classes: [], hasChanges: false };
  }

  /**
   * Handle mergeCss() and mergeCssSets() calls with IStyleOptions
   */
  private _handleMergeCssCall(node: t.CallExpression, path: any, stylesheet: any, extractedClasses: string[]): { classes: string[], hasChanges: boolean } {
    console.log(`>>> Handling mergeCss call`);
    
    try {
      const styleArgs: any[] = [];
      let options: any = {};
      
      // Parse arguments - last one might be IStyleOptions
      for (let i = 0; i < node.arguments.length; i++) {
        const arg = node.arguments[i];
        if (t.isExpression(arg)) {
          const evaluated = this._evaluateStyleExpression(arg, {}, this._createEvaluationContext());
          
          // Check if this looks like IStyleOptions (last argument with specific properties)
          if (i === node.arguments.length - 1 && 
              typeof evaluated === 'object' && 
              evaluated !== null &&
              ('rtl' in evaluated || 'shadowDOMContainer' in evaluated || 'supportsCSSCustomProperties' in evaluated)) {
            options = evaluated;
          } else {
            styleArgs.push(evaluated);
          }
        }
      }

      if (styleArgs.length > 0) {
        // Import mergeCss dynamically
        const { mergeCss } = require('@fluentui/merge-styles');
        const result = mergeCss(...styleArgs, options);
        console.log(`>>> Generated CSS from mergeCss: ${result}`);
        
        if (typeof result === 'string') {
          extractedClasses.push(result);
          path.replaceWith(t.stringLiteral(result));
          return { classes: [result], hasChanges: true };
        }
      }
    } catch (error) {
      console.log(`>>> Error handling mergeCss call: ${error}`);
    }
    
    return { classes: [], hasChanges: false };
  }

  /**
   * Find and collect style files from vendor packages
   */
  private async _findVendorStyleFiles(): Promise<string[]> {
    const vendorFiles: string[] = [];
    const vendorConfig = this._options.vendorExtraction;
    
    if (!vendorConfig || !vendorConfig.enabled || !vendorConfig.packages.length) {
      return vendorFiles;
    }

    this._terminal.writeVerboseLine(`Starting vendor package scanning for ${vendorConfig.packages.length} packages...`);

    for (const packageConfig of vendorConfig.packages) {
      try {
        const packageFiles = await this._processVendorPackage(packageConfig);
        vendorFiles.push(...packageFiles);
      } catch (error) {
        this._terminal.writeWarningLine(`Failed to process vendor package ${packageConfig.packageName}: ${error}`);
        this._metrics.warnings.push({
          file: packageConfig.packageName,
          message: `Vendor package processing failed: ${error}`
        });
      }
    }

    this._terminal.writeVerboseLine(`Found ${vendorFiles.length} vendor style files`);
    return vendorFiles;
  }

  /**
   * Process a single vendor package
   */
  private async _processVendorPackage(packageConfig: IVendorPackageConfig): Promise<string[]> {
    const { packageName, versionRange, include = [], exclude = [] } = packageConfig;
    
    this._terminal.writeVerboseLine(`Processing vendor package: ${packageName}`);

    // Find package path in node_modules
    const packagePath = await this._findPackagePath(packageName);
    if (!packagePath) {
      throw new Error(`Package ${packageName} not found in node_modules`);
    }

    // Check version compatibility
    const packageVersion = await this._getPackageVersion(packagePath);
    const isCompatible = semver.satisfies(packageVersion, versionRange);
    
    const versionMessage = `Version mismatch for ${packageName}: found ${packageVersion}, expected ${versionRange}`;
    
    if (!isCompatible) {
      if (packageConfig.warnOnVersionMismatch !== false) {
        this._terminal.writeWarningLine(versionMessage);
        this._metrics.warnings.push({
          file: packageName,
          message: versionMessage
        });
      }

      if (!packageConfig.allowVersionMismatch) {
        throw new Error(versionMessage);
      }
    }

    // Find style files in the package
    const packageFiles: string[] = [];
    const defaultInclude = [
      '**/*.styles.ts',
      '**/*.styles.tsx',
      '**/*.styles.js',
      '**/*.styles.jsx',
      '**/styles.ts',
      '**/styles.tsx',
      '**/getStyles.ts',
      '**/getStyles.tsx'
    ];

    const includePatterns = include.length > 0 ? include : defaultInclude;
    const excludePatterns = [
      '**/*.test.*',
      '**/*.spec.*',
      '**/test/**',
      '**/tests/**',
      '**/stories/**',
      '**/*.stories.*',
      ...exclude
    ];

    await this._collectVendorFilesRecursively(packagePath, packageFiles, includePatterns, excludePatterns, packageName);

    // Update vendor package metrics
    if (!this._metrics.vendorPackages) {
      this._metrics.vendorPackages = [];
    }

    this._metrics.vendorPackages.push({
      packageName,
      version: packageVersion,
      versionRange,
      compatible: isCompatible,
      filesProcessed: packageFiles.length,
      stylesExtracted: 0, // Will be updated during extraction
      warnings: isCompatible ? [] : [versionMessage]
    });

    this._terminal.writeVerboseLine(`Found ${packageFiles.length} style files in ${packageName}`);
    return packageFiles;
  }

  /**
   * Find the path to a package in node_modules
   */
  private async _findPackagePath(packageName: string): Promise<string | undefined> {
    const nodeModulesPath = path.resolve(this._options.projectFolderPath, 'node_modules');
    const packagePath = path.resolve(nodeModulesPath, packageName);
    
    if (await FileSystem.existsAsync(packagePath)) {
      return packagePath;
    }

    // Try to find in parent directories (for monorepos)
    let currentDir = this._options.projectFolderPath;
    const root = path.parse(currentDir).root;
    
    while (currentDir !== root) {
      const parentNodeModules = path.resolve(currentDir, '..', 'node_modules', packageName);
      if (await FileSystem.existsAsync(parentNodeModules)) {
        return parentNodeModules;
      }
      currentDir = path.dirname(currentDir);
    }

    return undefined;
  }

  /**
   * Get the version of a package from its package.json
   */
  private async _getPackageVersion(packagePath: string): Promise<string> {
    const packageJsonPath = path.resolve(packagePath, 'package.json');
    
    if (!(await FileSystem.existsAsync(packageJsonPath))) {
      throw new Error(`package.json not found in ${packagePath}`);
    }

    const packageJsonContent = await FileSystem.readFileAsync(packageJsonPath);
    const packageJson = JSON.parse(packageJsonContent);
    
    if (!packageJson.version) {
      throw new Error(`Version not found in package.json for ${packagePath}`);
    }

    return packageJson.version;
  }

  /**
   * Recursively collect files from a vendor package directory
   */
  private async _collectVendorFilesRecursively(
    dirPath: string,
    files: string[],
    includePatterns: string[],
    excludePatterns: string[],
    packageName: string
  ): Promise<void> {
    if (!(await FileSystem.existsAsync(dirPath))) {
      return;
    }

    const items = await FileSystem.readFolderItemsAsync(dirPath);
    
    for (const item of items) {
      const fullPath = path.resolve(dirPath, item.name);
      
      if (item.isDirectory()) {
        // Skip certain directories
        if (['node_modules', '.git', 'coverage', 'build', 'dist', 'lib'].includes(item.name)) {
          continue;
        }
        
        await this._collectVendorFilesRecursively(fullPath, files, includePatterns, excludePatterns, packageName);
      } else if (item.isFile()) {
        const relativePath = path.relative(dirPath, fullPath);
        
        // Check include patterns
        const included = includePatterns.some(pattern => this._matchesGlob(relativePath, pattern));
        if (!included) {
          continue;
        }

        // Check exclude patterns
        const excluded = excludePatterns.some(pattern => this._matchesGlob(relativePath, pattern));
        if (excluded) {
          continue;
        }

        files.push(fullPath);
        this._terminal.writeVerboseLine(`Found vendor style file: ${packageName}/${relativePath}`);
      }
    }
  }
}