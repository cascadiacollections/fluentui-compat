/**
 * Vendor Integration test for FluentStyleExtractor
 * Tests end-to-end vendor package style extraction functionality with real FluentUI packages
 */

import { FluentStyleExtractor } from '../../src/FluentStyleExtractor';
import { Terminal } from '@rushstack/terminal';
import { FileSystem } from '@rushstack/node-core-library';
import * as path from 'path';
import * as os from 'os';

describe('FluentStyleExtractor Vendor Integration', () => {
  let mockTerminal: Terminal;
  let tempDir: string;
  let projectDir: string;
  let buildDir: string;
  let nodeModulesDir: string;
  let fluentuiButtonDir: string;
  let fluentuiComponentsDir: string;

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
    tempDir = path.join(os.tmpdir(), 'fluentui-heft-plugin-vendor-integration-test');
    projectDir = path.join(tempDir, 'project');
    buildDir = path.join(tempDir, 'build');
    nodeModulesDir = path.join(projectDir, 'node_modules');
    fluentuiButtonDir = path.join(nodeModulesDir, '@fluentui', 'react-button');
    fluentuiComponentsDir = path.join(nodeModulesDir, '@fluentui', 'react-components');
    
    await FileSystem.ensureFolderAsync(tempDir);
    await FileSystem.ensureFolderAsync(projectDir);
    await FileSystem.ensureFolderAsync(buildDir);
    await FileSystem.ensureFolderAsync(path.join(projectDir, 'src'));
    await FileSystem.ensureFolderAsync(nodeModulesDir);
    await FileSystem.ensureFolderAsync(path.dirname(fluentuiButtonDir));
    await FileSystem.ensureFolderAsync(fluentuiButtonDir);
    await FileSystem.ensureFolderAsync(path.join(fluentuiButtonDir, 'src'));
    await FileSystem.ensureFolderAsync(path.dirname(fluentuiComponentsDir));
    await FileSystem.ensureFolderAsync(fluentuiComponentsDir);
    await FileSystem.ensureFolderAsync(path.join(fluentuiComponentsDir, 'src'));
  });

  afterAll(async () => {
    // Clean up temporary directory
    try {
      await FileSystem.deleteFolderAsync(tempDir);
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should extract styles from both user code and vendor packages', async () => {
    // Create realistic FluentUI vendor packages
    await createMockFluentUIPackage(fluentuiButtonDir, '@fluentui/react-button', '9.3.0');
    await createMockFluentUIPackage(fluentuiComponentsDir, '@fluentui/react-components', '9.5.0');

    // Create realistic FluentUI Button styles in vendor package
    const vendorButtonStyles = `
import { mergeStyles, mergeStyleSets } from '@fluentui/merge-styles';
import type { IButtonStyleProps, IButtonStyles } from './Button.types';

export interface IButtonStyleProps {
  theme: any;
  primary?: boolean;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  iconOnly?: boolean;
  className?: string;
}

export interface IButtonStyles {
  root: any;
  label: any;
  icon?: any;
  menuIcon?: any;
}

export const getStyles = (props: IButtonStyleProps): IButtonStyles => {
  const { theme, primary, disabled, size, iconOnly, className } = props;
  const { palette, fonts, effects } = theme || {
    palette: {
      themePrimary: '#0078d4',
      themeDarkAlt: '#106ebe',
      white: '#ffffff',
      neutralPrimary: '#323130',
      neutralLight: '#f3f2f1',
      neutralTertiaryAlt: '#c8c6c4',
      neutralQuaternary: '#d2d0ce'
    },
    fonts: {
      medium: { fontSize: '14px', fontFamily: 'Segoe UI' },
      small: { fontSize: '12px', fontFamily: 'Segoe UI' }
    },
    effects: {
      roundedCorner2: '2px',
      elevation4: '0 1.6px 3.6px 0 rgba(0,0,0,0.132), 0 0.3px 0.9px 0 rgba(0,0,0,0.108)'
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
        fontSize: size === 'small' ? fonts.small.fontSize : fonts.medium.fontSize,
        fontFamily: fonts.medium.fontFamily,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: iconOnly ? 'auto' : '80px',
        minHeight: size === 'small' ? '24px' : size === 'large' ? '40px' : '32px',
        userSelect: 'none',
        transition: 'all 0.1s ease',
        outline: 'transparent',
        position: 'relative',
        fontWeight: '400',
        textDecoration: 'none',
        textAlign: 'center',
        boxSizing: 'border-box',
        selectors: {
          ':hover': !disabled ? {
            backgroundColor: primary ? palette.themeDarkAlt : palette.neutralLight,
            borderColor: primary ? palette.themeDarkAlt : palette.neutralTertiaryAlt,
            textDecoration: 'none'
          } : {},
          ':focus': {
            outline: \`2px solid \${palette.themePrimary}\`,
            outlineOffset: '2px'
          },
          ':active': !disabled ? {
            backgroundColor: primary ? palette.themeDarkAlt : palette.neutralQuaternary,
            transform: 'scale(0.98)'
          } : {},
          '&::-moz-focus-inner': {
            border: '0'
          },
          '& .ms-Button-flexContainer': {
            display: 'flex',
            height: '100%',
            flexWrap: 'nowrap',
            justifyContent: 'center',
            alignItems: 'center'
          }
        }
      },
      disabled && {
        backgroundColor: palette.neutralLight,
        borderColor: palette.neutralLight,
        color: palette.neutralTertiaryAlt,
        cursor: 'not-allowed',
        pointerEvents: 'none',
        opacity: 0.5
      },
      iconOnly && {
        padding: size === 'small' ? '4px' : size === 'large' ? '12px' : '8px',
        minWidth: size === 'small' ? '24px' : size === 'large' ? '40px' : '32px'
      },
      className
    ],
    label: {
      margin: '0 4px',
      lineHeight: '100%',
      display: iconOnly ? 'none' : 'block',
      fontWeight: primary ? '600' : '400'
    },
    icon: {
      fontSize: size === 'small' ? '12px' : '16px',
      margin: '0 4px',
      height: size === 'small' ? '12px' : '16px',
      lineHeight: size === 'small' ? '12px' : '16px',
      textAlign: 'center',
      flexShrink: 0
    },
    menuIcon: {
      fontSize: '12px',
      margin: '0 4px 0 8px',
      height: '12px',
      lineHeight: '12px',
      textAlign: 'center',
      flexShrink: 0
    }
  };
};

// Also test mergeStyleSets usage in vendor packages
export const buttonStyleSet = mergeStyleSets({
  primary: {
    backgroundColor: '#0078d4',
    color: '#ffffff'
  },
  secondary: {
    backgroundColor: '#f3f2f1',
    color: '#323130'
  }
});
`;

    // Create Card styles in another vendor package
    const vendorCardStyles = `
import { mergeStyles } from '@fluentui/merge-styles';

export interface ICardStyleProps {
  theme: any;
  compact?: boolean;
  elevated?: boolean;
  interactive?: boolean;
  className?: string;
}

export const getStyles = (props: ICardStyleProps) => {
  const { theme, compact, elevated, interactive, className } = props;
  const { palette, effects } = theme || {
    palette: {
      white: '#ffffff',
      neutralLight: '#f3f2f1',
      neutralQuaternaryAlt: '#e1dfdd',
      neutralTertiaryAlt: '#c8c6c4',
      themePrimary: '#0078d4'
    },
    effects: {
      roundedCorner4: '4px',
      elevation4: '0 1.6px 3.6px 0 rgba(0,0,0,0.132), 0 0.3px 0.9px 0 rgba(0,0,0,0.108)',
      elevation8: '0 3.2px 7.2px 0 rgba(0,0,0,0.132), 0 0.6px 1.8px 0 rgba(0,0,0,0.108)'
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
        boxShadow: elevated ? effects.elevation4 : 'none',
        transition: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        position: 'relative',
        overflow: 'hidden',
        selectors: {
          ':hover': interactive ? {
            borderColor: palette.neutralTertiaryAlt,
            boxShadow: elevated ? effects.elevation8 : effects.elevation4,
            transform: 'translateY(-1px)'
          } : {},
          ':focus': interactive ? {
            outline: \`2px solid \${palette.themePrimary}\`,
            outlineOffset: '2px'
          } : {},
          '& .ms-Card-header': {
            borderBottom: \`1px solid \${palette.neutralQuaternaryAlt}\`,
            paddingBottom: compact ? '8px' : '12px',
            marginBottom: compact ? '12px' : '16px'
          },
          '& .ms-Card-content': {
            lineHeight: '1.4'
          }
        }
      },
      interactive && {
        cursor: 'pointer',
        userSelect: 'none'
      },
      className
    ]
  };
};
`;

    // Write vendor package style files
    await FileSystem.writeFileAsync(
      path.join(fluentuiButtonDir, 'src', 'Button.styles.ts'),
      vendorButtonStyles
    );

    await FileSystem.writeFileAsync(
      path.join(fluentuiComponentsDir, 'src', 'Card.styles.ts'),
      vendorCardStyles
    );

    // Create user application styles that will be mixed with vendor styles
    const userAppStyles = `
export const getStyles = (props: any) => {
  const { theme, variant } = props;
  const { palette } = theme || {
    palette: {
      themePrimary: '#0078d4',
      white: '#ffffff',
      neutralLight: '#f3f2f1'
    }
  };

  return {
    appContainer: {
      fontFamily: 'Segoe UI, sans-serif',
      padding: '20px',
      backgroundColor: palette.white,
      minHeight: '100vh'
    },
    header: {
      backgroundColor: variant === 'branded' ? palette.themePrimary : palette.neutralLight,
      color: variant === 'branded' ? palette.white : '#323130',
      padding: '16px 24px',
      borderRadius: '4px',
      marginBottom: '20px',
      fontSize: '20px',
      fontWeight: '600'
    },
    content: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '20px',
      alignItems: 'start'
    }
  };
};
`;

    await FileSystem.writeFileAsync(
      path.join(projectDir, 'src', 'App.styles.ts'),
      userAppStyles
    );

    // Configure the extractor with vendor package extraction
    const extractor = new FluentStyleExtractor({
      include: ['**/*.styles.ts', '**/*.styles.tsx'],
      exclude: ['node_modules/**', '**/*.test.*'],
      outputDir: 'dist',
      cssFileName: 'combined-styles.css',
      classPrefix: 'fui',
      enableSourceMaps: true,
      minifyCSS: false,
      buildFolderPath: buildDir,
      projectFolderPath: projectDir,
      terminal: mockTerminal,
      themeTokens: {
        colorBrandBackground: '#0078d4',
        colorNeutralBackground1: '#ffffff',
        fontSizeBase300: '14px',
        borderRadiusSmall: '2px'
      },
      vendorExtraction: {
        enabled: true,
        packages: [
          {
            packageName: '@fluentui/react-button',
            versionRange: '^9.0.0',
            include: ['src/**/*.styles.ts', 'src/**/*.styles.tsx'],
            exclude: ['**/*.test.*', '**/*.spec.*'],
            warnOnVersionMismatch: true,
            allowVersionMismatch: false
          },
          {
            packageName: '@fluentui/react-components',
            versionRange: '^9.0.0',
            include: ['src/**/*.styles.ts'],
            exclude: ['**/*.test.*'],
            warnOnVersionMismatch: true,
            allowVersionMismatch: false
          }
        ],
        globalSettings: {
          separateVendorCSS: false,
          vendorClassPrefix: 'fluent',
          strictVersionChecking: false
        }
      }
    });

    // Run the extraction
    const result = await extractor.extractFromProject();

    // Verify the extraction succeeded
    expect(result.success).toBe(true);
    expect(result.extractedFiles.length).toBeGreaterThanOrEqual(3); // User app + vendor packages

    // Verify vendor packages were processed
    expect(result.metrics.vendorPackages).toBeDefined();
    expect(result.metrics.vendorPackages!.length).toBe(2);
    
    const buttonVendor = result.metrics.vendorPackages!.find(v => v.packageName === '@fluentui/react-button');
    const componentsVendor = result.metrics.vendorPackages!.find(v => v.packageName === '@fluentui/react-components');
    
    expect(buttonVendor).toBeDefined();
    expect(buttonVendor!.version).toBe('9.3.0');
    expect(buttonVendor!.compatible).toBe(true);
    expect(buttonVendor!.filesProcessed).toBeGreaterThan(0);
    expect(buttonVendor!.stylesExtracted).toBeGreaterThan(0);

    expect(componentsVendor).toBeDefined();
    expect(componentsVendor!.version).toBe('9.5.0');
    expect(componentsVendor!.compatible).toBe(true);
    expect(componentsVendor!.filesProcessed).toBeGreaterThan(0);

    // Verify CSS was generated and contains both user and vendor styles
    expect(result.generatedCSS).toBeTruthy();
    expect(result.generatedCSS.length).toBeGreaterThan(0);

    // Check that CSS contains theme tokens
    expect(result.generatedCSS).toContain(':root');
    expect(result.generatedCSS).toContain('--colorBrandBackground');

    // Verify both user and vendor files were processed
    const userFile = result.extractedFiles.find(f => f.relativePath.includes('App.styles.ts'));
    const vendorButtonFile = result.extractedFiles.find(f => 
      f.relativePath.includes('node_modules/@fluentui/react-button') && 
      f.relativePath.includes('Button.styles.ts')
    );
    const vendorCardFile = result.extractedFiles.find(f => 
      f.relativePath.includes('node_modules/@fluentui/react-components') && 
      f.relativePath.includes('Card.styles.ts')
    );

    expect(userFile).toBeDefined();
    expect(userFile!.success).toBe(true);
    expect(userFile!.extractedClasses).toBeDefined();

    expect(vendorButtonFile).toBeDefined();
    expect(vendorButtonFile!.success).toBe(true);
    expect(vendorButtonFile!.extractedClasses).toBeDefined();

    expect(vendorCardFile).toBeDefined();
    expect(vendorCardFile!.success).toBe(true);
    expect(vendorCardFile!.extractedClasses).toBeDefined();

    // Generate output files for inspection
    const cssPath = path.join(buildDir, 'combined-styles.css');
    await FileSystem.writeFileAsync(cssPath, result.generatedCSS);

    // Create a comprehensive HTML demo showing the vendor integration
    const demoHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vendor Integration Test - FluentUI Style Extractor</title>
    <link rel="stylesheet" href="combined-styles.css">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #faf9f8;
        }
        .demo-container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .demo-section {
            margin-bottom: 40px;
            padding: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin: 20px 0;
        }
        .stat-card {
            background: #f8f8f8;
            padding: 16px;
            border-radius: 4px;
            text-align: center;
        }
        .stat-value {
            font-size: 24px;
            font-weight: 600;
            color: #0078d4;
        }
        .stat-label {
            font-size: 12px;
            color: #605e5c;
            text-transform: uppercase;
        }
        .vendor-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        .vendor-table th,
        .vendor-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e1dfdd;
        }
        .vendor-table th {
            background: #f3f2f1;
            font-weight: 600;
        }
        .compatible {
            color: #107c10;
            font-weight: 600;
        }
        .code-preview {
            background: #f8f8f8;
            border: 1px solid #e1dfdd;
            border-radius: 4px;
            padding: 16px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            overflow-x: auto;
            max-height: 300px;
            overflow-y: auto;
        }
    </style>
</head>
<body>
    <div class="demo-container">
        <h1>🚀 Vendor Integration Test Results</h1>
        <p>This demo shows successful extraction of styles from both user code and FluentUI vendor packages.</p>
        
        <div class="demo-section">
            <h2>📊 Extraction Statistics</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${result.extractedFiles.length}</div>
                    <div class="stat-label">Total Files</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${result.metrics.stylesExtracted}</div>
                    <div class="stat-label">Styles Extracted</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${Math.round(result.generatedCSS.length / 1024)}KB</div>
                    <div class="stat-label">CSS Generated</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${result.metrics.extractionTime}ms</div>
                    <div class="stat-label">Extraction Time</div>
                </div>
            </div>
        </div>

        <div class="demo-section">
            <h2>📦 Vendor Packages</h2>
            <table class="vendor-table">
                <thead>
                    <tr>
                        <th>Package</th>
                        <th>Version</th>
                        <th>Compatible</th>
                        <th>Files Processed</th>
                        <th>Styles Extracted</th>
                    </tr>
                </thead>
                <tbody>
                    ${result.metrics.vendorPackages!.map(vendor => `
                    <tr>
                        <td><code>${vendor.packageName}</code></td>
                        <td>${vendor.version}</td>
                        <td class="compatible">${vendor.compatible ? '✅ Yes' : '❌ No'}</td>
                        <td>${vendor.filesProcessed}</td>
                        <td>${vendor.stylesExtracted}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="demo-section">
            <h2>🎨 Generated CSS (Preview)</h2>
            <div class="code-preview">
${result.generatedCSS.split('\n').slice(0, 50).map(line => line.replace(/</g, '&lt;').replace(/>/g, '&gt;')).join('\n')}
... (showing first 50 lines)
            </div>
        </div>

        <div class="demo-section">
            <h2>📁 Processed Files</h2>
            <ul>
                ${result.extractedFiles.map(file => `
                <li>
                    <strong>${file.relativePath}</strong>
                    ${file.relativePath.includes('node_modules') ? '(Vendor)' : '(User)'}
                    - ${file.extractedClasses?.length || 0} classes extracted
                </li>
                `).join('')}
            </ul>
        </div>

        <div class="demo-section">
            <h2>✨ Key Benefits Demonstrated</h2>
            <ul>
                <li><strong>Unified Style Extraction:</strong> Both user and vendor styles processed together</li>
                <li><strong>Version Compatibility:</strong> Automatic version checking with configurable policies</li>
                <li><strong>Build-time Optimization:</strong> FluentUI vendor styles converted to static CSS</li>
                <li><strong>Bundle Size Reduction:</strong> Runtime merge-styles eliminated from vendor packages</li>
                <li><strong>Consistent Class Generation:</strong> Vendor styles follow same naming conventions</li>
                <li><strong>Theme Token Integration:</strong> CSS custom properties work with both user and vendor styles</li>
            </ul>
        </div>
    </div>
</body>
</html>
`;

    const htmlPath = path.join(buildDir, 'vendor-integration-demo.html');
    await FileSystem.writeFileAsync(htmlPath, demoHtml);

    // Write analysis report
    const reportPath = path.join(buildDir, 'vendor-extraction-report.json');
    await FileSystem.writeFileAsync(reportPath, JSON.stringify({
      success: result.success,
      metrics: result.metrics,
      vendorPackages: result.metrics.vendorPackages,
      extractedFiles: result.extractedFiles.map(f => ({
        path: f.relativePath,
        isVendor: f.relativePath.includes('node_modules'),
        classCount: f.extractedClasses?.length || 0,
        success: f.success
      }))
    }, null, 2));

    // Verify all output files exist
    expect(await FileSystem.existsAsync(cssPath)).toBe(true);
    expect(await FileSystem.existsAsync(htmlPath)).toBe(true);
    expect(await FileSystem.existsAsync(reportPath)).toBe(true);

    // Log success information
    console.log('\n🎉 Vendor integration test completed successfully!');
    console.log(`📁 Generated demo: ${htmlPath}`);
    console.log(`📄 CSS output: ${cssPath}`);
    console.log(`📊 Report: ${reportPath}`);
    console.log(`📦 Vendor packages processed: ${result.metrics.vendorPackages!.length}`);
  });

  it('should handle mixed vendor and user styles with complex patterns', async () => {
    // Create a more complex scenario with advanced merge-styles patterns
    await createMockFluentUIPackage(fluentuiButtonDir, '@fluentui/react-button', '9.3.0');

    // Create complex vendor styles using advanced merge-styles patterns
    const complexVendorStyles = `
import { mergeStyles, mergeStyleSets, fontFace, keyframes } from '@fluentui/merge-styles';

// Test fontFace in vendor packages
fontFace({
  fontFamily: 'FluentSystemIcons',
  src: "url('https://static2.sharepointonline.com/files/fabric/assets/icons/FluentSystemIcons-Resizable.woff2') format('woff2')"
});

// Test keyframes in vendor packages
const slideIn = keyframes({
  '0%': { transform: 'translateX(-100%)', opacity: 0 },
  '100%': { transform: 'translateX(0)', opacity: 1 }
});

// Test concatStyleSets pattern
const baseStyles = {
  root: {
    fontFamily: 'Segoe UI',
    fontSize: '14px'
  }
};

export const complexButtonStyles = mergeStyleSets(baseStyles, {
  primary: {
    backgroundColor: '#0078d4',
    color: '#ffffff',
    selectors: {
      ':hover': {
        backgroundColor: '#106ebe'
      }
    }
  },
  animated: {
    animation: \`\${slideIn} 0.3s ease-out\`
  }
});

export const getStyles = (props: any) => {
  const { theme, variant, animated } = props;
  
  return {
    root: [
      // Test array-based style composition
      complexButtonStyles.root,
      variant === 'primary' && complexButtonStyles.primary,
      animated && complexButtonStyles.animated,
      {
        // Test complex selectors
        selectors: {
          ':global(.ms-Fabric--isFocusVisible) &:focus': {
            outline: '2px solid #0078d4',
            outlineOffset: '2px'
          },
          '& .icon': {
            marginRight: '8px',
            fontFamily: 'FluentSystemIcons'
          },
          '&[data-variant="outline"]': {
            backgroundColor: 'transparent',
            borderColor: '#0078d4'
          },
          '&:not(:disabled):hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 8px rgba(0,0,0,0.12)'
          }
        }
      }
    ]
  };
};
`;

    await FileSystem.writeFileAsync(
      path.join(fluentuiButtonDir, 'src', 'ComplexButton.styles.ts'),
      complexVendorStyles
    );

    // Create user styles that interact with vendor styles
    const userComplexStyles = `
import { mergeStyles } from '@fluentui/merge-styles';

// Test user styles that reference vendor class names
export const getStyles = (props: any) => {
  return {
    appWrapper: {
      // Test composition with potential vendor classes
      selectors: {
        '& .ms-Button': {
          margin: '8px'
        },
        '& .ms-Card': {
          marginBottom: '16px'
        }
      }
    },
    customButton: [
      // Test mergeStyles call within user code
      mergeStyles({
        backgroundColor: '#8764b8',
        color: 'white',
        padding: '12px 24px'
      }),
      {
        borderRadius: '20px',
        fontWeight: '600'
      }
    ]
  };
};
`;

    await FileSystem.writeFileAsync(
      path.join(projectDir, 'src', 'ComplexApp.styles.ts'),
      userComplexStyles
    );

    // Configure extractor
    const extractor = new FluentStyleExtractor({
      include: ['**/*.styles.ts'],
      exclude: ['**/*.test.*'],
      outputDir: 'dist',
      cssFileName: 'complex-styles.css',
      classPrefix: 'fui',
      enableSourceMaps: false,
      minifyCSS: false,
      buildFolderPath: buildDir,
      projectFolderPath: projectDir,
      terminal: mockTerminal,
      vendorExtraction: {
        enabled: true,
        packages: [{
          packageName: '@fluentui/react-button',
          versionRange: '^9.0.0',
          warnOnVersionMismatch: false,
          allowVersionMismatch: false
        }]
      }
    });

    const result = await extractor.extractFromProject();

    // Verify complex patterns are handled
    expect(result.success).toBe(true);
    expect(result.metrics.vendorPackages).toBeDefined();
    expect(result.metrics.vendorPackages!.length).toBe(1);
    expect(result.extractedFiles.length).toBeGreaterThanOrEqual(2);

    // Verify CSS contains both vendor and user styles
    expect(result.generatedCSS).toBeTruthy();
    expect(result.generatedCSS.length).toBeGreaterThan(0);

    // Check for complex CSS patterns
    expect(result.generatedCSS).toMatch(/@font-face|@keyframes/); // fontFace or keyframes
    
    const vendorFile = result.extractedFiles.find(f => 
      f.relativePath.includes('ComplexButton.styles.ts')
    );
    const userFile = result.extractedFiles.find(f => 
      f.relativePath.includes('ComplexApp.styles.ts')
    );

    expect(vendorFile).toBeDefined();
    expect(vendorFile!.success).toBe(true);
    expect(userFile).toBeDefined();
    expect(userFile!.success).toBe(true);
  });

  // Helper function to create realistic FluentUI package structure
  async function createMockFluentUIPackage(
    packageDir: string, 
    packageName: string, 
    version: string
  ): Promise<void> {
    await FileSystem.ensureFolderAsync(packageDir);
    await FileSystem.ensureFolderAsync(path.join(packageDir, 'src'));
    await FileSystem.ensureFolderAsync(path.join(packageDir, 'dist'));
    
    const packageJson = {
      name: packageName,
      version,
      main: 'dist/index.js',
      module: 'dist/index.esm.js',
      types: 'dist/index.d.ts',
      sideEffects: false,
      repository: {
        type: 'git',
        url: 'https://github.com/microsoft/fluentui'
      },
      dependencies: {
        '@fluentui/merge-styles': '^8.5.0',
        '@fluentui/theme': '^2.6.0',
        'tslib': '^2.0.0'
      },
      peerDependencies: {
        react: '>=16.8.0 <19.0.0',
        'react-dom': '>=16.8.0 <19.0.0'
      }
    };

    await FileSystem.writeFileAsync(
      path.join(packageDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // Create a basic index file to make it look realistic
    await FileSystem.writeFileAsync(
      path.join(packageDir, 'src', 'index.ts'),
      `export * from './Button.styles';\nexport * from './Card.styles';`
    );
  }
});