/// <reference types="jest" />
import { FluentUICompatPlugin, ImportMapping } from '../src/index';
import path from 'path';
import fs from 'fs';

/**
 * Enhanced integration tests
 * Tests the plugin's behavior in various scenarios without requiring full webpack compilation
 */
describe('Plugin Integration Tests', () => {
  describe('Loader path resolution', () => {
    test('should resolve loader path correctly when applied', () => {
      const mockCompiler = {
        hooks: {
          normalModuleFactory: {
            tap: jest.fn((name, callback) => {
              callback({
                hooks: {
                  beforeResolve: { tap: jest.fn() }
                }
              });
            }),
          },
        },
        options: {
          module: {
            rules: []
          }
        }
      };

      const plugin = new FluentUICompatPlugin();
      plugin.apply(mockCompiler as any);

      // Check that loader rule was added
      expect(mockCompiler.options.module.rules.length).toBeGreaterThan(0);
      
      const loaderRule = mockCompiler.options.module.rules[0] as any;
      expect(loaderRule.use.loader).toContain('importRewriteLoader');
      
      // Verify the loader path exists after build
      const loaderPath = loaderRule.use.loader;
      const resolvedPath = path.isAbsolute(loaderPath) ? loaderPath : path.resolve(__dirname, '..', loaderPath);
      
      // The loader should be in dist/ after build
      expect(loaderPath).toContain('importRewriteLoader');
    });

    test('should pass correct options to loader', () => {
      const customMappings: ImportMapping[] = [
        {
          from: '@test/lib',
          to: '@test/compat',
          exports: { foo: 'bar' }
        }
      ];

      const mockCompiler = {
        hooks: {
          normalModuleFactory: {
            tap: jest.fn((name, callback) => {
              callback({
                hooks: {
                  beforeResolve: { tap: jest.fn() }
                }
              });
            }),
          },
        },
        options: {
          module: {
            rules: []
          }
        }
      };

      const plugin = new FluentUICompatPlugin({
        mappings: customMappings,
        verbose: true
      });
      
      plugin.apply(mockCompiler as any);

      const loaderRule = mockCompiler.options.module.rules[0] as any;
      expect(loaderRule.use.options.mappings).toEqual(customMappings);
      expect(loaderRule.use.options.verbose).toBe(true);
    });
  });

  describe('Multiple plugin instances', () => {
    test('should allow multiple plugin instances with different configs', () => {
      const plugin1 = new FluentUICompatPlugin({
        mappings: [{ from: '@lib1', to: '@compat1' }]
      });

      const plugin2 = new FluentUICompatPlugin({
        mappings: [{ from: '@lib2', to: '@compat2' }]
      });

      const mockCompiler1 = createMockCompiler();
      const mockCompiler2 = createMockCompiler();

      plugin1.apply(mockCompiler1 as any);
      plugin2.apply(mockCompiler2 as any);

      // Both should work independently
      expect(mockCompiler1.hooks.normalModuleFactory.tap).toHaveBeenCalled();
      expect(mockCompiler2.hooks.normalModuleFactory.tap).toHaveBeenCalled();
    });
  });

  describe('Import rewriting with complex scenarios', () => {
    test('should handle deeply nested submodule paths', () => {
      const plugin = new FluentUICompatPlugin();
      const rewriteRequest = (plugin as any).rewriteRequest.bind(plugin);

      const deepPath = '@fluentui/utilities/lib/foo/bar/baz/qux';
      const result = rewriteRequest(deepPath);

      expect(result).toBe('@cascadiacollections/fluentui-compat/lib/foo/bar/baz/qux');
    });

    test('should handle query parameters in module requests', () => {
      const plugin = new FluentUICompatPlugin();
      const rewriteRequest = (plugin as any).rewriteRequest.bind(plugin);

      // Module requests can include query parameters
      const withQuery = '@fluentui/utilities?loader=babel-loader';
      const result = rewriteRequest(withQuery);

      // Should not rewrite when query is present (edge case)
      expect(result).toBe(withQuery);
    });

    test('should handle module requests with fragments', () => {
      const plugin = new FluentUICompatPlugin();
      const rewriteRequest = (plugin as any).rewriteRequest.bind(plugin);

      const withFragment = '@fluentui/utilities#fragment';
      const result = rewriteRequest(withFragment);

      // Should not match with fragment
      expect(result).toBe(withFragment);
    });
  });

  describe('File extension handling', () => {
    test('should match JavaScript files', () => {
      const mockCompiler = createMockCompilerWithOptions();
      const plugin = new FluentUICompatPlugin();
      plugin.apply(mockCompiler as any);

      const loaderRule = mockCompiler.options.module.rules[0] as any;
      const testRegex = loaderRule.test;

      expect(testRegex.test('app.js')).toBe(true);
      expect(testRegex.test('component.jsx')).toBe(true);
    });

    test('should match TypeScript files', () => {
      const mockCompiler = createMockCompilerWithOptions();
      const plugin = new FluentUICompatPlugin();
      plugin.apply(mockCompiler as any);

      const loaderRule = mockCompiler.options.module.rules[0] as any;
      const testRegex = loaderRule.test;

      expect(testRegex.test('app.ts')).toBe(true);
      expect(testRegex.test('component.tsx')).toBe(true);
    });

    test('should match ES modules', () => {
      const mockCompiler = createMockCompilerWithOptions();
      const plugin = new FluentUICompatPlugin();
      plugin.apply(mockCompiler as any);

      const loaderRule = mockCompiler.options.module.rules[0] as any;
      const testRegex = loaderRule.test;

      expect(testRegex.test('module.mjs')).toBe(true);
    });

    test('should not match non-JavaScript files', () => {
      const mockCompiler = createMockCompilerWithOptions();
      const plugin = new FluentUICompatPlugin();
      plugin.apply(mockCompiler as any);

      const loaderRule = mockCompiler.options.module.rules[0] as any;
      const testRegex = loaderRule.test;

      expect(testRegex.test('styles.css')).toBe(false);
      expect(testRegex.test('image.png')).toBe(false);
      expect(testRegex.test('data.json')).toBe(false);
    });
  });

  describe('Integration with webpack configurations', () => {
    test('should work when compiler has no existing rules', () => {
      const mockCompiler = {
        hooks: {
          normalModuleFactory: {
            tap: jest.fn((name, callback) => {
              callback({
                hooks: {
                  beforeResolve: { tap: jest.fn() }
                }
              });
            }),
          },
        },
        options: {
          module: undefined as any
        }
      };

      const plugin = new FluentUICompatPlugin();
      
      expect(() => {
        plugin.apply(mockCompiler as any);
      }).not.toThrow();

      // Should initialize module and rules
      expect(mockCompiler.options.module).toBeDefined();
      expect(mockCompiler.options.module.rules).toBeDefined();
      expect(mockCompiler.options.module.rules.length).toBeGreaterThan(0);
    });

    test('should prepend loader rule to existing rules', () => {
      const existingRule = {
        test: /\.css$/,
        use: 'css-loader'
      };

      const mockCompiler = {
        hooks: {
          normalModuleFactory: {
            tap: jest.fn((name, callback) => {
              callback({
                hooks: {
                  beforeResolve: { tap: jest.fn() }
                }
              });
            }),
          },
        },
        options: {
          module: {
            rules: [existingRule]
          }
        }
      };

      const plugin = new FluentUICompatPlugin();
      plugin.apply(mockCompiler as any);

      // Should have 2 rules now
      expect(mockCompiler.options.module.rules.length).toBe(2);
      
      // Our loader should be first
      const firstRule = mockCompiler.options.module.rules[0] as any;
      expect(firstRule.use.loader).toContain('importRewriteLoader');
      
      // Existing rule should still be there
      expect(mockCompiler.options.module.rules[1]).toBe(existingRule);
    });
  });

  describe('Verbose logging behavior', () => {
    test('should log when verbose is enabled and rewrite occurs', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const mockFactory = {
        hooks: {
          beforeResolve: { tap: jest.fn() }
        }
      };

      const mockCompiler = {
        hooks: {
          normalModuleFactory: {
            tap: jest.fn((name, callback) => callback(mockFactory)),
          },
        },
      };

      const plugin = new FluentUICompatPlugin({ verbose: true });
      plugin.apply(mockCompiler as any);

      // Get and invoke the callback
      const callback = mockFactory.hooks.beforeResolve.tap.mock.calls[0][1];
      const resolveData = { request: '@fluentui/utilities' };
      callback(resolveData);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[FluentUICompatPlugin] Rewriting:')
      );

      consoleSpy.mockRestore();
    });

    test('should not log when verbose is disabled', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const mockFactory = {
        hooks: {
          beforeResolve: { tap: jest.fn() }
        }
      };

      const mockCompiler = {
        hooks: {
          normalModuleFactory: {
            tap: jest.fn((name, callback) => callback(mockFactory)),
          },
        },
      };

      const plugin = new FluentUICompatPlugin({ verbose: false });
      plugin.apply(mockCompiler as any);

      const callback = mockFactory.hooks.beforeResolve.tap.mock.calls[0][1];
      const resolveData = { request: '@fluentui/utilities' };
      callback(resolveData);

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});

// Helper functions
function createMockCompiler() {
  const mockFactory = {
    hooks: {
      beforeResolve: { tap: jest.fn() },
    },
  };

  return {
    hooks: {
      normalModuleFactory: {
        tap: jest.fn((name, callback) => callback(mockFactory)),
      },
    },
    mockFactory,
  };
}

function createMockCompilerWithOptions() {
  const mockFactory = {
    hooks: {
      beforeResolve: { tap: jest.fn() },
    },
  };

  return {
    hooks: {
      normalModuleFactory: {
        tap: jest.fn((name, callback) => callback(mockFactory)),
      },
    },
    options: {
      module: {
        rules: []
      }
    },
    mockFactory,
  };
}
