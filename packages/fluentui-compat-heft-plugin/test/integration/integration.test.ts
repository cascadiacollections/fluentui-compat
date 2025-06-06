/**
 * Integration test for FluentStyleExtractor
 * Tests end-to-end functionality with real file processing and HTML generation
 */

import { FluentStyleExtractor } from '../../src/FluentStyleExtractor';
import { Terminal } from '@rushstack/terminal';
import { FileSystem } from '@rushstack/node-core-library';
import * as path from 'path';
import * as os from 'os';

describe('FluentStyleExtractor Integration', () => {
  let mockTerminal: Terminal;
  let tempDir: string;
  let projectDir: string;
  let buildDir: string;

  beforeAll(async () => {
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

    // Create temporary directories for integration testing
    tempDir = path.join(os.tmpdir(), 'fluentui-heft-plugin-integration-test');
    projectDir = path.join(tempDir, 'project');
    buildDir = path.join(tempDir, 'build');
    
    await FileSystem.ensureFolderAsync(tempDir);
    await FileSystem.ensureFolderAsync(projectDir);
    await FileSystem.ensureFolderAsync(buildDir);
    await FileSystem.ensureFolderAsync(path.join(projectDir, 'src'));
  });

  afterAll(async () => {
    // Clean up temporary directory
    try {
      await FileSystem.deleteFolderAsync(tempDir);
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should process a complete project and generate HTML with CSS and JS', async () => {
    // Create a sample FluentUI component with merge-styles
    const buttonStylesContent = `
import type { IButtonStyleProps, IButtonStyles } from './Button.types';

export interface IButtonStyleProps {
  theme: any;
  primary?: boolean;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export interface IButtonStyles {
  root: any;
  label: any;
  icon?: any;
}

export const getStyles = (props: IButtonStyleProps): IButtonStyles => {
  const { theme, primary, disabled, size, className } = props;
  const { palette, fonts, effects } = theme || {
    palette: {
      themePrimary: '#0078d4',
      white: '#ffffff',
      neutralLight: '#f3f2f1',
      neutralPrimary: '#323130',
      neutralTertiaryAlt: '#c8c6c4'
    },
    fonts: {
      medium: { fontSize: '14px', fontFamily: 'Segoe UI' }
    },
    effects: {
      roundedCorner2: '2px'
    }
  };

  return {
    root: [
      'ms-Button',
      {
        backgroundColor: primary ? palette.themePrimary : palette.white,
        color: primary ? palette.white : palette.neutralPrimary,
        border: \`1px solid \${primary ? palette.themePrimary : palette.neutralLight}\`,
        borderRadius: effects.roundedCorner2,
        padding: size === 'small' ? '4px 8px' : size === 'large' ? '12px 24px' : '8px 16px',
        fontSize: fonts.medium.fontSize,
        fontFamily: fonts.medium.fontFamily,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        transition: 'all 0.2s ease',
        selectors: {
          ':hover': !disabled ? {
            backgroundColor: primary ? palette.neutralTertiaryAlt : palette.neutralLight,
            borderColor: palette.neutralTertiaryAlt
          } : {},
          ':focus': {
            outline: \`2px solid \${palette.themePrimary}\`,
            outlineOffset: '2px'
          },
          ':active': !disabled ? {
            transform: 'scale(0.98)'
          } : {}
        }
      },
      disabled && {
        opacity: 0.5,
        cursor: 'not-allowed',
        pointerEvents: 'none'
      },
      className
    ],
    label: {
      fontWeight: primary ? '600' : '400',
      lineHeight: '1.2'
    },
    icon: {
      marginRight: '8px',
      fontSize: '16px'
    }
  };
};
`;

    const cardStylesContent = `
export interface ICardStyleProps {
  theme: any;
  compact?: boolean;
  elevated?: boolean;
  className?: string;
}

export interface ICardStyles {
  root: any;
  header?: any;
  content?: any;
}

export const getStyles = (props: ICardStyleProps): ICardStyles => {
  const { theme, compact, elevated, className } = props;
  const { palette, effects } = theme || {
    palette: {
      white: '#ffffff',
      neutralLight: '#f3f2f1',
      neutralQuaternaryAlt: '#e1dfdd'
    },
    effects: {
      roundedCorner4: '4px',
      elevation8: '0 1.6px 3.6px 0 rgba(0,0,0,0.132), 0 0.3px 0.9px 0 rgba(0,0,0,0.108)'
    }
  };

  return {
    root: [
      'ms-Card',
      {
        backgroundColor: palette.white,
        border: \`1px solid \${palette.neutralLight}\`,
        borderRadius: effects.roundedCorner4,
        padding: compact ? '12px' : '20px',
        boxShadow: elevated ? effects.elevation8 : 'none',
        transition: 'box-shadow 0.2s ease',
        selectors: {
          ':hover': elevated ? {
            boxShadow: '0 3.2px 7.2px 0 rgba(0,0,0,0.132), 0 0.6px 1.8px 0 rgba(0,0,0,0.108)'
          } : {}
        }
      },
      className
    ],
    header: {
      borderBottom: \`1px solid \${palette.neutralQuaternaryAlt}\`,
      paddingBottom: '12px',
      marginBottom: '16px'
    },
    content: {
      lineHeight: '1.4'
    }
  };
};
`;

    // Write the style files
    await FileSystem.writeFileAsync(
      path.join(projectDir, 'src', 'Button.styles.ts'),
      buttonStylesContent
    );

    await FileSystem.writeFileAsync(
      path.join(projectDir, 'src', 'Card.styles.ts'),
      cardStylesContent
    );

    // Create the extractor and process the project
    const extractor = new FluentStyleExtractor({
      include: ['**/*.styles.ts', '**/*.styles.tsx'],
      exclude: ['node_modules/**', '**/*.test.*'],
      outputDir: 'dist',
      cssFileName: 'extracted-styles.css',
      classPrefix: 'fui',
      enableSourceMaps: false,
      minifyCSS: false,
      buildFolderPath: buildDir,
      projectFolderPath: projectDir,
      terminal: mockTerminal,
      themeTokens: {
        colorBrandBackground: '#0078d4',
        colorNeutralBackground1: '#ffffff',
        fontSizeBase300: '14px',
        borderRadiusSmall: '2px'
      }
    });

    const result = await extractor.extractFromProject();

    // Verify extraction succeeded
    expect(result.success).toBe(true);
    expect(result.extractedFiles).toHaveLength(2);
    expect(result.generatedCSS).toBeTruthy();
    expect(result.analysisReport).toBeTruthy();

    // Verify CSS was generated with theme tokens
    expect(result.generatedCSS).toContain(':root');
    expect(result.generatedCSS).toContain('--colorBrandBackground: #0078d4');
    expect(result.generatedCSS).toContain('--colorNeutralBackground1: #ffffff');

    // Verify extracted files have the expected structure
    const buttonResult = result.extractedFiles.find(f => f.relativePath.includes('Button.styles.ts'));
    const cardResult = result.extractedFiles.find(f => f.relativePath.includes('Card.styles.ts'));

    expect(buttonResult).toBeTruthy();
    expect(cardResult).toBeTruthy();
    expect(buttonResult!.success).toBe(true);
    expect(cardResult!.success).toBe(true);
    expect(buttonResult!.extractedClasses).toBeTruthy();
    expect(cardResult!.extractedClasses).toBeTruthy();

    // Generate sample HTML file that demonstrates the transformation
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FluentUI Style Extractor - Integration Test</title>
    <link rel="stylesheet" href="extracted-styles.css">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #faf9f8;
        }
        .demo-container {
            max-width: 800px;
            margin: 0 auto;
        }
        .demo-section {
            margin-bottom: 40px;
            padding: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .demo-title {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 16px;
            color: #323130;
        }
        .demo-subtitle {
            font-size: 18px;
            font-weight: 500;
            margin: 20px 0 12px 0;
            color: #605e5c;
        }
        .before-after {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 20px;
        }
        .code-block {
            background: #f8f8f8;
            border: 1px solid #e1dfdd;
            border-radius: 4px;
            padding: 16px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            overflow-x: auto;
        }
        .code-block.before {
            border-left: 4px solid #d13438;
        }
        .code-block.after {
            border-left: 4px solid #107c10;
        }
        .extraction-stats {
            background: #f3f2f1;
            padding: 16px;
            border-radius: 4px;
            margin: 20px 0;
        }
        .stat-item {
            display: inline-block;
            margin-right: 24px;
            font-weight: 500;
        }
        .stat-value {
            color: #0078d4;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="demo-container">
        <h1 class="demo-title">FluentUI Style Extractor - Integration Test Results</h1>
        
        <div class="demo-section">
            <h2 class="demo-subtitle">Extraction Statistics</h2>
            <div class="extraction-stats">
                <div class="stat-item">Files Processed: <span class="stat-value">${result.analysisReport!.summary.filesProcessed}</span></div>
                <div class="stat-item">Styles Extracted: <span class="stat-value">${result.analysisReport!.summary.stylesExtracted}</span></div>
                <div class="stat-item">CSS Size: <span class="stat-value">${result.analysisReport!.summary.cssSize}KB</span></div>
                <div class="stat-item">Extraction Time: <span class="stat-value">${result.analysisReport!.summary.extractionTime}ms</span></div>
            </div>
        </div>

        <div class="demo-section">
            <h2 class="demo-subtitle">Generated CSS (Theme Tokens)</h2>
            <div class="code-block after">
${result.generatedCSS.split('\n').slice(0, 20).map(line => `                ${line}`).join('\n')}
                ... (truncated for display)
            </div>
        </div>

        <div class="demo-section">
            <h2 class="demo-subtitle">Before vs After Transformation</h2>
            
            <div class="before-after">
                <div>
                    <h3>Before (Runtime merge-styles)</h3>
                    <div class="code-block before">
export const getStyles = (props) => ({
  root: [
    'ms-Button',
    {
      backgroundColor: primary ? 
        palette.themePrimary : palette.white,
      color: primary ? 
        palette.white : palette.neutralPrimary,
      border: \`1px solid \${primary ? 
        palette.themePrimary : palette.neutralLight}\`,
      // ... more runtime styles
    }
  ]
});
                    </div>
                </div>
                
                <div>
                    <h3>After (Build-time CSS Classes)</h3>
                    <div class="code-block after">
export const getStyles = (props) => ({
  root: [
    '${buttonResult!.extractedClasses![0]}',
    props.className
  ]
});

/* Generated CSS: */
.${buttonResult!.extractedClasses![0]} {
  /* extracted styles */
}
                    </div>
                </div>
            </div>
        </div>

        <div class="demo-section">
            <h2 class="demo-subtitle">Performance Benefits</h2>
            <ul>
                <li><strong>Bundle Size Reduction:</strong> ~${result.analysisReport!.performance.bundleReduction}% estimated reduction</li>
                <li><strong>Runtime Performance:</strong> CSS classes instead of JavaScript style objects</li>
                <li><strong>Browser Caching:</strong> CSS files cached separately from JavaScript bundles</li>
                <li><strong>Build-time Optimization:</strong> PostCSS processing with autoprefixer and minification</li>
            </ul>
        </div>

        <div class="demo-section">
            <h2 class="demo-subtitle">Extracted Files</h2>
            ${result.analysisReport!.files.map(file => `
            <div style="margin-bottom: 12px;">
                <strong>${file.path}</strong>: ${file.classes} classes, ${Math.round(file.cssSize / 1024)}KB CSS
            </div>
            `).join('')}
        </div>
    </div>
</body>
</html>
`;

    // Write the HTML file to the build directory
    const htmlPath = path.join(buildDir, 'integration-test-result.html');
    await FileSystem.writeFileAsync(htmlPath, htmlContent);

    // Write the CSS file to the build directory
    const cssPath = path.join(buildDir, 'extracted-styles.css');
    await FileSystem.writeFileAsync(cssPath, result.generatedCSS);

    // Write transformed JS files to show the transformation
    if (buttonResult!.transformedCode) {
      await FileSystem.writeFileAsync(
        path.join(buildDir, 'Button.styles.transformed.js'),
        buttonResult!.transformedCode
      );
    }
    
    if (cardResult!.transformedCode) {
      await FileSystem.writeFileAsync(
        path.join(buildDir, 'Card.styles.transformed.js'),
        cardResult!.transformedCode
      );
    }

    // Verify all files were created
    expect(await FileSystem.existsAsync(htmlPath)).toBe(true);
    expect(await FileSystem.existsAsync(cssPath)).toBe(true);

    // Verify the HTML contains expected content
    const generatedHtml = await FileSystem.readFileAsync(htmlPath);
    expect(generatedHtml).toContain('FluentUI Style Extractor');
    expect(generatedHtml).toContain('Integration Test Results');
    expect(generatedHtml).toContain('extracted-styles.css');

    // Log the result paths for manual inspection
    console.log('\n🎉 Integration test completed successfully!');
    console.log(`📁 Generated files:`);
    console.log(`   HTML: ${htmlPath}`);
    console.log(`   CSS:  ${cssPath}`);
    console.log(`📊 Extraction stats: ${result.analysisReport!.summary.filesProcessed} files, ${result.analysisReport!.summary.stylesExtracted} styles`);
  });

  it('should handle complex real-world component patterns', async () => {
    // Create a more complex component similar to DocumentCard
    const complexComponentStyles = `
import { getGlobalClassNames, getInputFocusStyle } from '../../Styling';
import { IsFocusVisibleClassName } from '../../Utilities';

const GlobalClassNames = {
  root: 'ms-ComplexComponent',
  rootActionable: 'ms-ComplexComponent--actionable',
  rootCompact: 'ms-ComplexComponent--compact',
  header: 'ms-ComplexComponent-header',
  content: 'ms-ComplexComponent-content',
  footer: 'ms-ComplexComponent-footer',
};

export const getStyles = (props) => {
  const { className, theme, actionable, compact, variant } = props;
  const { palette, fonts, effects } = theme || {};

  const classNames = getGlobalClassNames(GlobalClassNames, theme);

  return {
    root: [
      classNames.root,
      {
        WebkitFontSmoothing: 'antialiased',
        backgroundColor: palette?.white || '#ffffff',
        border: \`1px solid \${palette?.neutralLight || '#f3f2f1'}\`,
        maxWidth: '320px',
        minWidth: '206px',
        userSelect: 'none',
        position: 'relative',
        borderRadius: effects?.roundedCorner2 || '2px',
        selectors: {
          ':focus': {
            outline: '0px solid',
          },
          [\`.\${IsFocusVisibleClassName} &:focus\`]: getInputFocusStyle?.(
            palette?.neutralSecondary || '#605e5c',
            effects?.roundedCorner2 || '2px',
          ) || {},
          '& .child-element': {
            color: palette?.neutralPrimary || '#323130',
          },
          '&:hover .child-element': {
            color: palette?.themePrimary || '#0078d4',
          },
        },
      },
      actionable && [
        classNames.rootActionable,
        {
          cursor: 'pointer',
          selectors: {
            ':hover': {
              borderColor: palette?.neutralTertiaryAlt || '#c8c6c4',
              boxShadow: effects?.elevation4 || '0 2px 4px rgba(0,0,0,0.1)',
            },
            ':hover:after': {
              content: '" "',
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              border: \`1px solid \${palette?.neutralTertiaryAlt || '#c8c6c4'}\`,
              pointerEvents: 'none',
              borderRadius: effects?.roundedCorner2 || '2px',
            },
          },
        },
      ],
      compact && [
        classNames.rootCompact,
        {
          display: 'flex',
          maxWidth: '480px',
          height: '108px',
          padding: '8px',
          selectors: {
            [\`.\${GlobalClassNames.header}\`]: {
              borderRight: \`1px solid \${palette?.neutralLight || '#f3f2f1'}\`,
              borderBottom: 0,
              maxHeight: '106px',
              maxWidth: '144px',
            },
            [\`.\${GlobalClassNames.content}\`]: {
              padding: '12px 16px',
              fontSize: fonts?.mediumPlus?.fontSize || '16px',
              lineHeight: '16px',
            },
          },
        },
      ],
      variant === 'elevated' && {
        boxShadow: effects?.elevation8 || '0 4px 8px rgba(0,0,0,0.1)',
        border: 'none',
      },
      className,
    ],
    header: [
      classNames.header,
      {
        padding: '16px 20px 12px',
        borderBottom: \`1px solid \${palette?.neutralQuaternaryAlt || '#e1dfdd'}\`,
        backgroundColor: variant === 'primary' ? palette?.themePrimary : 'transparent',
        color: variant === 'primary' ? palette?.white : palette?.neutralPrimary,
      }
    ],
    content: [
      classNames.content,
      {
        padding: '12px 20px',
        flexGrow: 1,
        fontSize: fonts?.medium?.fontSize || '14px',
        lineHeight: '1.4',
      }
    ],
    footer: [
      classNames.footer,
      {
        padding: '8px 20px 16px',
        borderTop: \`1px solid \${palette?.neutralQuaternaryAlt || '#e1dfdd'}\`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }
    ]
  };
};
`;

    // Write the complex component file
    await FileSystem.writeFileAsync(
      path.join(projectDir, 'src', 'ComplexComponent.styles.ts'),
      complexComponentStyles
    );

    // Create the extractor
    const extractor = new FluentStyleExtractor({
      include: ['**/*.styles.ts'],
      exclude: ['**/*.test.*'],
      outputDir: 'dist',
      cssFileName: 'complex-styles.css',
      classPrefix: 'fui',
      enableSourceMaps: true,
      minifyCSS: true,
      buildFolderPath: buildDir,
      projectFolderPath: projectDir,
      terminal: mockTerminal,
    });

    const result = await extractor.extractFromProject();

    // Verify complex patterns are handled
    expect(result.success).toBe(true);
    expect(result.extractedFiles).toHaveLength(3); // Button, Card, and ComplexComponent
    
    const complexResult = result.extractedFiles.find(f => f.relativePath.includes('ComplexComponent.styles.ts'));
    expect(complexResult).toBeTruthy();
    expect(complexResult!.success).toBe(true);
    expect(complexResult!.extractedClasses).toBeTruthy();
    expect(complexResult!.extractedClasses!.length).toBeGreaterThan(0);

    // Verify CSS generation with complex selectors
    expect(result.generatedCSS).toBeTruthy();
    expect(result.generatedCSS.length).toBeGreaterThan(0);
  });
});