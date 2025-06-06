/**
 * FluentUI Style Extractor Plugin
 * 
 * A build-time tool that extracts FluentUI merge-styles from runtime code
 * and generates static CSS files for better performance.
 */

export { FluentStyleExtractor, IFluentStyleExtractorOptions } from './FluentStyleExtractor';
export { FluentStyleExtractorUtility, IFluentStyleExtractorPluginConfiguration } from './HeftPlugin';
export * from './interfaces';

// Default export for easy usage
export { FluentStyleExtractorUtility as default } from './HeftPlugin';