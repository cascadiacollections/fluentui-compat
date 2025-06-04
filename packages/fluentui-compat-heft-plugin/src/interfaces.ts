/**
 * Interfaces for FluentUI Style Extractor
 */

/**
 * Error information for extraction failures
 */
export interface IStyleExtractionError {
  file: string;
  message: string;
  error: unknown;
}

/**
 * Warning information for extraction issues
 */
export interface IStyleExtractionWarning {
  file: string;
  message: string;
}

/**
 * Metrics collected during style extraction
 */
export interface IStyleExtractionMetrics {
  filesProcessed: number;
  stylesExtracted: number;
  cssGenerated: number;
  errors: IStyleExtractionError[];
  warnings: IStyleExtractionWarning[];
  extractionTime: number;
}

/**
 * Configuration for the FluentUI Style Extractor
 */
export interface IFluentStyleExtractorConfiguration {
  /**
   * File patterns to include in extraction
   */
  include: string[];
  
  /**
   * File patterns to exclude from extraction
   */
  exclude: string[];
  
  /**
   * Output directory for generated CSS files
   */
  outputDir: string;
  
  /**
   * Name of the generated CSS file
   */
  cssFileName: string;
  
  /**
   * CSS class prefix for generated classes
   */
  classPrefix: string;
  
  /**
   * Whether to enable source maps
   */
  enableSourceMaps: boolean;
  
  /**
   * Whether to minify the generated CSS
   */
  minifyCSS: boolean;
  
  /**
   * Theme tokens to include as CSS custom properties
   */
  themeTokens?: Record<string, string>;
}

/**
 * Result of processing a single file
 */
export interface IFileExtractionResult {
  filePath: string;
  relativePath: string;
  originalCode?: string;
  transformedCode?: string;
  extractedCSS?: string;
  extractedClasses?: string[];
  success: boolean;
  error?: string;
}

/**
 * Analysis report for the extraction process
 */
export interface IAnalysisReport {
  summary: {
    filesProcessed: number;
    stylesExtracted: number;
    cssSize: number; // in KB
    totalClasses: number;
    errors: number;
    warnings: number;
    extractionTime: number;
  };
  performance: {
    bundleReduction: number; // estimated percentage
    avgExtractionTimePerFile: number;
  };
  optimizations: Array<{
    type: string;
    suggestion: string;
  }>;
  files: Array<{
    path: string;
    classes: number;
    cssSize: number;
  }>;
  errors: Array<{
    path: string;
    error: string;
  }>;
}

/**
 * Result of the entire extraction process
 */
export interface IExtractionResult {
  success: boolean;
  metrics: IStyleExtractionMetrics;
  extractedFiles: IFileExtractionResult[];
  generatedCSS: string;
  analysisReport: IAnalysisReport | null;
}