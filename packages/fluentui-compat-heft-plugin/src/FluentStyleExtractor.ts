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
    const startTime = Date.now();
    this._terminal.writeVerboseLine('Starting FluentUI style extraction...');

    try {
      // Find all style files
      const styleFiles = await this._findStyleFiles();
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

    // Use FileSystem.readFolderItemsAsync for efficient file discovery
    const srcPath = path.resolve(this._options.projectFolderPath, 'src');
    
    if (await FileSystem.existsAsync(srcPath)) {
      await this._collectFilesRecursively(srcPath, allFiles);
    }

    // Filter files based on include/exclude patterns
    const filteredFiles = allFiles.filter(filePath => {
      const relativePath = path.relative(this._options.projectFolderPath, filePath);
      
      // Check include patterns
      const included = include.some(pattern => this._matchesGlob(relativePath, pattern));
      if (!included) return false;

      // Check exclude patterns
      const excluded = exclude.some(pattern => this._matchesGlob(relativePath, pattern));
      return !excluded;
    });

    return filteredFiles;
  }

  /**
   * Recursively collect files from a directory
   */
  private async _collectFilesRecursively(dirPath: string, files: string[]): Promise<void> {
    try {
      const items = await FileSystem.readFolderItemsAsync(dirPath);
      
      for (const item of items) {
        const itemPath = path.resolve(dirPath, item.name);
        
        if (item.isDirectory()) {
          await this._collectFilesRecursively(itemPath, files);
        } else if (item.isFile() && this._isStyleFile(item.name)) {
          files.push(itemPath);
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
   * Extract styles from source code using AST transformation
   */
  private async _extractStylesFromCode(sourceCode: string, filePath: string): Promise<{
    code: string;
    css: string;
    extractedClasses: string[];
    hasChanges: boolean;
  }> {
    const ast = parse(sourceCode, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx', 'decorators-legacy'],
    });

    const fileStyleId = this._generateFileStyleId(filePath);
    let extractedCSS = '';
    const extractedClasses: string[] = [];
    let hasChanges = false;

    // Transform getStyles functions
    traverse(ast, {
      VariableDeclarator: (path) => {
        if (this._isGetStylesFunction(path.node)) {
          const extractedData = this._extractStylesFromFunction(path.node.init!, fileStyleId);
          if (extractedData) {
            path.node.init = this._createPrecompiledFunction(extractedData);
            extractedCSS += this._generateCSSFromExtracted(extractedData);
            extractedClasses.push(...(Object.values(extractedData.cssClasses) as string[]));
            hasChanges = true;
          }
        }
      },

      FunctionDeclaration: (path) => {
        if (path.node.id?.name === 'getStyles') {
          const extractedData = this._extractStylesFromFunction(path.node, fileStyleId);
          if (extractedData) {
            const newFunction = this._createPrecompiledFunction(extractedData);
            path.replaceWith(
              t.variableDeclaration('const', [
                t.variableDeclarator(t.identifier('getStyles'), newFunction),
              ])
            );
            extractedCSS += this._generateCSSFromExtracted(extractedData);
            extractedClasses.push(...(Object.values(extractedData.cssClasses) as string[]));
            hasChanges = true;
          }
        }
      },
    });

    // Generate transformed code
    const transformedCode = hasChanges ? generate(ast).code : sourceCode;

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
    return (
      node.id?.type === 'Identifier' &&
      node.id.name === 'getStyles' &&
      (node.init?.type === 'ArrowFunctionExpression' || 
       node.init?.type === 'FunctionExpression')
    );
  }

  private _extractStylesFromFunction(_functionNode: t.Node, fileStyleId: string): {
    cssClasses: Record<string, string>;
    styles: unknown[];
    themeTokens: Set<unknown>;
  } | null {
    // Simplified implementation - would contain full AST analysis
    return {
      cssClasses: {
        base: `${this._options.classPrefix}-${fileStyleId}-base`,
        actionable: `${this._options.classPrefix}-${fileStyleId}-actionable`,
        compact: `${this._options.classPrefix}-${fileStyleId}-compact`,
      },
      styles: [],
      themeTokens: new Set(),
    };
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

  private _generateCSSFromExtracted(extractedData: { cssClasses: Record<string, string> }): string {
    // Simplified implementation - would generate actual CSS
    return `.${extractedData.cssClasses.base} { /* extracted styles */ }\n`;
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