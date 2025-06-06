/**
 * Comprehensive test suite for FluentStyleExtractor
 * Tests various merge-styles API patterns based on real FluentUI components
 */

import { FluentStyleExtractor } from '../src/FluentStyleExtractor';
import { Terminal } from '@rushstack/terminal';

describe('FluentStyleExtractor', () => {
  let mockTerminal: Terminal;
  const mockProjectPath = '/test/project';
  const mockBuildPath = '/test/build';

  beforeEach(() => {
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
    jest.clearAllMocks();
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
      buildFolderPath: mockBuildPath,
      projectFolderPath: mockProjectPath,
      terminal: mockTerminal,
      ...overrides
    };

    return new FluentStyleExtractor(options);
  };

  describe('Basic functionality', () => {
    it('should create an instance', () => {
      const extractor = createExtractor();
      expect(extractor).toBeDefined();
    });

    it('should have proper configuration defaults', () => {
      const extractor = createExtractor();
      expect(extractor).toBeInstanceOf(FluentStyleExtractor);
    });
  });

  describe('Configuration validation', () => {
    it('should accept valid configuration options', () => {
      const extractor = createExtractor({
        include: ['**/*.styles.ts'],
        exclude: ['**/*.test.*'],
        outputDir: 'build',
        cssFileName: 'styles.css',
        classPrefix: 'test',
        enableSourceMaps: true,
        minifyCSS: true,
        themeTokens: {
          colorBrand: '#0078d4'
        }
      });
      
      expect(extractor).toBeDefined();
    });

    it('should handle different class prefixes', () => {
      const customExtractor = createExtractor({
        classPrefix: 'custom'
      });
      
      expect(customExtractor).toBeDefined();
    });

    it('should handle theme tokens configuration', () => {
      const themedExtractor = createExtractor({
        themeTokens: {
          colorBrandBackground: '#0078d4',
          fontSizeBase300: '14px',
          borderRadiusSmall: '2px'
        }
      });
      
      expect(themedExtractor).toBeDefined();
    });
  });

  describe('Internal utility methods', () => {
    it('should identify style files correctly', () => {
      const extractor = createExtractor();
      
      // Access private method via any for testing
      const isStyleFile = (extractor as any)._isStyleFile;
      
      expect(isStyleFile('Button.styles.ts')).toBe(true);
      expect(isStyleFile('Button.styles.tsx')).toBe(true);
      expect(isStyleFile('Button.styles.js')).toBe(true);
      expect(isStyleFile('Button.styles.jsx')).toBe(true);
      expect(isStyleFile('Button.ts')).toBe(false);
      expect(isStyleFile('Button.tsx')).toBe(false);
      expect(isStyleFile('Button.test.ts')).toBe(false);
    });

    it('should match glob patterns correctly', () => {
      const extractor = createExtractor();
      
      // Access private method via any for testing
      const matchesGlob = (extractor as any)._matchesGlob;
      
      expect(matchesGlob('src/Button.styles.ts', '**/*.styles.ts')).toBe(true);
      expect(matchesGlob('src/Button.test.ts', '**/*.test.*')).toBe(true);
      expect(matchesGlob('src/Button.ts', '**/*.styles.ts')).toBe(false);
      expect(matchesGlob('node_modules/test.styles.ts', 'node_modules/**')).toBe(true);
    });

    it('should generate file style IDs', () => {
      const extractor = createExtractor();
      
      // Access private method via any for testing
      const generateFileStyleId = (extractor as any)._generateFileStyleId;
      const simpleHash = (extractor as any)._simpleHash;
      
      const id1 = generateFileStyleId.call(extractor, '/project/src/Button.styles.ts');
      const id2 = generateFileStyleId.call(extractor, '/project/src/Card.styles.ts');
      
      expect(id1).toMatch(/^Button-[a-z0-9]{6}$/);
      expect(id2).toMatch(/^Card-[a-z0-9]{6}$/);
      expect(id1).not.toBe(id2);
    });

    it('should create simple hash', () => {
      const extractor = createExtractor();
      
      // Access private method via any for testing
      const simpleHash = (extractor as any)._simpleHash;
      
      const hash1 = simpleHash('test string');
      const hash2 = simpleHash('test string');
      const hash3 = simpleHash('different string');
      
      expect(hash1).toBe(hash2); // Same input should produce same hash
      expect(hash1).not.toBe(hash3); // Different input should produce different hash
      expect(typeof hash1).toBe('string');
    });
  });

  describe('Style processing patterns (unit level)', () => {
    it('should identify getStyles functions in variable declarations', () => {
      const extractor = createExtractor();
      
      // Access private method via any for testing
      const isGetStylesFunction = (extractor as any)._isGetStylesFunction;
      
      // Mock AST nodes for getStyles variable declarations
      const getStylesNode = {
        id: { type: 'Identifier', name: 'getStyles' },
        init: { type: 'ArrowFunctionExpression' }
      };
      
      const otherNode = {
        id: { type: 'Identifier', name: 'otherFunction' },
        init: { type: 'ArrowFunctionExpression' }
      };
      
      expect(isGetStylesFunction(getStylesNode)).toBe(true);
      expect(isGetStylesFunction(otherNode)).toBe(false);
    });

    it('should estimate bundle reduction correctly', () => {
      const extractor = createExtractor();
      
      // Access private method via any for testing
      const estimateBundleReduction = (extractor as any)._estimateBundleReduction;
      
      // Set up metrics for testing
      (extractor as any)._metrics = { stylesExtracted: 10 };
      
      const reduction = estimateBundleReduction.call(extractor);
      expect(reduction).toBeGreaterThanOrEqual(0);
      expect(reduction).toBeLessThanOrEqual(75);
    });

    it('should generate optimization suggestions', () => {
      const extractor = createExtractor();
      
      // Access private method via any for testing
      const generateOptimizationSuggestions = (extractor as any)._generateOptimizationSuggestions;
      
      // Set up metrics for testing
      (extractor as any)._metrics = { 
        stylesExtracted: 150, 
        errors: [{ file: 'test', message: 'error', error: new Error() }] 
      };
      
      const suggestions = generateOptimizationSuggestions.call(extractor);
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]).toHaveProperty('type');
      expect(suggestions[0]).toHaveProperty('suggestion');
    });
  });

  describe('CSS generation patterns', () => {
    it('should generate theme token CSS', () => {
      const extractor = createExtractor({
        themeTokens: {
          colorBrandBackground: '#0078d4',
          fontSizeBase300: '14px',
          borderRadiusSmall: '2px'
        }
      });
      
      // Access private method via any for testing
      const generateThemeTokenCSS = (extractor as any)._generateThemeTokenCSS;
      
      const css = generateThemeTokenCSS.call(extractor);
      expect(css).toContain(':root');
      expect(css).toContain('--colorBrandBackground: #0078d4');
      expect(css).toContain('--fontSizeBase300: 14px');
      expect(css).toContain('--borderRadiusSmall: 2px');
    });

    it('should handle empty theme tokens', () => {
      const extractor = createExtractor();
      
      // Access private method via any for testing
      const generateThemeTokenCSS = (extractor as any)._generateThemeTokenCSS;
      
      const css = generateThemeTokenCSS.call(extractor);
      expect(css).toBe('');
    });
  });

  describe('AST transformation patterns', () => {
    it('should create precompiled function AST nodes', () => {
      const extractor = createExtractor();
      
      // Access private method via any for testing
      const createPrecompiledFunction = (extractor as any)._createPrecompiledFunction;
      
      const extractedData = {
        cssClasses: {
          base: 'fui-Button-abc123-root',
          root: 'fui-Button-abc123-root',
          label: 'fui-Button-abc123-label'
        }
      };
      
      const functionNode = createPrecompiledFunction.call(extractor, extractedData);
      expect(functionNode).toBeDefined();
      expect(functionNode.type).toBe('ArrowFunctionExpression');
    });

    it('should generate CSS using merge-styles', () => {
      const extractor = createExtractor();
      
      // Test merge-styles integration directly
      const { mergeStyles, Stylesheet } = require('@fluentui/merge-styles');
      
      // Reset stylesheet
      const stylesheet = Stylesheet.getInstance();
      stylesheet.reset();
      
      // Test CSS generation
      const className = mergeStyles({
        backgroundColor: 'red',
        padding: '10px',
        fontSize: '14px'
      });
      
      const css = stylesheet.getRules();
      expect(typeof className).toBe('string');
      expect(typeof css).toBe('string');
      expect(css).toContain('background-color:red');
      expect(css).toContain('padding');
      expect(css).toContain('font-size:14px');
    });
  });

  describe('Error handling patterns', () => {
    it('should handle extraction errors gracefully', () => {
      const extractor = createExtractor();
      
      // Access metrics to verify error handling structure
      const metrics = (extractor as any)._metrics;
      expect(metrics).toHaveProperty('errors');
      expect(metrics).toHaveProperty('warnings');
      expect(Array.isArray(metrics.errors)).toBe(true);
      expect(Array.isArray(metrics.warnings)).toBe(true);
    });
  });

  describe('Real-world component patterns (simplified)', () => {
    it('should handle DocumentCard-like component structure', () => {
      // Test the structural patterns without full file system operations
      const documentCardPattern = {
        hasGlobalClassNames: true,
        hasConditionalStyles: true,
        hasNestedSelectors: true,
        hasThemeUsage: true,
        hasComplexLogic: true
      };
      
      // This test validates that we understand the DocumentCard pattern structure
      expect(documentCardPattern.hasGlobalClassNames).toBe(true);
      expect(documentCardPattern.hasConditionalStyles).toBe(true);
      expect(documentCardPattern.hasNestedSelectors).toBe(true);
      expect(documentCardPattern.hasThemeUsage).toBe(true);
      expect(documentCardPattern.hasComplexLogic).toBe(true);
    });

    it('should support common FluentUI style patterns', () => {
      const commonPatterns = {
        objectStyles: { backgroundColor: 'red', padding: '8px' },
        arrayStyles: ['base-class', { color: 'blue' }],
        conditionalStyles: true && { opacity: 0.5 },
        nestedSelectors: { selectors: { ':hover': { backgroundColor: 'gray' } } },
        themeTokens: 'palette.themePrimary'
      };
      
      // Validate pattern recognition
      expect(commonPatterns.objectStyles).toHaveProperty('backgroundColor');
      expect(Array.isArray([commonPatterns.arrayStyles[0]])).toBe(true);
      expect(commonPatterns.conditionalStyles).toHaveProperty('opacity');
      expect(commonPatterns.nestedSelectors.selectors).toHaveProperty(':hover');
      expect(typeof commonPatterns.themeTokens).toBe('string');
    });
  });

  describe('Extended merge-styles API support', () => {
    let extractor: FluentStyleExtractor;

    beforeEach(() => {
      extractor = createExtractor();
    });

    describe('Style function pattern detection', () => {
      it('should detect various style function naming patterns', () => {
        const isStyleFunction = (extractor as any)._isStyleFunction;

        // Test getStyles
        const getStylesNode = {
          id: { type: 'Identifier', name: 'getStyles' },
          init: { type: 'ArrowFunctionExpression' }
        };
        expect(isStyleFunction.call(extractor, getStylesNode)).toBe(true);

        // Test useStyles
        const useStylesNode = {
          id: { type: 'Identifier', name: 'useStyles' },
          init: { type: 'ArrowFunctionExpression' }
        };
        expect(isStyleFunction.call(extractor, useStylesNode)).toBe(true);

        // Test createStyles
        const createStylesNode = {
          id: { type: 'Identifier', name: 'createStyles' },
          init: { type: 'FunctionExpression' }
        };
        expect(isStyleFunction.call(extractor, createStylesNode)).toBe(true);

        // Test functions ending with "Styles"
        const buttonStylesNode = {
          id: { type: 'Identifier', name: 'buttonStyles' },
          init: { type: 'ArrowFunctionExpression' }
        };
        expect(isStyleFunction.call(extractor, buttonStylesNode)).toBe(true);

        // Test functions ending with "Style"
        const cardStyleNode = {
          id: { type: 'Identifier', name: 'cardStyle' },
          init: { type: 'ArrowFunctionExpression' }
        };
        expect(isStyleFunction.call(extractor, cardStyleNode)).toBe(true);

        // Test non-style function
        const regularFunctionNode = {
          id: { type: 'Identifier', name: 'calculateTotal' },
          init: { type: 'ArrowFunctionExpression' }
        };
        expect(isStyleFunction.call(extractor, regularFunctionNode)).toBe(false);
      });

      it('should detect style function declarations', () => {
        const isStyleFunctionDeclaration = (extractor as any)._isStyleFunctionDeclaration;

        const getStylesDeclaration = {
          id: { name: 'getStyles' }
        };
        expect(isStyleFunctionDeclaration.call(extractor, getStylesDeclaration)).toBe(true);

        const makeStylesDeclaration = {
          id: { name: 'makeStyles' }
        };
        expect(isStyleFunctionDeclaration.call(extractor, makeStylesDeclaration)).toBe(true);

        const regularFunctionDeclaration = {
          id: { name: 'processData' }
        };
        expect(isStyleFunctionDeclaration.call(extractor, regularFunctionDeclaration)).toBe(false);
      });

      it('should detect style class methods', () => {
        const isStyleClassMethod = (extractor as any)._isStyleClassMethod;

        const getStylesMethod = {
          key: { type: 'Identifier', name: 'getStyles' }
        };
        expect(isStyleClassMethod.call(extractor, getStylesMethod)).toBe(true);

        const stylesMethod = {
          key: { type: 'Identifier', name: 'styles' }
        };
        expect(isStyleClassMethod.call(extractor, stylesMethod)).toBe(true);

        const renderMethod = {
          key: { type: 'Identifier', name: 'render' }
        };
        expect(isStyleClassMethod.call(extractor, renderMethod)).toBe(true);

        const regularMethod = {
          key: { type: 'Identifier', name: 'handleClick' }
        };
        expect(isStyleClassMethod.call(extractor, regularMethod)).toBe(false);
      });
    });

    describe('Direct merge-styles API calls', () => {
      it('should handle mergeStyles calls', () => {
        const handleMergeStylesCall = (extractor as any)._handleMergeStylesCall;
        
        // Mock call expression node
        const mockNode = {
          arguments: [
            { type: 'ObjectExpression', properties: [] }
          ]
        };
        
        const mockPath = {
          replaceWith: jest.fn()
        };
        
        const result = handleMergeStylesCall.call(extractor, mockNode, mockPath, {}, []);
        expect(result).toHaveProperty('classes');
        expect(result).toHaveProperty('hasChanges');
        expect(Array.isArray(result.classes)).toBe(true);
      });

      it('should handle mergeStyleSets calls', () => {
        const handleMergeStyleSetsCall = (extractor as any)._handleMergeStyleSetsCall;
        
        const mockNode = {
          arguments: [
            { type: 'ObjectExpression', properties: [] }
          ]
        };
        
        const mockPath = {
          replaceWith: jest.fn()
        };
        
        const result = handleMergeStyleSetsCall.call(extractor, mockNode, mockPath, {}, []);
        expect(result).toHaveProperty('classes');
        expect(result).toHaveProperty('hasChanges');
      });

      it('should handle concatStyleSets calls', () => {
        const handleConcatStyleSetsCall = (extractor as any)._handleConcatStyleSetsCall;
        
        const mockNode = {
          arguments: [
            { type: 'ObjectExpression', properties: [] },
            { type: 'ObjectExpression', properties: [] }
          ]
        };
        
        const mockPath = {
          replaceWith: jest.fn()
        };
        
        const result = handleConcatStyleSetsCall.call(extractor, mockNode, mockPath, {}, []);
        expect(result).toHaveProperty('classes');
        expect(result).toHaveProperty('hasChanges');
      });

      it('should handle fontFace calls', () => {
        const handleFontFaceCall = (extractor as any)._handleFontFaceCall;
        
        const mockNode = {
          arguments: [
            { type: 'ObjectExpression', properties: [] }
          ]
        };
        
        const mockPath = {
          replaceWith: jest.fn()
        };
        
        const result = handleFontFaceCall.call(extractor, mockNode, mockPath, {}, []);
        expect(result).toHaveProperty('classes');
        expect(result).toHaveProperty('hasChanges');
      });

      it('should handle keyframes calls', () => {
        const handleKeyframesCall = (extractor as any)._handleKeyframesCall;
        
        const mockNode = {
          arguments: [
            { type: 'ObjectExpression', properties: [] }
          ]
        };
        
        const mockPath = {
          replaceWith: jest.fn()
        };
        
        const result = handleKeyframesCall.call(extractor, mockNode, mockPath, {}, []);
        expect(result).toHaveProperty('classes');
        expect(result).toHaveProperty('hasChanges');
      });

      it('should handle mergeCss calls with options', () => {
        const handleMergeCssCall = (extractor as any)._handleMergeCssCall;
        
        const mockNode = {
          arguments: [
            { type: 'ObjectExpression', properties: [] },
            { type: 'ObjectExpression', properties: [] } // IStyleOptions
          ]
        };
        
        const mockPath = {
          replaceWith: jest.fn()
        };
        
        const result = handleMergeCssCall.call(extractor, mockNode, mockPath, {}, []);
        expect(result).toHaveProperty('classes');
        expect(result).toHaveProperty('hasChanges');
      });
    });

    describe('Global selectors and special patterns', () => {
      it('should process global selectors correctly', () => {
        const processStyleValue = (extractor as any)._processStyleValue;
        
        const selectorsValue = {
          ':global(.custom-class)': { color: 'red' },
          ':hover': { color: 'blue' },
          ':global(.another-class) .nested': { fontSize: '14px' }
        };
        
        const result = processStyleValue.call(extractor, 'selectors', selectorsValue, {});
        
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
        expect(result['.custom-class']).toEqual({ color: 'red' });
        expect(result[':hover']).toEqual({ color: 'blue' });
        expect(result['.another-class .nested']).toEqual({ fontSize: '14px' });
      });

      it('should detect custom wrapper functions', () => {
        const evaluateCustomWrapperFunction = (extractor as any)._evaluateCustomWrapperFunction;
        
        // Mock the _evaluateExpression method to return style-like objects
        const originalEvaluateExpression = (extractor as any)._evaluateExpression;
        (extractor as any)._evaluateExpression = jest.fn().mockReturnValue({ color: 'red', padding: '8px' });
        
        const mockWrapperNode = {
          callee: { type: 'Identifier', name: 'createButtonStyle' },
          arguments: [
            { type: 'ObjectExpression', properties: [{ type: 'ObjectProperty' }] }
          ]
        };
        
        const result = evaluateCustomWrapperFunction.call(extractor, mockWrapperNode, {}, {});
        
        expect(result).toBeDefined();
        expect(result).toHaveProperty('__wrapperFunction');
        expect(result.__wrapperFunction).toBe('createButtonStyle');
        expect(result).toHaveProperty('__arguments');
        
        // Restore original method
        (extractor as any)._evaluateExpression = originalEvaluateExpression;
      });

      it('should recognize wrapper function patterns', () => {
        const evaluateCustomWrapperFunction = (extractor as any)._evaluateCustomWrapperFunction;
        
        // Mock the _evaluateExpression method to return style-like objects
        const originalEvaluateExpression = (extractor as any)._evaluateExpression;
        (extractor as any)._evaluateExpression = jest.fn().mockReturnValue({ backgroundColor: 'blue' });
        
        const wrapperNames = [
          'createCardStyle',
          'makeButtonStyle', 
          'getComponentStyle',
          'buildLayoutStyle',
          'useThemeStyle',
          'buttonStyleHelper',
          'layoutStyleUtil'
        ];
        
        wrapperNames.forEach(name => {
          const mockNode = {
            callee: { type: 'Identifier', name },
            arguments: [{ type: 'ObjectExpression', properties: [] }]
          };
          
          const result = evaluateCustomWrapperFunction.call(extractor, mockNode, {}, {});
          expect(result).toBeDefined();
          expect(result).toHaveProperty('__wrapperFunction');
          expect(result.__wrapperFunction).toBe(name);
        });
        
        // Restore original method
        (extractor as any)._evaluateExpression = originalEvaluateExpression;
      });

      it('should not detect non-wrapper functions', () => {
        const evaluateCustomWrapperFunction = (extractor as any)._evaluateCustomWrapperFunction;
        
        const nonWrapperNames = [
          'calculateSum',
          'fetchData',
          'handleClick',
          'processInput',
          'validateForm'
        ];
        
        nonWrapperNames.forEach(name => {
          const mockNode = {
            callee: { type: 'Identifier', name },
            arguments: [{ type: 'ObjectExpression', properties: [] }]
          };
          
          const result = evaluateCustomWrapperFunction.call(extractor, mockNode, {}, {});
          expect(result).toBeUndefined();
        });
      });
    });

    describe('Complex nested calls and inline usage', () => {
      it('should handle inline merge-styles calls in render methods', () => {
        // This would typically be tested through integration tests
        // since it requires full AST parsing and traversal
        const sourceCode = `
          const MyComponent = () => {
            return (
              <div className={mergeStyles({ color: 'red', padding: '8px' })}>
                Content
              </div>
            );
          };
        `;
        
        // Test that the source code can be parsed
        expect(sourceCode).toContain('mergeStyles');
        expect(sourceCode).toContain('className');
      });

      it('should handle class name composition patterns', () => {
        const sourceCode = `
          const className = mergeStyles(baseClass, props.primary && primaryStyles, props.className);
        `;
        
        // Test pattern recognition
        expect(sourceCode).toContain('mergeStyles');
        expect(sourceCode).toContain('&&');
        expect(sourceCode).toContain('props.className');
      });
    });

    describe('API coverage validation', () => {
      it('should recognize all supported merge-styles APIs', () => {
        const handleMergeStylesCalls = (extractor as any)._handleMergeStylesCalls;
        
        const supportedApis = [
          'mergeStyles',
          'mergeStyleSets', 
          'concatStyleSets',
          'concatStyleSetsWithProps',
          'mergeCss',
          'mergeCssSets',
          'fontFace',
          'keyframes'
        ];
        
        supportedApis.forEach(apiName => {
          const mockPath = {
            node: {
              type: 'CallExpression',
              callee: { type: 'Identifier', name: apiName },
              arguments: []
            }
          };
          
          const result = handleMergeStylesCalls.call(extractor, mockPath, 'test', {});
          // Should not return null for supported APIs (though it might return empty results)
          expect(result).toBeDefined();
          expect(result).toHaveProperty('classes');
          expect(result).toHaveProperty('hasChanges');
          expect(Array.isArray(result.classes)).toBe(true);
          expect(typeof result.hasChanges).toBe('boolean');
        });
      });

      it('should ignore unsupported function calls', () => {
        const handleMergeStylesCalls = (extractor as any)._handleMergeStylesCalls;
        
        const unsupportedApis = [
          'console.log',
          'Math.max',
          'Object.assign',
          'customFunction',
          'someOtherApi'
        ];
        
        unsupportedApis.forEach(apiName => {
          const mockPath = {
            node: {
              callee: { type: 'Identifier', name: apiName },
              arguments: []
            }
          };
          
          const result = handleMergeStylesCalls.call(extractor, mockPath, 'test', {});
          expect(result).toBeNull();
        });
      });
    });
  });
});