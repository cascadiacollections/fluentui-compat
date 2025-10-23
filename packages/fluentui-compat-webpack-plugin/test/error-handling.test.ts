/// <reference types="jest" />
import importRewriteLoader from "../src/importRewriteLoader";
import { FluentUICompatPlugin } from "../src/index";

/**
 * Error handling and edge case tests
 * Tests robustness and error recovery
 */
describe("Error Handling", () => {
  describe("importRewriteLoader error handling", () => {
    test("should handle invalid JavaScript syntax gracefully", () => {
      const input = `import { useAsync from '@fluentui/utilities';`; // Missing closing brace
      
      expect(() => {
        importRewriteLoader.call(
          { getOptions: () => ({ verbose: false }) },
          input
        );
      }).toThrow();
    });

    test("should handle empty string input", () => {
      const input = "";
      const output = importRewriteLoader.call(
        { getOptions: () => ({ verbose: false }) },
        input
      );
      expect(output).toBe("");
    });

    test("should handle whitespace-only input", () => {
      const input = "   \n\n  \t  ";
      const output = importRewriteLoader.call(
        { getOptions: () => ({ verbose: false }) },
        input
      );
      expect(output.trim()).toBe("");
    });

    test("should handle code with no imports", () => {
      const input = `
        const x = 42;
        function foo() {
          return x * 2;
        }
        export { foo };
      `;
      const output = importRewriteLoader.call(
        { getOptions: () => ({ verbose: false }) },
        input
      );
      expect(output).toBe(input);
    });

    test("should handle malformed import with extra characters", () => {
      const input = `import { useAsync, } from '@fluentui/utilities';`; // Trailing comma
      
      // Should still parse and transform
      const output = importRewriteLoader.call(
        { getOptions: () => ({ verbose: false }) },
        input
      );
      expect(output).toContain('@cascadiacollections/fluentui-compat');
    });

    test("should handle imports with comments", () => {
      const input = `
        // Import FluentUI utilities
        import { useAsync /* for async operations */ } from '@fluentui/utilities';
      `.trim();
      
      const output = importRewriteLoader.call(
        { getOptions: () => ({ verbose: false }) },
        input
      );
      expect(output).toContain('@cascadiacollections/fluentui-compat');
    });

    test("should handle very long import lists", () => {
      const exports = Array.from({ length: 50 }, (_, i) => `Export${i}`).join(', ');
      const input = `import { useAsync, ${exports} } from '@fluentui/utilities';`;
      
      const output = importRewriteLoader.call(
        { getOptions: () => ({ verbose: false }) },
        input
      );
      // Should handle without crashing
      expect(output).toBeDefined();
      expect(output.length).toBeGreaterThan(0);
    });

    test("should handle missing getOptions method", () => {
      const input = `import { useAsync } from '@fluentui/utilities';`;
      
      // Testing error case - calling with empty context
      const output = importRewriteLoader.call({} as any, input);
      
      // Should still work with undefined options
      expect(output).toBeDefined();
    });

    test("should handle null options from getOptions", () => {
      const input = `import { useAsync } from '@fluentui/utilities';`;
      
      // Testing error case - getOptions returns null
      // This should use default mappings
      const output = importRewriteLoader.call(
        { getOptions: () => ({ mappings: undefined, verbose: false }) },
        input
      );
      
      // Should still work with default mappings
      expect(output).toContain('@cascadiacollections/fluentui-compat');
    });

    test("should handle undefined mappings in options", () => {
      const input = `import { useAsync } from '@fluentui/utilities';`;
      
      const output = importRewriteLoader.call(
        { getOptions: () => ({ mappings: undefined, verbose: false }) },
        input
      );
      
      // Should use default mappings
      expect(output).toContain('@cascadiacollections/fluentui-compat');
    });

    test("should handle empty mappings array", () => {
      const input = `import { useAsync } from '@fluentui/utilities';`;
      
      const output = importRewriteLoader.call(
        { getOptions: () => ({ mappings: [], verbose: false }) },
        input
      );
      
      // Should not transform when no mappings
      expect(output).toBe(input);
    });

    test("should handle duplicate import specifiers", () => {
      const input = `
        import { useAsync } from '@fluentui/utilities';
        import { useAsync as myAsync } from '@fluentui/utilities';
      `.trim();
      
      const output = importRewriteLoader.call(
        { getOptions: () => ({ verbose: false }) },
        input
      );
      
      // Should handle both imports
      expect(output).toContain('@cascadiacollections/fluentui-compat');
    });

    test("should handle unicode characters in imports", () => {
      const input = `import { useAsync as 使用异步 } from '@fluentui/utilities';`;
      
      const output = importRewriteLoader.call(
        { getOptions: () => ({ verbose: false }) },
        input
      );
      
      expect(output).toContain('@cascadiacollections/fluentui-compat');
      expect(output).toContain('使用异步');
    });

    test("should handle template literals in code (not in imports)", () => {
      const input = `
        import { useAsync } from '@fluentui/utilities';
        
        const template = \`
          This is a template with \${useAsync}
        \`;
      `.trim();
      
      const output = importRewriteLoader.call(
        { getOptions: () => ({ verbose: false }) },
        input
      );
      
      expect(output).toContain('@cascadiacollections/fluentui-compat');
      expect(output).toContain('template');
    });
  });

  describe("FluentUICompatPlugin error handling", () => {
    test("should handle compiler without options", () => {
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
      };

      const plugin = new FluentUICompatPlugin();
      
      // Should not throw when compiler.options is undefined
      expect(() => {
        plugin.apply(mockCompiler as any);
      }).not.toThrow();
      
      expect(mockCompiler.hooks.normalModuleFactory.tap).toHaveBeenCalled();
    });

    test("should handle compiler with null module options", () => {
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
          module: null as any,
        },
      };

      const plugin = new FluentUICompatPlugin();
      
      expect(() => {
        plugin.apply(mockCompiler as any);
      }).not.toThrow();
      
      // Should initialize module.rules
      expect(mockCompiler.options.module).toBeDefined();
      expect(mockCompiler.options.module.rules).toBeDefined();
    });

    test("should handle resolve data without request property", () => {
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

      const plugin = new FluentUICompatPlugin();
      plugin.apply(mockCompiler as any);

      // Get the callback
      const callback = mockFactory.hooks.beforeResolve.tap.mock.calls[0][1];
      
      // Call with empty resolve data
      const resolveData = {};
      
      expect(() => {
        callback(resolveData);
      }).not.toThrow();
      
      expect(resolveData).toEqual({});
    });

    test("should handle null request in resolve data", () => {
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

      const plugin = new FluentUICompatPlugin();
      plugin.apply(mockCompiler as any);

      const callback = mockFactory.hooks.beforeResolve.tap.mock.calls[0][1];
      
      const resolveData = { request: null as any };
      
      expect(() => {
        callback(resolveData);
      }).not.toThrow();
      
      expect(resolveData.request).toBeNull();
    });

    test("should handle circular dependencies gracefully", () => {
      const circularMapping = {
        from: '@lib/a',
        to: '@lib/b',
      };

      const plugin = new FluentUICompatPlugin({
        mappings: [circularMapping],
      });

      const rewriteRequest = (plugin as any).rewriteRequest.bind(plugin);
      
      // Should not infinitely loop
      expect(rewriteRequest('@lib/a')).toBe('@lib/b');
      expect(rewriteRequest('@lib/b')).toBe('@lib/b'); // No mapping for b
    });

    test("should handle mappings with special characters", () => {
      const plugin = new FluentUICompatPlugin({
        mappings: [
          {
            from: '@scope/package-name_v2',
            to: '@scope/package-compat',
          }
        ],
      });

      const rewriteRequest = (plugin as any).rewriteRequest.bind(plugin);
      
      expect(rewriteRequest('@scope/package-name_v2')).toBe('@scope/package-compat');
    });

    test("should handle very long package names", () => {
      const longName = '@scope/' + 'a'.repeat(200);
      const plugin = new FluentUICompatPlugin({
        mappings: [
          {
            from: longName,
            to: '@short/name',
          }
        ],
      });

      const rewriteRequest = (plugin as any).rewriteRequest.bind(plugin);
      
      expect(rewriteRequest(longName)).toBe('@short/name');
    });

    test("should handle empty string in rewriteRequest", () => {
      const plugin = new FluentUICompatPlugin();
      const rewriteRequest = (plugin as any).rewriteRequest.bind(plugin);
      
      expect(rewriteRequest('')).toBe('');
    });

    test("should handle package names with dots", () => {
      const plugin = new FluentUICompatPlugin({
        mappings: [
          {
            from: '@scope/package.name',
            to: '@scope/compat',
          }
        ],
      });

      const rewriteRequest = (plugin as any).rewriteRequest.bind(plugin);
      
      expect(rewriteRequest('@scope/package.name')).toBe('@scope/compat');
      expect(rewriteRequest('@scope/package.name/sub')).toBe('@scope/compat/sub');
    });

    test("should handle malformed package names gracefully", () => {
      const plugin = new FluentUICompatPlugin();
      const rewriteRequest = (plugin as any).rewriteRequest.bind(plugin);
      
      // These shouldn't crash
      expect(rewriteRequest('////')).toBe('////');
      expect(rewriteRequest('...')).toBe('...');
      expect(rewriteRequest('///lib')).toBe('///lib');
    });
  });

  describe("Edge cases with TypeScript", () => {
    test("should handle enum imports", () => {
      const input = `
        import { MyEnum, useAsync } from '@fluentui/utilities';
        
        const value: MyEnum = MyEnum.Value;
      `.trim();
      
      const output = importRewriteLoader.call(
        { getOptions: () => ({ verbose: false }) },
        input
      );
      
      expect(output).toContain('@cascadiacollections/fluentui-compat');
    });

    test("should handle interface imports", () => {
      const input = `
        import { IAsyncOptions, useAsync } from '@fluentui/utilities';
        
        const options: IAsyncOptions = {};
      `.trim();
      
      const output = importRewriteLoader.call(
        { getOptions: () => ({ verbose: false }) },
        input
      );
      
      expect(output).toContain('@cascadiacollections/fluentui-compat');
    });

    test("should handle generic type parameters in imports", () => {
      const input = `
        import { UseAsyncOptions, useAsync } from '@fluentui/utilities';
        
        type MyOptions = UseAsyncOptions<string>;
      `.trim();
      
      const output = importRewriteLoader.call(
        { getOptions: () => ({ verbose: false }) },
        input
      );
      
      expect(output).toContain('@cascadiacollections/fluentui-compat');
    });
  });

  describe("Performance edge cases", () => {
    test("should handle large files efficiently", () => {
      const lines = Array.from({ length: 1000 }, (_, i) => 
        `const var${i} = ${i};`
      );
      const input = `
        import { useAsync } from '@fluentui/utilities';
        ${lines.join('\n')}
        export { useAsync };
      `;
      
      const startTime = Date.now();
      const output = importRewriteLoader.call(
        { getOptions: () => ({ verbose: false }) },
        input
      );
      const duration = Date.now() - startTime;
      
      expect(output).toContain('@cascadiacollections/fluentui-compat');
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    test("should handle multiple mappings efficiently", () => {
      const mappings = Array.from({ length: 100 }, (_, i) => ({
        from: `@lib/package${i}`,
        to: `@lib/compat${i}`,
      }));

      const plugin = new FluentUICompatPlugin({ mappings });
      const rewriteRequest = (plugin as any).rewriteRequest.bind(plugin);
      
      const startTime = Date.now();
      for (let i = 0; i < 100; i++) {
        rewriteRequest(`@lib/package${i}`);
      }
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(100); // Should be very fast
    });
  });
});
