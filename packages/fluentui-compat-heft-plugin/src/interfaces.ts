/**
 * Interfaces for FluentUI Style Extractor
 */

/**
 * Error information for extraction failures
 * @beta
 */
export interface IStyleExtractionError {
  file: string;
  message: string;
  error: unknown;
}

/**
 * Warning information for extraction issues
 * @beta
 */
export interface IStyleExtractionWarning {
  file: string;
  message: string;
}

/**
 * Information about a processed vendor package
 * @beta
 */
export interface IVendorPackageInfo {
  packageName: string;
  version: string;
  versionRange: string;
  compatible: boolean;
  filesProcessed: number;
  stylesExtracted: number;
  warnings: string[];
}

/**
 * Metrics collected during style extraction
 * @beta
 */
export interface IStyleExtractionMetrics {
  filesProcessed: number;
  stylesExtracted: number;
  cssGenerated: number;
  errors: IStyleExtractionError[];
  warnings: IStyleExtractionWarning[];
  extractionTime: number;
  vendorPackages?: IVendorPackageInfo[];
}

/**
 * Configuration for vendor package extraction
 * @beta
 */
export interface IVendorPackageConfig {
  /**
   * Name of the package to extract from (e.g., '@fluentui/react-button')
   */
  packageName: string;
  
  /**
   * Semver range for compatible versions (e.g., '^9.0.0')
   */
  versionRange: string;
  
  /**
   * File patterns to include within the package
   */
  include?: string[];
  
  /**
   * File patterns to exclude within the package
   */
  exclude?: string[];
  
  /**
   * Whether to show warnings for version mismatches
   */
  warnOnVersionMismatch?: boolean;
  
  /**
   * Whether to continue extraction even if version doesn't match
   */
  allowVersionMismatch?: boolean;
}

/**
 * Configuration for vendor package optimization
 * @beta
 */
export interface IVendorExtractionConfig {
  /**
   * Whether to enable vendor package extraction
   */
  enabled: boolean;
  
  /**
   * List of vendor packages to extract from
   */
  packages: IVendorPackageConfig[];
  
  /**
   * Global settings for vendor extraction
   */
  globalSettings?: {
    /**
     * Whether to create separate CSS files for vendor packages
     */
    separateVendorCSS?: boolean;
    
    /**
     * Prefix for vendor CSS classes
     */
    vendorClassPrefix?: string;
    
    /**
     * Whether to fail build on version mismatches
     */
    strictVersionChecking?: boolean;
  };
}

/**
 * Configuration for the FluentUI Style Extractor
 * @beta
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
  
  /**
   * Vendor package extraction configuration
   */
  vendorExtraction?: IVendorExtractionConfig;
}

/**
 * Result of processing a single file
 * @beta
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
 * @beta
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
    vendorPackagesProcessed?: number;
  };
  performance: {
    bundleReduction: number; // estimated percentage
    avgExtractionTimePerFile: number;
    vendorOptimization?: {
      packagesProcessed: number;
      estimatedSavings: number; // in KB
    };
  };
  optimizations: Array<{
    type: string;
    suggestion: string;
  }>;
  files: Array<{
    path: string;
    classes: number;
    cssSize: number;
    isVendor?: boolean;
    packageName?: string;
  }>;
  errors: Array<{
    path: string;
    error: string;
  }>;
  vendorPackages?: Array<{
    name: string;
    version: string;
    compatible: boolean;
    filesProcessed: number;
    optimizations: number;
  }>;
}

/**
 * Result of the entire extraction process
 * @beta
 */
export interface IExtractionResult {
  success: boolean;
  metrics: IStyleExtractionMetrics;
  extractedFiles: IFileExtractionResult[];
  generatedCSS: string;
  analysisReport: IAnalysisReport | null;
}