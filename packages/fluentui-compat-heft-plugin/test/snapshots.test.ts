/**
 * Snapshot tests for FluentStyleExtractor
 * Captures CSS-in-JS input vs emitted stylesheets and transformed JavaScript code
 */

import { FluentStyleExtractor } from '../src/FluentStyleExtractor';
import { Terminal } from '@rushstack/terminal';
import { FileSystem } from '@rushstack/node-core-library';
import * as path from 'path';
import * as os from 'os';

describe('FluentStyleExtractor Snapshot Tests', () => {
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
      writeLine: console.log,
      writeErrorLine: console.error,
      writeWarningLine: console.warn,
      writeVerboseLine: console.log,
      eolCharacter: '\n',
      supportsColor: false,
      verboseEnabled: true,
      debugEnabled: false
    };
    
    mockTerminal = new Terminal(provider);
  });

  beforeEach(async () => {
    // Create fresh temporary directories for each test
    tempDir = path.join(os.tmpdir(), `fluentui-snapshot-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    projectDir = path.join(tempDir, 'project');
    buildDir = path.join(tempDir, 'build');
    
    await FileSystem.ensureFolderAsync(tempDir);
    await FileSystem.ensureFolderAsync(projectDir);
    await FileSystem.ensureFolderAsync(buildDir);
    await FileSystem.ensureFolderAsync(path.join(projectDir, 'src'));
  });

  afterEach(async () => {
    // Clean up temporary directory after each test
    try {
      await FileSystem.deleteFolderAsync(tempDir);
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  const createExtractor = (overrides = {}) => {
    return new FluentStyleExtractor({
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
      },
      ...overrides
    });
  };

  // Utility to normalize class names for deterministic snapshots
  const normalizeForSnapshot = (transformationResult: any) => {
    const normalized = JSON.parse(JSON.stringify(transformationResult));
    
    // Create a mapping of random class names to deterministic ones
    const classNameMap = new Map<string, string>();
    let counter = 1;
    
    const normalizeString = (str: string): string => {
      if (!str) return str;
      
      // Find all class names with the pattern fui-ComponentName-randomHash-base/actionable/compact
      const classNameRegex = /fui-([A-Za-z]+)-([a-z0-9]+)-(base|actionable|compact)/g;
      return str.replace(classNameRegex, (match, componentName, hash, variant) => {
        const baseKey = `fui-${componentName}-${hash}`;
        if (!classNameMap.has(baseKey)) {
          classNameMap.set(baseKey, `fui-${componentName}-${counter.toString().padStart(6, '0')}`);
          counter++;
        }
        return `${classNameMap.get(baseKey)}-${variant}`;
      });
    };

    const normalizeArray = (arr: any[]): any[] => {
      return arr.map(item => {
        if (typeof item === 'string') {
          return normalizeString(item);
        } else if (Array.isArray(item)) {
          return normalizeArray(item);
        } else if (item && typeof item === 'object') {
          return normalizeObject(item);
        }
        return item;
      });
    };

    const normalizeObject = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return normalizeArray(obj);
      
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const normalizedKey = normalizeString(key);
        if (typeof value === 'string') {
          result[normalizedKey] = normalizeString(value);
        } else if (Array.isArray(value)) {
          result[normalizedKey] = normalizeArray(value);
        } else if (value && typeof value === 'object') {
          result[normalizedKey] = normalizeObject(value);
        } else {
          result[normalizedKey] = value;
        }
      }
      return result;
    };

    return normalizeObject(normalized);
  };

  it('should match snapshot for basic button component transformation', async () => {
    const inputCode = `export const getStyles = (props) => {
  const { theme, primary, disabled } = props;
  const { palette } = theme || { palette: { themePrimary: '#0078d4', white: '#ffffff' } };

  return {
    root: [
      'ms-Button',
      {
        backgroundColor: primary ? palette.themePrimary : palette.white,
        color: primary ? palette.white : '#323130',
        border: \`1px solid \${primary ? palette.themePrimary : '#f3f2f1'}\`,
        padding: '8px 16px',
        borderRadius: '2px',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        fontFamily: 'Segoe UI',
        fontSize: '14px',
        selectors: {
          ':hover': {
            opacity: 0.8
          },
          ':focus': {
            outline: '2px solid #0078d4'
          }
        }
      },
      disabled && {
        opacity: 0.5,
        cursor: 'not-allowed'
      }
    ]
  };
};`;

    // Write input file
    const inputFile = path.join(projectDir, 'src', 'Button.styles.ts');
    await FileSystem.writeFileAsync(inputFile, inputCode);

    const extractor = createExtractor();
    const result = await extractor.extractFromProject();

    expect(result.success).toBe(true);
    expect(result.extractedFiles).toHaveLength(1);

    const extractedFile = result.extractedFiles[0];
    
    // Snapshot the transformation
    const transformationResult = {
      input: {
        code: inputCode.trim(),
        file: 'Button.styles.ts'
      },
      output: {
        css: result.generatedCSS.trim(),
        transformedCode: extractedFile.transformedCode?.trim() || '',
        extractedClasses: extractedFile.extractedClasses || [],
        success: extractedFile.success
      },
      metadata: {
        filesProcessed: result.analysisReport?.summary.filesProcessed || 0,
        stylesExtracted: result.analysisReport?.summary.stylesExtracted || 0,
        classPrefix: 'fui'
      }
    };

    expect(normalizeForSnapshot(transformationResult)).toMatchSnapshot('basic-button-transformation');
  });

  it('should match snapshot for complex component with conditional styles', async () => {
    const inputCode = `export const getStyles = (props) => {
  const { theme, actionable, compact, variant, className } = props;
  const { palette, fonts, effects } = theme || {
    palette: { white: '#ffffff', neutralLight: '#f3f2f1', themePrimary: '#0078d4' },
    fonts: { medium: { fontSize: '14px' } },
    effects: { roundedCorner2: '2px', elevation4: '0 2px 4px rgba(0,0,0,0.1)' }
  };

  return {
    root: [
      'ms-Card',
      {
        backgroundColor: palette.white,
        border: \`1px solid \${palette.neutralLight}\`,
        borderRadius: effects.roundedCorner2,
        padding: '16px',
        position: 'relative',
        userSelect: 'none',
        selectors: {
          ':focus': {
            outline: '0px solid'
          },
          '& .child-element': {
            color: palette.neutralPrimary || '#323130'
          }
        }
      },
      actionable && {
        cursor: 'pointer',
        selectors: {
          ':hover': {
            borderColor: palette.neutralTertiaryAlt || '#c8c6c4',
            boxShadow: effects.elevation4
          },
          ':hover:after': {
            content: '" "',
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            border: \`1px solid \${palette.neutralTertiaryAlt || '#c8c6c4'}\`,
            pointerEvents: 'none'
          }
        }
      },
      compact && {
        display: 'flex',
        padding: '8px',
        height: '64px'
      },
      variant === 'elevated' && {
        boxShadow: effects.elevation8 || '0 4px 8px rgba(0,0,0,0.1)',
        border: 'none'
      },
      className
    ],
    header: {
      padding: '0 0 8px 0',
      fontSize: fonts.medium.fontSize,
      fontWeight: '600',
      borderBottom: \`1px solid \${palette.neutralQuaternaryAlt || '#e1dfdd'}\`
    },
    content: {
      padding: '8px 0',
      lineHeight: '1.4'
    }
  };
};`;

    // Write input file
    const inputFile = path.join(projectDir, 'src', 'ComplexCard.styles.ts');
    await FileSystem.writeFileAsync(inputFile, inputCode);

    const extractor = createExtractor();
    const result = await extractor.extractFromProject();

    expect(result.success).toBe(true);
    expect(result.extractedFiles).toHaveLength(1);

    const extractedFile = result.extractedFiles[0];
    
    // Snapshot the transformation
    const transformationResult = {
      input: {
        code: inputCode.trim(),
        file: 'ComplexCard.styles.ts'
      },
      output: {
        css: result.generatedCSS.trim(),
        transformedCode: extractedFile.transformedCode?.trim() || '',
        extractedClasses: extractedFile.extractedClasses || [],
        success: extractedFile.success
      },
      metadata: {
        filesProcessed: result.analysisReport?.summary.filesProcessed || 0,
        stylesExtracted: result.analysisReport?.summary.stylesExtracted || 0,
        hasConditionalStyles: true,
        hasNestedSelectors: true,
        classPrefix: 'fui'
      }
    };

    expect(normalizeForSnapshot(transformationResult)).toMatchSnapshot('complex-card-transformation');
  });

  it('should match snapshot for component with theme tokens and advanced selectors', async () => {
    const inputCode = `import { getGlobalClassNames } from '../../Styling';

const GlobalClassNames = {
  root: 'ms-DocumentCard',
  rootActionable: 'ms-DocumentCard--actionable'
};

export const getStyles = (props) => {
  const { className, theme, actionable } = props;
  const { palette, fonts, effects } = theme;

  const classNames = getGlobalClassNames(GlobalClassNames, theme);

  return {
    root: [
      classNames.root,
      {
        WebkitFontSmoothing: 'antialiased',
        backgroundColor: palette.white,
        border: \`1px solid \${palette.neutralLight}\`,
        maxWidth: '320px',
        minWidth: '206px',
        userSelect: 'none',
        position: 'relative',
        selectors: {
          ':focus': {
            outline: '0px solid'
          },
          '.ms-IsFocusVisible &:focus': {
            outline: \`2px solid \${palette.neutralSecondary}\`,
            borderRadius: effects.roundedCorner2
          },
          '& .ms-DocumentCardTitle': {
            paddingTop: '4px'
          }
        }
      },
      actionable && [
        classNames.rootActionable,
        {
          selectors: {
            ':hover': {
              cursor: 'pointer',
              borderColor: palette.neutralTertiaryAlt
            },
            ':hover:after': {
              content: '" "',
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              border: \`1px solid \${palette.neutralTertiaryAlt}\`,
              pointerEvents: 'none'
            }
          }
        }
      ],
      className
    ]
  };
};`;

    // Write input file
    const inputFile = path.join(projectDir, 'src', 'DocumentCard.styles.ts');
    await FileSystem.writeFileAsync(inputFile, inputCode);

    const extractor = createExtractor();
    const result = await extractor.extractFromProject();

    expect(result.success).toBe(true);
    expect(result.extractedFiles).toHaveLength(1);

    const extractedFile = result.extractedFiles[0];
    
    // Snapshot the transformation
    const transformationResult = {
      input: {
        code: inputCode.trim(),
        file: 'DocumentCard.styles.ts'
      },
      output: {
        css: result.generatedCSS.trim(),
        transformedCode: extractedFile.transformedCode?.trim() || '',
        extractedClasses: extractedFile.extractedClasses || [],
        success: extractedFile.success
      },
      metadata: {
        filesProcessed: result.analysisReport?.summary.filesProcessed || 0,
        stylesExtracted: result.analysisReport?.summary.stylesExtracted || 0,
        hasGlobalClassNames: true,
        hasAdvancedSelectors: true,
        hasThemeUsage: true,
        classPrefix: 'fui'
      }
    };

    expect(normalizeForSnapshot(transformationResult)).toMatchSnapshot('document-card-transformation');
  });

  it('should match snapshot for multiple component extraction with theme tokens', async () => {
    const buttonCode = `export const getStyles = (props) => ({
  root: {
    backgroundColor: props.primary ? 'var(--colorBrandBackground)' : 'var(--colorNeutralBackground1)',
    padding: '8px 16px',
    borderRadius: 'var(--borderRadiusSmall)',
    fontSize: 'var(--fontSizeBase300)'
  }
});`;

    const cardCode = `export const getStyles = (props) => ({
  root: {
    backgroundColor: 'var(--colorNeutralBackground1)',
    border: '1px solid #f3f2f1',
    padding: props.compact ? '8px' : '16px',
    borderRadius: 'var(--borderRadiusSmall)'
  },
  header: {
    fontSize: 'var(--fontSizeBase300)',
    fontWeight: '600'
  }
});`;

    // Write input files
    await FileSystem.writeFileAsync(
      path.join(projectDir, 'src', 'Button.styles.ts'),
      buttonCode
    );
    await FileSystem.writeFileAsync(
      path.join(projectDir, 'src', 'Card.styles.ts'),
      cardCode
    );

    const extractor = createExtractor();
    const result = await extractor.extractFromProject();

    expect(result.success).toBe(true);
    expect(result.extractedFiles).toHaveLength(2);

    const buttonResult = result.extractedFiles.find(f => f.relativePath.includes('Button.styles.ts'));
    const cardResult = result.extractedFiles.find(f => f.relativePath.includes('Card.styles.ts'));

    // Snapshot the multi-component transformation
    const transformationResult = {
      input: {
        files: [
          { name: 'Button.styles.ts', code: buttonCode.trim() },
          { name: 'Card.styles.ts', code: cardCode.trim() }
        ]
      },
      output: {
        css: result.generatedCSS.trim(),
        transformedFiles: [
          {
            name: 'Button.styles.ts',
            code: buttonResult?.transformedCode?.trim() || '',
            classes: buttonResult?.extractedClasses || []
          },
          {
            name: 'Card.styles.ts',
            code: cardResult?.transformedCode?.trim() || '',
            classes: cardResult?.extractedClasses || []
          }
        ],
        success: result.success
      },
      metadata: {
        filesProcessed: result.analysisReport?.summary.filesProcessed || 0,
        stylesExtracted: result.analysisReport?.summary.stylesExtracted || 0,
        hasThemeTokens: true,
        themeTokens: {
          colorBrandBackground: '#0078d4',
          colorNeutralBackground1: '#ffffff',
          fontSizeBase300: '14px',
          borderRadiusSmall: '2px'
        },
        classPrefix: 'fui'
      }
    };

    expect(normalizeForSnapshot(transformationResult)).toMatchSnapshot('multi-component-with-theme-tokens');
  });

  it('should match snapshot for complex CSS-in-JS patterns', async () => {
    const inputCode = `export const getStyles = (props) => {
  const { theme, size, variant, state, className } = props;
  const { palette, fonts, spacing, effects } = theme;

  const sizeMap = {
    small: { padding: spacing.s1, fontSize: fonts.small.fontSize },
    medium: { padding: spacing.m, fontSize: fonts.medium.fontSize },
    large: { padding: spacing.l, fontSize: fonts.large.fontSize }
  };

  const variantStyles = {
    primary: {
      backgroundColor: palette.themePrimary,
      color: palette.white,
      border: \`2px solid \${palette.themePrimary}\`
    },
    secondary: {
      backgroundColor: 'transparent',
      color: palette.themePrimary,
      border: \`2px solid \${palette.themePrimary}\`
    },
    ghost: {
      backgroundColor: 'transparent',
      color: palette.neutralPrimary,
      border: '2px solid transparent'
    }
  };

  return {
    root: [
      'ms-ComplexButton',
      {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '32px',
        fontFamily: fonts.medium.fontFamily,
        fontWeight: fonts.medium.fontWeight,
        textDecoration: 'none',
        textAlign: 'center',
        cursor: 'pointer',
        userSelect: 'none',
        borderRadius: effects.roundedCorner2,
        transition: 'all 0.1s ease',
        position: 'relative',
        overflow: 'hidden',
        selectors: {
          ':before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'currentColor',
            opacity: 0,
            transition: 'opacity 0.1s ease'
          },
          ':hover:before': state !== 'disabled' ? {
            opacity: 0.1
          } : {},
          ':active:before': state !== 'disabled' ? {
            opacity: 0.2
          } : {},
          ':focus': {
            outline: \`2px solid \${palette.themePrimary}\`,
            outlineOffset: '2px'
          },
          ':focus:not(:focus-visible)': {
            outline: 'none'
          },
          '&[data-is-focus-visible="true"]': {
            outline: \`2px solid \${palette.themePrimary}\`,
            outlineOffset: '2px'
          }
        }
      },
      sizeMap[size] || sizeMap.medium,
      variantStyles[variant] || variantStyles.primary,
      state === 'disabled' && {
        opacity: 0.4,
        cursor: 'not-allowed',
        pointerEvents: 'none'
      },
      state === 'loading' && {
        cursor: 'wait',
        selectors: {
          ':after': {
            content: '""',
            position: 'absolute',
            width: '16px',
            height: '16px',
            border: '2px solid currentColor',
            borderRadius: '50%',
            borderTopColor: 'transparent',
            animation: 'spin 1s linear infinite'
          }
        }
      },
      className
    ],
    icon: {
      fontSize: '16px',
      lineHeight: 1,
      marginRight: spacing.xs,
      selectors: {
        '& svg': {
          display: 'block'
        }
      }
    },
    label: {
      fontSize: 'inherit',
      fontWeight: 'inherit',
      lineHeight: 1.2,
      margin: 0
    }
  };
};`;

    // Write input file
    const inputFile = path.join(projectDir, 'src', 'ComplexButton.styles.ts');
    await FileSystem.writeFileAsync(inputFile, inputCode);

    const extractor = createExtractor();
    const result = await extractor.extractFromProject();

    expect(result.success).toBe(true);
    expect(result.extractedFiles).toHaveLength(1);

    const extractedFile = result.extractedFiles[0];
    
    // Snapshot the complex transformation
    const transformationResult = {
      input: {
        code: inputCode.trim(),
        file: 'ComplexButton.styles.ts'
      },
      output: {
        css: result.generatedCSS.trim(),
        transformedCode: extractedFile.transformedCode?.trim() || '',
        extractedClasses: extractedFile.extractedClasses || [],
        success: extractedFile.success
      },
      metadata: {
        filesProcessed: result.analysisReport?.summary.filesProcessed || 0,
        stylesExtracted: result.analysisReport?.summary.stylesExtracted || 0,
        hasComplexLogic: true,
        hasAnimations: true,
        hasPseudoElements: true,
        hasDataAttributes: true,
        hasVariantMapping: true,
        classPrefix: 'fui'
      }
    };

    expect(normalizeForSnapshot(transformationResult)).toMatchSnapshot('complex-css-in-js-patterns');
  });
});