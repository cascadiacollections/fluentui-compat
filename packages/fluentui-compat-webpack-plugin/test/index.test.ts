/// <reference types="jest" />
import importRewriteLoader from "../src/importRewriteLoader";
describe("importRewriteLoader", () => {
  it("rewrites mapped imports to compat library", () => {
    const input = `import { useAsync, useConst } from '@fluentui/utilities';`;
    const output = importRewriteLoader.call(
      { getOptions: () => ({ verbose: false }) },
      input
    );
    expect(output).toContain(`from "@cascadiacollections/fluentui-compat"`);
    expect(output).toContain("useAsync");
    expect(output).toContain("useConst");
  });

  it("leaves unmapped imports untouched", () => {
    const input = `import { SomethingElse } from '@fluentui/utilities';`;
    const output = importRewriteLoader.call(
      { getOptions: () => ({ verbose: false }) },
      input
    );
    expect(output).toContain(
      `import { SomethingElse } from '@fluentui/utilities'`
    );
  });

  it("splits mapped and unmapped imports", () => {
    const input = `import { useAsync, SomethingElse } from '@fluentui/utilities';`;
    const output = importRewriteLoader.call(
      { getOptions: () => ({ verbose: false }) },
      input
    );
    expect(output).toContain(`from "@cascadiacollections/fluentui-compat"`);
    expect(output).toContain("useAsync");
    expect(output).toContain(
      `import { SomethingElse } from '@fluentui/utilities'`
    );
  });

  it("handles default and namespace imports without mapping", () => {
    const input = `import FluentUI, * as Fluent from '@fluentui/utilities';`;
    const output = importRewriteLoader.call(
      { getOptions: () => ({ verbose: false }) },
      input
    );
    expect(output).toContain(
      `import FluentUI, * as Fluent from '@fluentui/utilities'`
    );
  });

  it("handles multiple imports with complex scenarios", () => {
    const input = `
import { useAsync, useConst, SomethingElse, AnotherThing } from '@fluentui/utilities';
import { Foo } from '@other/package';
    `.trim();
    
    const output = importRewriteLoader.call(
      { getOptions: () => ({ verbose: false }) },
      input
    );
    
    // Should have compat import for mapped exports
    expect(output).toContain(`from "@cascadiacollections/fluentui-compat"`);
    expect(output).toMatch(/useAsync/);
    expect(output).toMatch(/useConst/);
    
    // Should preserve original import for unmapped exports
    expect(output).toContain(`from '@fluentui/utilities'`);
    expect(output).toMatch(/SomethingElse/);
    expect(output).toMatch(/AnotherThing/);
    
    // Should not touch other packages
    expect(output).toContain(`from '@other/package'`);
    expect(output).toMatch(/Foo/);
  });

  it("replaces entire import when no export map is defined", () => {
    const input = `import { something } from '@custom/package';`;
    const customMappings = [
      {
        from: '@custom/package',
        to: '@custom/replacement',
        // No exports map - should replace entire import
      }
    ];
    
    const output = importRewriteLoader.call(
      { getOptions: () => ({ mappings: customMappings, verbose: false }) },
      input
    );
    
    expect(output).toContain(`from "@custom/replacement"`);
    expect(output).not.toContain(`from '@custom/package'`);
  });

  it("logs verbose messages when rewriting entire import", () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();
    const input = `import { something } from '@custom/package';`;
    const customMappings = [
      {
        from: '@custom/package',
        to: '@custom/replacement',
      }
    ];
    
    importRewriteLoader.call(
      { getOptions: () => ({ mappings: customMappings, verbose: true }) },
      input
    );
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[import-rewrite-loader] Rewrote import:')
    );
    
    consoleSpy.mockRestore();
  });

  it("logs verbose messages when adding compat imports", () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();
    const input = `import { useAsync } from '@fluentui/utilities';`;
    
    importRewriteLoader.call(
      { getOptions: () => ({ verbose: true }) },
      input
    );
    
    expect(consoleSpy).toHaveBeenCalledWith(
      '[import-rewrite-loader] Added compat import for: @cascadiacollections/fluentui-compat'
    );
    
    consoleSpy.mockRestore();
  });

  it("handles imports from packages not in mappings", () => {
    const input = `import { Foo } from '@unmapped/package';`;
    const output = importRewriteLoader.call(
      { getOptions: () => ({ verbose: false }) },
      input
    );
    
    // Should return unchanged
    expect(output).toBe(input);
  });

  it("handles TypeScript type imports", () => {
    const input = `import type { Something } from '@fluentui/utilities';`;
    const output = importRewriteLoader.call(
      { getOptions: () => ({ verbose: false }) },
      input
    );
    
    // Type imports should not be rewritten (they don't have runtime impact)
    expect(output).toContain(`from '@fluentui/utilities'`);
  });

  it("handles aliased imports correctly", () => {
    const input = `import { useAsync as myAsync } from '@fluentui/utilities';`;
    const output = importRewriteLoader.call(
      { getOptions: () => ({ verbose: false }) },
      input
    );
    
    // Should preserve the alias correctly: import { useAsync as myAsync }
    expect(output).toContain(`from "@cascadiacollections/fluentui-compat"`);
    expect(output).toContain("useAsync as myAsync");
    // Should NOT have them backwards
    expect(output).not.toContain("myAsync as useAsync");
  });

  it("handles mixed aliased and non-aliased imports", () => {
    const input = `import { useAsync as myAsync, useConst, OtherThing } from '@fluentui/utilities';`;
    const output = importRewriteLoader.call(
      { getOptions: () => ({ verbose: false }) },
      input
    );
    
    // Should have compat import with aliased and non-aliased mapped exports
    expect(output).toContain(`from "@cascadiacollections/fluentui-compat"`);
    expect(output).toContain("useAsync as myAsync");
    expect(output).toContain("useConst");
    
    // Should preserve original import for unmapped exports
    expect(output).toContain(`from '@fluentui/utilities'`);
    expect(output).toContain("OtherThing");
  });
});
import { FluentUICompatPlugin, ImportMapping } from "../src/index";

// Mock webpack compiler for testing
const createMockCompiler = () => {
  const mockFactory = {
    hooks: {
      beforeResolve: { tap: jest.fn() },
      resolver: { tap: jest.fn() },
    },
  };

  const mockCompilation = {
    hooks: {
      normalModuleLoader: { tap: jest.fn() },
    },
  };

  return {
    hooks: {
      normalModuleFactory: {
        tap: jest.fn((name, callback) => callback(mockFactory)),
      },
      compilation: {
        tap: jest.fn((name, callback) => callback(mockCompilation)),
      },
    },
    mockFactory,
    mockCompilation,
  };
};

describe("FluentUICompatPlugin", () => {
  describe("constructor", () => {
    it("should use default options when none provided", () => {
      const plugin = new FluentUICompatPlugin();
      expect(plugin).toBeInstanceOf(FluentUICompatPlugin);
    });

    it("should use provided options", () => {
      const customMappings: ImportMapping[] = [
        {
          from: "@custom/package",
          to: "@custom/replacement",
        },
      ];

      const plugin = new FluentUICompatPlugin({
        mappings: customMappings,
        verbose: true,
      });

      expect(plugin).toBeInstanceOf(FluentUICompatPlugin);
    });
  });

  describe("apply", () => {
    it("should register webpack hooks", () => {
      const mockCompiler = createMockCompiler();
      const plugin = new FluentUICompatPlugin();
      plugin.apply(mockCompiler as any);

      expect(mockCompiler.hooks.normalModuleFactory.tap).toHaveBeenCalledWith(
        "FluentUICompatPlugin",
        expect.any(Function)
      );
    });

    it("should register import rewrite loader when compiler.options exists", () => {
      const mockCompilerWithOptions = {
        ...createMockCompiler(),
        options: {
          module: {
            rules: []
          }
        }
      };

      const plugin = new FluentUICompatPlugin();
      plugin.apply(mockCompilerWithOptions as any);

      // Check that a loader rule was added
      expect(mockCompilerWithOptions.options.module.rules.length).toBeGreaterThan(0);
      
      // Check that the first rule is our import rewrite loader
      const loaderRule = mockCompilerWithOptions.options.module.rules[0];
      expect(loaderRule).toHaveProperty('test');
      expect(loaderRule).toHaveProperty('exclude');
      expect(loaderRule).toHaveProperty('use');
      expect((loaderRule as any).use).toHaveProperty('loader');
      expect((loaderRule as any).use.loader).toContain('importRewriteLoader');
    });

    it("should register factory hooks for Webpack 5", () => {
      const mockCompiler = createMockCompiler();
      const plugin = new FluentUICompatPlugin();
      plugin.apply(mockCompiler as any);

      expect(
        mockCompiler.mockFactory.hooks.beforeResolve?.tap
      ).toHaveBeenCalledWith("FluentUICompatPlugin", expect.any(Function));
    });

    it("should register factory hooks for Webpack 4 fallback", () => {
      // Create mock without Webpack 5 hook to simulate Webpack 4
      const mockFactoryWebpack4 = {
        hooks: {
          resolver: { tap: jest.fn() },
        },
      };

      const mockCompiler = {
        hooks: {
          normalModuleFactory: {
            tap: jest.fn((name, callback) => callback(mockFactoryWebpack4)),
          },
          compilation: {
            tap: jest.fn(),
          },
        },
      };

      const plugin = new FluentUICompatPlugin();
      plugin.apply(mockCompiler as any);

      expect(mockFactoryWebpack4.hooks.resolver.tap).toHaveBeenCalledWith(
        "FluentUICompatPlugin",
        expect.any(Function)
      );
    });

    it("should handle Webpack 4 resolver hook with verbose logging", () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();
      
      // Create mock for Webpack 4 with nested hook structure
      const mockResolverHooks = {
        resolve: { tap: jest.fn() }
      };
      
      const mockFactoryWebpack4 = {
        hooks: {
          resolver: { 
            tap: jest.fn((name, callback) => {
              // Simulate resolver callback
              callback({ hooks: mockResolverHooks });
            })
          },
        },
      };

      const mockCompiler = {
        hooks: {
          normalModuleFactory: {
            tap: jest.fn((name, callback) => callback(mockFactoryWebpack4)),
          },
        },
      };

      const plugin = new FluentUICompatPlugin({ verbose: true });
      plugin.apply(mockCompiler as any);

      // Get the resolve callback
      const resolveCallback = mockResolverHooks.resolve.tap.mock.calls[0][1];
      
      // Test the callback with a rewritable request
      const context = {};
      const resolveData = { request: "@fluentui/utilities" };
      resolveCallback(context, resolveData);

      expect(resolveData.request).toBe("@cascadiacollections/fluentui-compat");
      expect(consoleSpy).toHaveBeenCalledWith(
        "[FluentUICompatPlugin] Rewriting: @fluentui/utilities -> @cascadiacollections/fluentui-compat"
      );

      consoleSpy.mockRestore();
    });

    it("should not log in Webpack 4 path when verbose is disabled", () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();
      
      const mockResolverHooks = {
        resolve: { tap: jest.fn() }
      };
      
      const mockFactoryWebpack4 = {
        hooks: {
          resolver: { 
            tap: jest.fn((name, callback) => {
              callback({ hooks: mockResolverHooks });
            })
          },
        },
      };

      const mockCompiler = {
        hooks: {
          normalModuleFactory: {
            tap: jest.fn((name, callback) => callback(mockFactoryWebpack4)),
          },
        },
      };

      const plugin = new FluentUICompatPlugin({ verbose: false });
      plugin.apply(mockCompiler as any);

      const resolveCallback = mockResolverHooks.resolve.tap.mock.calls[0][1];
      const context = {};
      const resolveData = { request: "@fluentui/utilities" };
      resolveCallback(context, resolveData);

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("import rewriting", () => {
    let plugin: FluentUICompatPlugin;
    let resolveCallback: (resolveData: { request?: string }) => void;

    beforeEach(() => {
      const mockCompiler = createMockCompiler();
      plugin = new FluentUICompatPlugin();
      plugin.apply(mockCompiler as any);

      // Get the resolve callback
      resolveCallback =
        mockCompiler.mockFactory.hooks.beforeResolve?.tap.mock.calls[0][1];
    });

    it("should rewrite direct package imports", () => {
      const resolveData = {
        request: "@fluentui/utilities",
      };

      resolveCallback(resolveData);

      expect(resolveData.request).toBe("@cascadiacollections/fluentui-compat");
    });

    it("should rewrite specific export imports", () => {
      const resolveData = {
        request: "@fluentui/utilities/lib/useAsync",
      };

      resolveCallback(resolveData);

      expect(resolveData.request).toBe("@cascadiacollections/fluentui-compat");
    });

    it("should rewrite submodule imports when no specific mapping exists", () => {
      const plugin = new FluentUICompatPlugin({
        mappings: [
          {
            from: "@fluentui/utilities",
            to: "@cascadiacollections/fluentui-compat",
          },
        ],
      });

      const mockCompiler = createMockCompiler();
      plugin.apply(mockCompiler as any);
      const callback =
        mockCompiler.mockFactory.hooks.beforeResolve?.tap.mock.calls[0][1];

      const resolveData = {
        request: "@fluentui/utilities/lib/SomeOtherUtility",
      };

      callback(resolveData);

      expect(resolveData.request).toBe(
        "@cascadiacollections/fluentui-compat/lib/SomeOtherUtility"
      );
    });

    it("should not rewrite unmatched imports", () => {
      const resolveData = {
        request: "@some/other-package",
      };

      resolveCallback(resolveData);

      expect(resolveData.request).toBe("@some/other-package");
    });

    it("should handle requests without request property", () => {
      const resolveData: { request?: string } = {};

      expect(() => resolveCallback(resolveData)).not.toThrow();
      expect(resolveData.request).toBeUndefined();
    });
  });

  describe("custom mappings", () => {
    it("should use custom mapping rules", () => {
      const customMappings: ImportMapping[] = [
        {
          from: "@custom/package",
          to: "@custom/replacement",
          exports: {
            SpecificExport: "NewExport",
          },
        },
      ];

      const plugin = new FluentUICompatPlugin({
        mappings: customMappings,
      });

      const mockCompiler = createMockCompiler();
      plugin.apply(mockCompiler as any);
      const resolveCallback =
        mockCompiler.mockFactory.hooks.beforeResolve?.tap.mock.calls[0][1];

      const resolveData = {
        request: "@custom/package",
      };

      resolveCallback(resolveData);

      expect(resolveData.request).toBe("@custom/replacement");
    });
  });

  describe("verbose logging", () => {
    it("should log rewrite operations when verbose is enabled", () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      const plugin = new FluentUICompatPlugin({
        verbose: true,
      });

      const mockCompiler = createMockCompiler();
      plugin.apply(mockCompiler as any);
      const resolveCallback =
        mockCompiler.mockFactory.hooks.beforeResolve?.tap.mock.calls[0][1];

      const resolveData = {
        request: "@fluentui/utilities",
      };

      resolveCallback(resolveData);

      expect(consoleSpy).toHaveBeenCalledWith(
        "[FluentUICompatPlugin] Rewriting: @fluentui/utilities -> @cascadiacollections/fluentui-compat"
      );

      consoleSpy.mockRestore();
    });

    it("should not log when verbose is disabled", () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      const plugin = new FluentUICompatPlugin({
        verbose: false,
      });

      const mockCompiler = createMockCompiler();
      plugin.apply(mockCompiler as any);
      const resolveCallback =
        mockCompiler.mockFactory.hooks.beforeResolve?.tap.mock.calls[0][1];

      const resolveData = {
        request: "@fluentui/utilities",
      };

      resolveCallback(resolveData);

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("rewriteRequest method", () => {
    it("should handle empty request strings", () => {
      const plugin = new FluentUICompatPlugin();
      const rewriteRequest = (plugin as any).rewriteRequest.bind(plugin);
      
      expect(rewriteRequest("")).toBe("");
    });

    it("should handle requests with trailing slashes", () => {
      const plugin = new FluentUICompatPlugin();
      const rewriteRequest = (plugin as any).rewriteRequest.bind(plugin);
      
      expect(rewriteRequest("@fluentui/utilities/")).toBe("@cascadiacollections/fluentui-compat/");
    });

    it("should handle deep nested paths", () => {
      const plugin = new FluentUICompatPlugin();
      const rewriteRequest = (plugin as any).rewriteRequest.bind(plugin);
      
      expect(rewriteRequest("@fluentui/utilities/lib/foo/bar/baz")).toBe(
        "@cascadiacollections/fluentui-compat/lib/foo/bar/baz"
      );
    });

    it("should not rewrite similar package names", () => {
      const plugin = new FluentUICompatPlugin();
      const rewriteRequest = (plugin as any).rewriteRequest.bind(plugin);
      
      // Should not match partial package names
      expect(rewriteRequest("@fluentui/utilities-extended")).toBe("@fluentui/utilities-extended");
      expect(rewriteRequest("@fluentui/util")).toBe("@fluentui/util");
    });

    it("should handle custom export mappings with subpaths", () => {
      const plugin = new FluentUICompatPlugin({
        mappings: [
          {
            from: "@custom/lib",
            to: "@custom/compat",
            exports: {
              "SpecificExport": "NewExport"
            }
          }
        ]
      });
      const rewriteRequest = (plugin as any).rewriteRequest.bind(plugin);
      
      // Should rewrite when matching export
      expect(rewriteRequest("@custom/lib/SpecificExport")).toBe("@custom/compat");
      
      // Should preserve path for non-matching exports
      expect(rewriteRequest("@custom/lib/OtherExport")).toBe("@custom/compat/OtherExport");
    });
  });

  describe("loader options configuration", () => {
    it("should pass mappings to loader when configured", () => {
      const customMappings: ImportMapping[] = [
        {
          from: "@test/package",
          to: "@test/compat",
          exports: { foo: "bar" }
        }
      ];

      const mockCompilerWithOptions = {
        ...createMockCompiler(),
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
      
      plugin.apply(mockCompilerWithOptions as any);

      const loaderRule = mockCompilerWithOptions.options.module.rules[0] as any;
      expect(loaderRule.use.options.mappings).toEqual(customMappings);
      expect(loaderRule.use.options.verbose).toBe(true);
    });

    it("should exclude node_modules in loader rule", () => {
      const mockCompilerWithOptions = {
        ...createMockCompiler(),
        options: {
          module: {
            rules: []
          }
        }
      };

      const plugin = new FluentUICompatPlugin();
      plugin.apply(mockCompilerWithOptions as any);

      const loaderRule = mockCompilerWithOptions.options.module.rules[0] as any;
      expect(loaderRule.exclude).toBeDefined();
      expect(loaderRule.exclude).toEqual(/node_modules/);
    });

    it("should test for JavaScript and TypeScript files", () => {
      const mockCompilerWithOptions = {
        ...createMockCompiler(),
        options: {
          module: {
            rules: []
          }
        }
      };

      const plugin = new FluentUICompatPlugin();
      plugin.apply(mockCompilerWithOptions as any);

      const loaderRule = mockCompilerWithOptions.options.module.rules[0] as any;
      expect(loaderRule.test).toBeDefined();
      
      // Test that the regex matches expected file extensions
      const testRegex = loaderRule.test;
      expect(testRegex.test('file.js')).toBe(true);
      expect(testRegex.test('file.jsx')).toBe(true);
      expect(testRegex.test('file.ts')).toBe(true);
      expect(testRegex.test('file.tsx')).toBe(true);
      expect(testRegex.test('file.mjs')).toBe(true);
      expect(testRegex.test('file.css')).toBe(false);
    });
  });
});
