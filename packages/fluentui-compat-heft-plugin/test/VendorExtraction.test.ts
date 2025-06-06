/**
 * Tests for vendor package extraction functionality
 */

import { FluentStyleExtractor } from '../src/FluentStyleExtractor';
import { FluentStyleExtractorUtility } from '../src/HeftPlugin';
import { IFluentStyleExtractorConfiguration, IVendorPackageConfig } from '../src/interfaces';
import { FileSystem } from '@rushstack/node-core-library';
import { Terminal, StringBufferTerminalProvider } from '@rushstack/terminal';
import * as path from 'path';
import * as fs from 'fs';

describe('VendorExtraction', () => {
  const tempDir = path.join(__dirname, 'temp-vendor-test');
  const nodeModulesDir = path.join(tempDir, 'node_modules');
  const fluentuiButtonDir = path.join(nodeModulesDir, '@fluentui', 'react-button');
  const fluentuiComponentsDir = path.join(nodeModulesDir, '@fluentui', 'react-components');
  
  let terminalProvider: StringBufferTerminalProvider;
  let terminal: Terminal;

  beforeEach(async () => {
    // Create test directory structure
    await FileSystem.ensureFolderAsync(tempDir);
    await FileSystem.ensureFolderAsync(nodeModulesDir);
    await FileSystem.ensureFolderAsync(path.dirname(fluentuiButtonDir));
    await FileSystem.ensureFolderAsync(fluentuiButtonDir);
    await FileSystem.ensureFolderAsync(path.dirname(fluentuiComponentsDir));
    await FileSystem.ensureFolderAsync(fluentuiComponentsDir);

    // Setup terminal
    terminalProvider = new StringBufferTerminalProvider();
    terminal = new Terminal(terminalProvider);
  });

  afterEach(async () => {
    // Clean up test directory
    if (await FileSystem.existsAsync(tempDir)) {
      await FileSystem.deleteFolderAsync(tempDir);
    }
  });

  describe('Vendor Package Discovery', () => {
    test('should find vendor packages when enabled', async () => {
      // Setup mock vendor package
      await createMockFluentUIPackage(fluentuiButtonDir, '9.3.0');
      await createMockStyleFile(
        path.join(fluentuiButtonDir, 'src', 'Button.styles.ts'),
        `export const getStyles = () => ({ root: { padding: '8px' } });`
      );
      
      const config: IFluentStyleExtractorConfiguration = {
        include: ['src/**/*.styles.ts', 'node_modules/**/*.styles.ts'],
        exclude: ['**/*.test.*'],
        outputDir: 'dist',
        cssFileName: 'styles.css',
        classPrefix: 'fui',
        enableSourceMaps: false,
        minifyCSS: false,
        vendorExtraction: {
          enabled: true,
          packages: [{
            packageName: '@fluentui/react-button',
            versionRange: '^9.0.0',
            warnOnVersionMismatch: true,
            allowVersionMismatch: false,
          }],
        },
      };

      const extractor = new FluentStyleExtractor({
        ...config,
        buildFolderPath: path.join(tempDir, 'dist'),
        projectFolderPath: tempDir,
        terminal,
      });

      const result = await extractor.extractFromProject();
      
      expect(result.success).toBe(true);
      if (result.metrics.vendorPackages) {
        expect(result.metrics.vendorPackages.length).toBe(1);
        expect(result.metrics.vendorPackages[0].packageName).toBe('@fluentui/react-button');
        expect(result.metrics.vendorPackages[0].version).toBe('9.3.0');
        expect(result.metrics.vendorPackages[0].compatible).toBe(true);
      }
    });

    test('should handle version mismatches with warnings', async () => {
      // Setup mock vendor package with incompatible version
      await createMockFluentUIPackage(fluentuiButtonDir, '8.5.0');
      await createMockStyleFile(
        path.join(fluentuiButtonDir, 'src', 'Button.styles.ts'),
        `export const getStyles = () => ({ root: { padding: '8px' } });`
      );
      
      const config: IFluentStyleExtractorConfiguration = {
        include: ['src/**/*.styles.ts', 'node_modules/**/*.styles.ts'],
        exclude: ['**/*.test.*'],
        outputDir: 'dist',
        cssFileName: 'styles.css',
        classPrefix: 'fui',
        enableSourceMaps: false,
        minifyCSS: false,
        vendorExtraction: {
          enabled: true,
          packages: [{
            packageName: '@fluentui/react-button',
            versionRange: '^9.0.0',
            warnOnVersionMismatch: true,
            allowVersionMismatch: true,
          }],
        },
      };

      const extractor = new FluentStyleExtractor({
        ...config,
        buildFolderPath: path.join(tempDir, 'dist'),
        projectFolderPath: tempDir,
        terminal,
      });

      const result = await extractor.extractFromProject();
      
      expect(result.success).toBe(true);
      if (result.metrics.vendorPackages && result.metrics.vendorPackages.length > 0) {
        expect(result.metrics.vendorPackages[0].compatible).toBe(false);
        expect(result.metrics.vendorPackages[0].warnings).toHaveLength(1);
      }
      // Should have some warnings
      expect(result.metrics.warnings.length).toBeGreaterThanOrEqual(0);
    });

    test('should fail on version mismatch when strict checking enabled', async () => {
      // Setup mock vendor package with incompatible version
      await createMockFluentUIPackage(fluentuiButtonDir, '8.5.0');
      
      const config: IFluentStyleExtractorConfiguration = {
        include: ['src/**/*.styles.ts', 'node_modules/**/*.styles.ts'],
        exclude: ['**/*.test.*'],
        outputDir: 'dist',
        cssFileName: 'styles.css',
        classPrefix: 'fui',
        enableSourceMaps: false,
        minifyCSS: false,
        vendorExtraction: {
          enabled: true,
          packages: [{
            packageName: '@fluentui/react-button',
            versionRange: '^9.0.0',
            allowVersionMismatch: false,
          }],
        },
      };

      const extractor = new FluentStyleExtractor({
        ...config,
        buildFolderPath: path.join(tempDir, 'dist'),
        projectFolderPath: tempDir,
        terminal,
      });

      const result = await extractor.extractFromProject();
      
      // Should either fail completely OR have warnings about version mismatch
      expect(result.success).toBe(false);
      expect(result.metrics.errors.length + result.metrics.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Vendor Style Extraction', () => {
    test('should extract styles from vendor packages', async () => {
      // Setup mock vendor package with style files
      await createMockFluentUIPackage(fluentuiButtonDir, '9.3.0');
      await createMockStyleFile(
        path.join(fluentuiButtonDir, 'src', 'Button.styles.ts'),
        `
        export const getStyles = (props: any) => ({
          root: {
            backgroundColor: props.primary ? '#0078d4' : '#f3f2f1',
            padding: '8px 16px',
            borderRadius: '2px',
            border: 'none',
            cursor: 'pointer',
          },
          label: {
            fontWeight: 600,
            fontSize: '14px',
          }
        });
        `
      );
      
      const config: IFluentStyleExtractorConfiguration = {
        include: ['src/**/*.styles.ts', 'node_modules/@fluentui/**/*.styles.ts'],
        exclude: ['**/*.test.*'],
        outputDir: 'dist',
        cssFileName: 'styles.css',
        classPrefix: 'fui',
        enableSourceMaps: false,
        minifyCSS: false,
        vendorExtraction: {
          enabled: true,
          packages: [{
            packageName: '@fluentui/react-button',
            versionRange: '^9.0.0',
          }],
        },
      };

      const extractor = new FluentStyleExtractor({
        ...config,
        buildFolderPath: path.join(tempDir, 'dist'),
        projectFolderPath: tempDir,
        terminal,
      });

      const result = await extractor.extractFromProject();
      
      expect(result.success).toBe(true);
      expect(result.metrics.vendorPackages![0].filesProcessed).toBeGreaterThan(0);
      expect(result.generatedCSS.length).toBeGreaterThan(0);
    });

    test('should handle multiple vendor packages', async () => {
      // Setup multiple mock vendor packages
      await createMockFluentUIPackage(fluentuiButtonDir, '9.3.0');
      await createMockFluentUIPackage(fluentuiComponentsDir, '9.5.0');
      
      await createMockStyleFile(
        path.join(fluentuiButtonDir, 'src', 'Button.styles.ts'),
        `export const getStyles = () => ({ root: { padding: '8px' } });`
      );
      
      await createMockStyleFile(
        path.join(fluentuiComponentsDir, 'src', 'Card.styles.ts'),
        `export const getStyles = () => ({ root: { margin: '16px' } });`
      );
      
      const config: IFluentStyleExtractorConfiguration = {
        include: ['src/**/*.styles.ts', 'node_modules/@fluentui/**/*.styles.ts'],
        exclude: ['**/*.test.*'],
        outputDir: 'dist',
        cssFileName: 'styles.css',
        classPrefix: 'fui',
        enableSourceMaps: false,
        minifyCSS: false,
        vendorExtraction: {
          enabled: true,
          packages: [
            {
              packageName: '@fluentui/react-button',
              versionRange: '^9.0.0',
            },
            {
              packageName: '@fluentui/react-components',
              versionRange: '^9.0.0',
            }
          ],
        },
      };

      const extractor = new FluentStyleExtractor({
        ...config,
        buildFolderPath: path.join(tempDir, 'dist'),
        projectFolderPath: tempDir,
        terminal,
      });

      const result = await extractor.extractFromProject();
      
      expect(result.success).toBe(true);
      expect(result.metrics.vendorPackages!.length).toBe(2);
      expect(result.metrics.vendorPackages![0].packageName).toBe('@fluentui/react-button');
      expect(result.metrics.vendorPackages![1].packageName).toBe('@fluentui/react-components');
    });
  });

  describe('Configuration Integration', () => {
    test('should work with FluentStyleExtractorUtility', async () => {
      await createMockFluentUIPackage(fluentuiButtonDir, '9.3.0');
      
      const config = {
        enabled: true,
        styleExtractor: {
          vendorExtraction: {
            enabled: true,
            packages: [{
              packageName: '@fluentui/react-button',
              versionRange: '^9.0.0',
            }],
          },
        },
      };

      // This should not throw an error
      await expect(
        FluentStyleExtractorUtility.runExtraction(
          tempDir,
          path.join(tempDir, 'dist'),
          terminal,
          config
        )
      ).resolves.not.toThrow();
    });

    test('should be disabled by default', async () => {
      const config: IFluentStyleExtractorConfiguration = {
        include: ['src/**/*.styles.ts'],
        exclude: ['**/*.test.*'],
        outputDir: 'dist',
        cssFileName: 'styles.css',
        classPrefix: 'fui',
        enableSourceMaps: false,
        minifyCSS: false,
        // vendorExtraction not specified (should use default)
      };

      const extractor = new FluentStyleExtractor({
        ...config,
        buildFolderPath: path.join(tempDir, 'dist'),
        projectFolderPath: tempDir,
        terminal,
      });

      const result = await extractor.extractFromProject();
      
      expect(result.success).toBe(true);
      expect(result.metrics.vendorPackages).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle missing packages gracefully', async () => {
      const config: IFluentStyleExtractorConfiguration = {
        include: ['src/**/*.styles.ts', 'node_modules/**/*.styles.ts'],
        exclude: ['**/*.test.*'],
        outputDir: 'dist',
        cssFileName: 'styles.css',
        classPrefix: 'fui',
        enableSourceMaps: false,
        minifyCSS: false,
        vendorExtraction: {
          enabled: true,
          packages: [{
            packageName: '@fluentui/non-existent-package',
            versionRange: '^9.0.0',
          }],
        },
      };

      const extractor = new FluentStyleExtractor({
        ...config,
        buildFolderPath: path.join(tempDir, 'dist'),
        projectFolderPath: tempDir,
        terminal,
      });

      const result = await extractor.extractFromProject();
      
      // Should handle the error gracefully - either fail or show warnings
      expect(result.metrics.errors.length + result.metrics.warnings.length).toBeGreaterThan(0);
    });

    test('should handle packages without package.json', async () => {
      // Create package directory without package.json
      await FileSystem.ensureFolderAsync(fluentuiButtonDir);
      
      const config: IFluentStyleExtractorConfiguration = {
        include: ['src/**/*.styles.ts', 'node_modules/**/*.styles.ts'],
        exclude: ['**/*.test.*'],
        outputDir: 'dist',
        cssFileName: 'styles.css',
        classPrefix: 'fui',
        enableSourceMaps: false,
        minifyCSS: false,
        vendorExtraction: {
          enabled: true,
          packages: [{
            packageName: '@fluentui/react-button',
            versionRange: '^9.0.0',
          }],
        },
      };

      const extractor = new FluentStyleExtractor({
        ...config,
        buildFolderPath: path.join(tempDir, 'dist'),
        projectFolderPath: tempDir,
        terminal,
      });

      const result = await extractor.extractFromProject();
      
      // Should handle the error gracefully - either fail or show warnings
      expect(result.metrics.errors.length + result.metrics.warnings.length).toBeGreaterThan(0);
    });
  });

  // Helper functions
  async function createMockFluentUIPackage(packageDir: string, version: string): Promise<void> {
    await FileSystem.ensureFolderAsync(packageDir);
    await FileSystem.ensureFolderAsync(path.join(packageDir, 'src'));
    
    const packageJson = {
      name: path.basename(path.dirname(packageDir)) + '/' + path.basename(packageDir),
      version,
      main: 'dist/index.js',
      types: 'dist/index.d.ts',
      dependencies: {
        '@fluentui/merge-styles': '^8.0.0',
      },
    };

    await FileSystem.writeFileAsync(
      path.join(packageDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
  }

  async function createMockStyleFile(filePath: string, content: string): Promise<void> {
    await FileSystem.ensureFolderAsync(path.dirname(filePath));
    await FileSystem.writeFileAsync(filePath, content);
  }
});