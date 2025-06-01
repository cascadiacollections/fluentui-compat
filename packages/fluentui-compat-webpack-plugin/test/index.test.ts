import { FluentUICompatPlugin, ImportMapping } from '../src/index';

// Mock webpack compiler for testing
const createMockCompiler = () => {
  const mockFactory = {
    hooks: {
      beforeResolve: { tap: jest.fn() },
      resolver: { tap: jest.fn() }
    }
  };

  const mockCompilation = {
    hooks: {
      normalModuleLoader: { tap: jest.fn() }
    }
  };

  return {
    hooks: {
      normalModuleFactory: { 
        tap: jest.fn((name, callback) => callback(mockFactory))
      },
      compilation: { 
        tap: jest.fn((name, callback) => callback(mockCompilation))
      }
    },
    mockFactory,
    mockCompilation
  };
};

describe('FluentUICompatPlugin', () => {

  describe('constructor', () => {
    it('should use default options when none provided', () => {
      const plugin = new FluentUICompatPlugin();
      expect(plugin).toBeInstanceOf(FluentUICompatPlugin);
    });

    it('should use provided options', () => {
      const customMappings: ImportMapping[] = [
        {
          from: '@custom/package',
          to: '@custom/replacement'
        }
      ];

      const plugin = new FluentUICompatPlugin({
        mappings: customMappings,
        verbose: true
      });
      
      expect(plugin).toBeInstanceOf(FluentUICompatPlugin);
    });
  });

  describe('apply', () => {
    it('should register webpack hooks', () => {
      const mockCompiler = createMockCompiler();
      const plugin = new FluentUICompatPlugin();
      plugin.apply(mockCompiler as any);

      expect(mockCompiler.hooks.normalModuleFactory.tap).toHaveBeenCalledWith(
        'FluentUICompatPlugin',
        expect.any(Function)
      );
      expect(mockCompiler.hooks.compilation.tap).toHaveBeenCalledWith(
        'FluentUICompatPlugin',
        expect.any(Function)
      );
    });

    it('should register factory hooks for Webpack 5', () => {
      const mockCompiler = createMockCompiler();
      const plugin = new FluentUICompatPlugin();
      plugin.apply(mockCompiler as any);

      expect(mockCompiler.mockFactory.hooks.beforeResolve?.tap).toHaveBeenCalledWith(
        'FluentUICompatPlugin',
        expect.any(Function)
      );
    });

    it('should register factory hooks for Webpack 4 fallback', () => {
      // Create mock without Webpack 5 hook to simulate Webpack 4
      const mockFactoryWebpack4 = {
        hooks: {
          resolver: { tap: jest.fn() }
        }
      };

      const mockCompiler = {
        hooks: {
          normalModuleFactory: { 
            tap: jest.fn((name, callback) => callback(mockFactoryWebpack4))
          },
          compilation: { 
            tap: jest.fn()
          }
        }
      };

      const plugin = new FluentUICompatPlugin();
      plugin.apply(mockCompiler as any);

      expect(mockFactoryWebpack4.hooks.resolver.tap).toHaveBeenCalledWith(
        'FluentUICompatPlugin',
        expect.any(Function)
      );
    });
  });

  describe('import rewriting', () => {
    let plugin: FluentUICompatPlugin;
    let resolveCallback: (resolveData: { request?: string }) => void;

    beforeEach(() => {
      const mockCompiler = createMockCompiler();
      plugin = new FluentUICompatPlugin();
      plugin.apply(mockCompiler as any);

      // Get the resolve callback
      resolveCallback = mockCompiler.mockFactory.hooks.beforeResolve?.tap.mock.calls[0][1];
    });

    it('should rewrite direct package imports', () => {
      const resolveData = {
        request: '@fluentui/utilities'
      };

      resolveCallback(resolveData);

      expect(resolveData.request).toBe('@cascadiacollections/fluentui-compat');
    });

    it('should rewrite specific export imports', () => {
      const resolveData = {
        request: '@fluentui/utilities/lib/Async'
      };

      resolveCallback(resolveData);

      expect(resolveData.request).toBe('@cascadiacollections/fluentui-compat');
    });

    it('should rewrite submodule imports when no specific mapping exists', () => {
      const plugin = new FluentUICompatPlugin({
        mappings: [
          {
            from: '@fluentui/utilities',
            to: '@cascadiacollections/fluentui-compat'
          }
        ]
      });
      
      const mockCompiler = createMockCompiler();
      plugin.apply(mockCompiler as any);
      const callback = mockCompiler.mockFactory.hooks.beforeResolve?.tap.mock.calls[0][1];

      const resolveData = {
        request: '@fluentui/utilities/lib/SomeOtherUtility'
      };

      callback(resolveData);

      expect(resolveData.request).toBe('@cascadiacollections/fluentui-compat/lib/SomeOtherUtility');
    });

    it('should not rewrite unmatched imports', () => {
      const resolveData = {
        request: '@some/other-package'
      };

      resolveCallback(resolveData);

      expect(resolveData.request).toBe('@some/other-package');
    });

    it('should handle requests without request property', () => {
      const resolveData: { request?: string } = {};

      expect(() => resolveCallback(resolveData)).not.toThrow();
      expect(resolveData.request).toBeUndefined();
    });
  });

  describe('custom mappings', () => {
    it('should use custom mapping rules', () => {
      const customMappings: ImportMapping[] = [
        {
          from: '@custom/package',
          to: '@custom/replacement',
          exports: {
            'SpecificExport': 'NewExport'
          }
        }
      ];

      const plugin = new FluentUICompatPlugin({
        mappings: customMappings
      });

      const mockCompiler = createMockCompiler();
      plugin.apply(mockCompiler as any);
      const resolveCallback = mockCompiler.mockFactory.hooks.beforeResolve?.tap.mock.calls[0][1];

      const resolveData = {
        request: '@custom/package'
      };

      resolveCallback(resolveData);

      expect(resolveData.request).toBe('@custom/replacement');
    });
  });

  describe('verbose logging', () => {
    it('should log rewrite operations when verbose is enabled', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const plugin = new FluentUICompatPlugin({
        verbose: true
      });

      const mockCompiler = createMockCompiler();
      plugin.apply(mockCompiler as any);
      const resolveCallback = mockCompiler.mockFactory.hooks.beforeResolve?.tap.mock.calls[0][1];

      const resolveData = {
        request: '@fluentui/utilities'
      };

      resolveCallback(resolveData);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[FluentUICompatPlugin] Rewriting: @fluentui/utilities -> @cascadiacollections/fluentui-compat'
      );

      consoleSpy.mockRestore();
    });

    it('should not log when verbose is disabled', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const plugin = new FluentUICompatPlugin({
        verbose: false
      });

      const mockCompiler = createMockCompiler();
      plugin.apply(mockCompiler as any);
      const resolveCallback = mockCompiler.mockFactory.hooks.beforeResolve?.tap.mock.calls[0][1];

      const resolveData = {
        request: '@fluentui/utilities'
      };

      resolveCallback(resolveData);

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});