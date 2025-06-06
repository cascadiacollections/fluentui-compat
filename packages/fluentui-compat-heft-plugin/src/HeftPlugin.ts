/**
 * Configuration and utility for FluentUI style extraction
 */

import { Terminal } from '@rushstack/terminal';

import { FluentStyleExtractor, IFluentStyleExtractorOptions } from './FluentStyleExtractor';
import { IFluentStyleExtractorConfiguration } from './interfaces';

/**
 * Configuration schema for the style extractor
 * @beta
 */
export interface IFluentStyleExtractorPluginConfiguration {
  /**
   * Whether to enable style extraction
   */
  enabled?: boolean;

  /**
   * Style extractor configuration
   */
  styleExtractor?: Partial<IFluentStyleExtractorConfiguration>;
}

/**
 * Utility class for FluentUI style extraction that can be integrated with various build systems
 * @beta
 */
export class FluentStyleExtractorUtility {
  /**
   * Run style extraction with given configuration
   */
  public static async runExtraction(
    projectFolderPath: string,
    buildFolderPath: string,
    terminal: Terminal,
    config?: IFluentStyleExtractorPluginConfiguration
  ): Promise<void> {
    const pluginConfig = config || { enabled: true };
    
    if (!pluginConfig.enabled) {
      terminal.writeVerboseLine('FluentUI style extraction is disabled');
      return;
    }

    try {
      // Prepare extractor options
      const extractorOptions: IFluentStyleExtractorOptions = {
        ...this._getDefaultConfiguration(),
        ...pluginConfig.styleExtractor,
        buildFolderPath,
        projectFolderPath,
        terminal,
      };

      // Create and run extractor
      const extractor = new FluentStyleExtractor(extractorOptions);
      const result = await extractor.extractFromProject();

      if (result.success) {
        terminal.writeLine(`✓ FluentUI style extraction completed successfully`);
        terminal.writeVerboseLine(`  - Files processed: ${result.metrics.filesProcessed}`);
        terminal.writeVerboseLine(`  - Styles extracted: ${result.metrics.stylesExtracted}`);
        terminal.writeVerboseLine(`  - CSS generated: ${Math.round(result.metrics.cssGenerated / 1024)}KB`);
        terminal.writeVerboseLine(`  - Extraction time: ${result.metrics.extractionTime}ms`);
        
        if (result.analysisReport) {
          const reduction = result.analysisReport.performance.bundleReduction;
          if (reduction > 0) {
            terminal.writeLine(`  - Estimated bundle size reduction: ${reduction}%`);
          }
        }
      } else {
        terminal.writeErrorLine('FluentUI style extraction failed');
        for (const error of result.metrics.errors) {
          terminal.writeErrorLine(`  ${error.file}: ${error.message}`);
        }
        
        throw new Error(`FluentUI style extraction failed with ${result.metrics.errors.length} errors`);
      }

    } catch (error) {
      terminal.writeErrorLine(`FluentUI style extraction error: ${error}`);
      throw new Error(`FluentUI style extraction error: ${error}`);
    }
  }

  private static _getDefaultConfiguration(): IFluentStyleExtractorConfiguration {
    return {
      include: [
        'src/**/*.styles.ts',
        'src/**/*.styles.tsx',
        'src/**/*.styles.js',
        'src/**/*.styles.jsx',
      ],
      exclude: [
        'node_modules/**',
        'dist/**',
        'lib/**',
        'temp/**',
        '**/*.test.*',
        '**/*.spec.*',
      ],
      outputDir: 'dist',
      cssFileName: 'fluentui-extracted-styles.css',
      classPrefix: 'fui',
      enableSourceMaps: false,
      minifyCSS: true,
      themeTokens: {
        // Default FluentUI theme tokens
        'colorNeutralForeground1': '#242424',
        'colorNeutralBackground1': '#ffffff',
        'colorBrandBackground': '#0078d4',
        'fontSizeBase100': '10px',
        'fontSizeBase200': '12px',
        'fontSizeBase300': '14px',
        'fontSizeBase400': '16px',
        'fontSizeBase500': '20px',
        'fontSizeBase600': '24px',
        'borderRadiusSmall': '2px',
        'borderRadiusMedium': '4px',
        'borderRadiusLarge': '6px',
        'spacingHorizontalXS': '2px',
        'spacingHorizontalS': '4px',
        'spacingHorizontalM': '8px',
        'spacingHorizontalL': '12px',
        'spacingHorizontalXL': '16px',
        'spacingVerticalXS': '2px',
        'spacingVerticalS': '4px',
        'spacingVerticalM': '8px',
        'spacingVerticalL': '12px',
        'spacingVerticalXL': '16px',
      },
      vendorExtraction: {
        enabled: false, // Disabled by default - opt-in feature
        packages: [
          // Example configurations for common FluentUI packages
          // Users can override these in their configuration
        ],
        globalSettings: {
          separateVendorCSS: false,
          vendorClassPrefix: 'fui-vendor',
          strictVersionChecking: false,
        },
      },
    };
  }
}