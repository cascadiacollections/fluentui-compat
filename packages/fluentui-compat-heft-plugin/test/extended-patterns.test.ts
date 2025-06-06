/**
 * Integration tests for extended merge-styles API patterns
 * Tests real-world usage scenarios for the new API coverage
 */

import { FluentStyleExtractor } from '../src/FluentStyleExtractor';
import { Terminal } from '@rushstack/terminal';
import { FileSystem } from '@rushstack/node-core-library';
import * as path from 'path';
import * as os from 'os';

describe('Extended merge-styles API Patterns Integration', () => {
  let mockTerminal: Terminal;
  let tempDir: string;

  beforeEach(async () => {
    const provider = {
      write: jest.fn(),
      writeError: jest.fn(),
      writeWarning: jest.fn(),
      writeVerbose: jest.fn(),
      writeLine: jest.fn(),
      writeErrorLine: jest.fn(),
      writeWarningLine: jest.fn(),
      writeVerboseLine: jest.fn(),
      eolCharacter: '\n',
      supportsColor: false,
      verboseEnabled: true,
      debugEnabled: false
    };
    
    mockTerminal = new Terminal(provider);

    // Create temporary directory for test files
    tempDir = path.join(os.tmpdir(), `fluentui-extended-test-${Date.now()}-${Math.random().toString(36).substring(7)}`);
    await FileSystem.ensureFolderAsync(tempDir);
  });

  afterEach(async () => {
    // Clean up temp directory
    if (await FileSystem.existsAsync(tempDir)) {
      await FileSystem.deleteFolderAsync(tempDir);
    }
  });

  const createExtractor = (overrides = {}) => {
    const options = {
      include: ['**/*.styles.ts', '**/*.styles.tsx'],
      exclude: ['node_modules/**', '**/*.test.*'],
      outputDir: 'dist',
      cssFileName: 'extracted-styles.css',
      classPrefix: 'fui',
      enableSourceMaps: false,
      minifyCSS: false,
      buildFolderPath: path.join(tempDir, 'build'),
      projectFolderPath: tempDir,
      terminal: mockTerminal,
      themeTokens: {
        colorBrandBackground: '#0078d4',
        fontSizeBase300: '14px',
        borderRadiusSmall: '2px'
      },
      ...overrides
    };

    return new FluentStyleExtractor(options);
  };

  describe('mergeStyleSets() Direct Usage', () => {
    it('should extract styles from direct mergeStyleSets calls', async () => {
      const sourceCode = `
        import { mergeStyleSets } from '@fluentui/merge-styles';

        export const buttonClassNames = mergeStyleSets({
          root: {
            backgroundColor: '#f3f2f1',
            border: '1px solid #c8c6c4',
            padding: '8px 16px',
            borderRadius: '2px'
          },
          icon: {
            fontSize: '16px',
            marginRight: '8px'
          },
          label: {
            fontWeight: '600',
            fontSize: '14px'
          }
        });
      `;

      const srcDir = path.join(tempDir, 'src');
      await FileSystem.ensureFolderAsync(srcDir);
      await FileSystem.writeFileAsync(path.join(srcDir, 'Button.styles.ts'), sourceCode);

      const extractor = createExtractor();
      const result = await extractor.extractFromProject();

      expect(result.success).toBe(true);
      expect(result.extractedFiles.length).toBe(1);
      
      const extractedFile = result.extractedFiles[0];
      expect(extractedFile.success).toBe(true);
      expect(extractedFile.extractedClasses?.length).toBeGreaterThan(0);
      expect(result.generatedCSS.length).toBeGreaterThan(0);
    });
  });

  describe('concatStyleSets/concatStyleSetsWithProps Usage', () => {
    it('should extract styles from concatStyleSets calls', async () => {
      const sourceCode = `
        import { concatStyleSets } from '@fluentui/merge-styles';

        const baseStyles = {
          root: { margin: '0', padding: '0' },
          content: { display: 'flex' }
        };

        const themeStyles = {
          root: { backgroundColor: '#ffffff' },
          header: { borderBottom: '1px solid #edebe9' }
        };

        export const combinedStyles = concatStyleSets(baseStyles, themeStyles);
      `;

      const srcDir = path.join(tempDir, 'src');
      await FileSystem.ensureFolderAsync(srcDir);
      await FileSystem.writeFileAsync(path.join(srcDir, 'Combined.styles.ts'), sourceCode);

      const extractor = createExtractor();
      const result = await extractor.extractFromProject();

      expect(result.success).toBe(true);
      expect(result.extractedFiles.length).toBe(1);
      expect(result.extractedFiles[0].success).toBe(true);
    });
  });

  describe('fontFace() and keyframes() Usage', () => {
    it('should handle fontFace registrations', async () => {
      const sourceCode = `
        import { fontFace } from '@fluentui/merge-styles';

        export const customFont = fontFace({
          fontFamily: 'SegoeUI',
          src: "url('segoeui.woff2') format('woff2')",
          fontWeight: 400,
          fontStyle: 'normal'
        });

        export const useCustomFont = () => ({
          root: {
            fontFamily: customFont,
            fontSize: '14px'
          }
        });
      `;

      const srcDir = path.join(tempDir, 'src');
      await FileSystem.ensureFolderAsync(srcDir);
      await FileSystem.writeFileAsync(path.join(srcDir, 'Fonts.styles.ts'), sourceCode);

      const extractor = createExtractor();
      const result = await extractor.extractFromProject();

      expect(result.success).toBe(true);
      expect(result.extractedFiles.length).toBe(1);
      expect(result.extractedFiles[0].success).toBe(true);
    });

    it('should handle keyframes animations', async () => {
      const sourceCode = `
        import { keyframes } from '@fluentui/merge-styles';

        export const fadeIn = keyframes({
          '0%': { opacity: 0, transform: 'translateY(-10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' }
        });

        export const getAnimationStyles = () => ({
          root: {
            animationName: fadeIn,
            animationDuration: '300ms',
            animationTimingFunction: 'ease-out'
          }
        });
      `;

      const srcDir = path.join(tempDir, 'src');
      await FileSystem.ensureFolderAsync(srcDir);
      await FileSystem.writeFileAsync(path.join(srcDir, 'Animations.styles.ts'), sourceCode);

      const extractor = createExtractor();
      const result = await extractor.extractFromProject();

      expect(result.success).toBe(true);
      expect(result.extractedFiles.length).toBe(1);
      expect(result.extractedFiles[0].success).toBe(true);
    });
  });

  describe('Inline merge-styles calls', () => {
    it('should extract styles from inline mergeStyles calls', async () => {
      const sourceCode = `
        import React from 'react';
        import { mergeStyles } from '@fluentui/merge-styles';

        export const InlineComponent = ({ primary, disabled }) => {
          return (
            <div 
              className={mergeStyles({
                backgroundColor: primary ? '#0078d4' : '#f3f2f1',
                color: primary ? '#ffffff' : '#323130',
                opacity: disabled ? 0.6 : 1,
                padding: '12px 24px',
                borderRadius: '4px',
                cursor: disabled ? 'not-allowed' : 'pointer'
              })}
            >
              <span className={mergeStyles({
                fontSize: '14px',
                fontWeight: '600',
                lineHeight: '20px'
              })}>
                Button Text
              </span>
            </div>
          );
        };
      `;

      const srcDir = path.join(tempDir, 'src');
      await FileSystem.ensureFolderAsync(srcDir);
      await FileSystem.writeFileAsync(path.join(srcDir, 'InlineComponent.styles.tsx'), sourceCode);

      const extractor = createExtractor();
      const result = await extractor.extractFromProject();

      expect(result.success).toBe(true);
      expect(result.extractedFiles.length).toBe(1);
      expect(result.extractedFiles[0].success).toBe(true);
    });
  });

  describe('Global selectors and advanced patterns', () => {
    it('should handle global selectors correctly', async () => {
      const sourceCode = `
        export const getGlobalStyles = () => ({
          root: {
            position: 'relative',
            overflow: 'hidden',
            selectors: {
              ':global(.custom-theme)': {
                backgroundColor: '#f8f7f6'
              },
              ':global(.high-contrast) &': {
                borderColor: 'WindowText',
                color: 'WindowText'
              },
              ':hover': {
                backgroundColor: '#f3f2f1'
              },
              ':global(.dark-theme) .content': {
                color: '#ffffff'
              }
            }
          }
        });
      `;

      const srcDir = path.join(tempDir, 'src');
      await FileSystem.ensureFolderAsync(srcDir);
      await FileSystem.writeFileAsync(path.join(srcDir, 'GlobalStyles.styles.ts'), sourceCode);

      const extractor = createExtractor();
      const result = await extractor.extractFromProject();

      expect(result.success).toBe(true);
      expect(result.extractedFiles.length).toBe(1);
      expect(result.extractedFiles[0].success).toBe(true);
    });
  });

  describe('Custom wrapper functions', () => {
    it('should detect and handle custom wrapper functions', async () => {
      const sourceCode = `
        // Custom wrapper function that processes styles
        const createComponentStyle = (baseStyles, themeStyles) => {
          return {
            ...baseStyles,
            ...themeStyles,
            position: 'relative'
          };
        };

        export const getCardStyles = (props) => {
          const baseStyles = {
            backgroundColor: '#ffffff',
            borderRadius: '4px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          };

          const themeStyles = {
            border: \`1px solid \${props.theme.palette.neutralLight}\`,
            color: props.theme.palette.neutralPrimary
          };

          return {
            root: createComponentStyle(baseStyles, themeStyles),
            header: {
              padding: '16px',
              borderBottom: \`1px solid \${props.theme.palette.neutralLighter}\`
            },
            content: {
              padding: '16px'
            }
          };
        };
      `;

      const srcDir = path.join(tempDir, 'src');
      await FileSystem.ensureFolderAsync(srcDir);
      await FileSystem.writeFileAsync(path.join(srcDir, 'CustomWrapper.styles.ts'), sourceCode);

      const extractor = createExtractor();
      const result = await extractor.extractFromProject();

      expect(result.success).toBe(true);
      expect(result.extractedFiles.length).toBe(1);
      expect(result.extractedFiles[0].success).toBe(true);
    });
  });

  describe('Non-getStyles function patterns', () => {
    it('should handle various style function naming patterns', async () => {
      const sourceCode = `
        // Different naming patterns for style functions
        export const useButtonStyles = (props) => ({
          root: {
            backgroundColor: props.primary ? '#0078d4' : '#f3f2f1',
            padding: '8px 16px'
          }
        });

        export const createCardStyles = (theme) => ({
          card: {
            backgroundColor: theme.palette.white,
            borderRadius: theme.effects.roundedCorner4
          }
        });

        export const makeLayoutStyles = () => ({
          container: {
            display: 'flex',
            flexDirection: 'column',
            height: '100vh'
          }
        });

        export const buildFormStyles = (props) => ({
          form: {
            maxWidth: '400px',
            margin: '0 auto',
            padding: props.compact ? '16px' : '24px'
          }
        });

        // Class with style methods
        export class ComponentStyleProvider {
          getComponentStyles(props) {
            return {
              root: {
                display: 'block',
                width: '100%',
                backgroundColor: props.theme.palette.white
              }
            };
          }

          createDynamicStyles(variant) {
            return {
              element: {
                padding: variant === 'large' ? '24px' : '16px',
                fontSize: variant === 'large' ? '18px' : '14px'
              }
            };
          }
        }
      `;

      const srcDir = path.join(tempDir, 'src');
      await FileSystem.ensureFolderAsync(srcDir);
      await FileSystem.writeFileAsync(path.join(srcDir, 'MultiPattern.styles.ts'), sourceCode);

      const extractor = createExtractor();
      const result = await extractor.extractFromProject();

      expect(result.success).toBe(true);
      expect(result.extractedFiles.length).toBe(1);
      expect(result.extractedFiles[0].success).toBe(true);
    });
  });

  describe('Class name composition patterns', () => {
    it('should handle complex class name composition', async () => {
      const sourceCode = `
        import { mergeStyles } from '@fluentui/merge-styles';

        const baseClassName = 'ms-Button';
        const primaryClassName = 'ms-Button--primary';

        export const getCompositionStyles = (props) => {
          const dynamicStyles = mergeStyles({
            backgroundColor: props.theme.palette.themePrimary,
            color: props.theme.palette.white
          });

          return {
            root: [
              baseClassName,
              props.primary && primaryClassName,
              props.disabled && 'ms-Button--disabled',
              dynamicStyles,
              props.className,
              props.size === 'large' && {
                fontSize: '16px',
                padding: '12px 24px'
              }
            ]
          };
        };
      `;

      const srcDir = path.join(tempDir, 'src');
      await FileSystem.ensureFolderAsync(srcDir);
      await FileSystem.writeFileAsync(path.join(srcDir, 'ClassComposition.styles.ts'), sourceCode);

      const extractor = createExtractor();
      const result = await extractor.extractFromProject();

      expect(result.success).toBe(true);
      expect(result.extractedFiles.length).toBe(1);
      expect(result.extractedFiles[0].success).toBe(true);
    });
  });

  describe('Performance and metrics', () => {
    it('should provide comprehensive analysis report for extended patterns', async () => {
      // Create multiple files with different patterns
      const files = [
        {
          name: 'DirectAPI.styles.ts',
          content: `
            import { mergeStyleSets } from '@fluentui/merge-styles';
            export const styles = mergeStyleSets({
              root: { padding: '16px' },
              content: { margin: '8px' }
            });
          `
        },
        {
          name: 'Inline.styles.tsx',
          content: `
            import { mergeStyles } from '@fluentui/merge-styles';
            export const Component = () => (
              <div className={mergeStyles({ color: 'red' })} />
            );
          `
        },
        {
          name: 'Custom.styles.ts',
          content: `
            export const useCustomStyles = () => ({
              wrapper: { display: 'flex' }
            });
          `
        }
      ];

      const srcDir = path.join(tempDir, 'src');
      await FileSystem.ensureFolderAsync(srcDir);
      
      for (const file of files) {
        await FileSystem.writeFileAsync(path.join(srcDir, file.name), file.content);
      }

      const extractor = createExtractor();
      const result = await extractor.extractFromProject();

      expect(result.success).toBe(true);
      expect(result.extractedFiles.length).toBe(3);
      expect(result.analysisReport).toBeDefined();
      expect(result.analysisReport?.summary).toBeDefined();
      expect(result.analysisReport?.performance).toBeDefined();
      expect(result.analysisReport?.files.length).toBe(3);
    });
  });
});