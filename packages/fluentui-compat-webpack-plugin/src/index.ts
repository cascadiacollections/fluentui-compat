import { Compiler } from 'webpack';

/**
 * Interface for webpack plugins - compatible with both Webpack 4 and 5
 */
interface WebpackPlugin {
  apply(compiler: Compiler): void;
}

/**
 * Configuration for import mapping rules
 */
export interface ImportMapping {
  /** The original package/module to match (e.g., '@fluentui/utilities') */
  from: string;
  /** The target package to rewrite to (e.g., '@cascadiacollections/fluentui-compat') */
  to: string;
  /** Specific exports to map (optional). If not provided, maps all exports. */
  exports?: Record<string, string>;
}

/**
 * Configuration options for the FluentUI Compat Webpack Plugin
 */
export interface PluginOptions {
  /** Array of import mapping rules. If not provided, uses default mappings. */
  mappings?: ImportMapping[];
  /** Whether to log rewrite operations (default: false) */
  verbose?: boolean;
}

/**
 * Default import mappings from FluentUI packages to fluentui-compat equivalents
 */
const DEFAULT_MAPPINGS: ImportMapping[] = [
  {
    from: '@fluentui/utilities',
    to: '@cascadiacollections/fluentui-compat',
    exports: {
      'Async': 'Async',
      'useAsync': 'useAsync',
      'useConst': 'useConst',
      'useIsomorphicLayoutEffect': 'useIsomorphicLayoutEffect'
    }
  }
];

/**
 * Webpack plugin that rewrites imports from FluentUI packages to use fluentui-compat alternatives
 * 
 * This plugin uses a dual approach for comprehensive import rewriting:
 * 
 * 1. **AST Transformation (via loader)**: Processes source files with Babel to rewrite import statements,
 *    allowing selective rewriting where only specific named exports are mapped while others remain with
 *    the original package. This handles cases like:
 *    `import { useAsync, OtherExport } from '@fluentui/utilities'`
 *    which becomes two imports - one for mapped exports and one for unmapped.
 * 
 * 2. **Module Resolution Rewriting (via hooks)**: Intercepts module resolution to handle deep imports
 *    like `@fluentui/utilities/lib/Async` that bypass normal import statements.
 * 
 * The plugin is compatible with both Webpack 4 and 5 and works with ES6 import statements,
 * CommonJS require() calls, TypeScript, and JavaScript files.
 * 
 * @example
 * ```javascript
 * // webpack.config.js
 * const FluentUICompatPlugin = require('@cascadiacollections/fluentui-compat-webpack-plugin');
 * 
 * module.exports = {
 *   // ... other config
 *   plugins: [
 *     new FluentUICompatPlugin({
 *       mappings: [
 *         {
 *           from: '@fluentui/utilities',
 *           to: '@cascadiacollections/fluentui-compat',
 *           exports: { 'useAsync': 'useAsync' }
 *         }
 *       ],
 *       verbose: true
 *     })
 *   ]
 * };
 * ```
 */
export class FluentUICompatPlugin implements WebpackPlugin {
  private readonly options: Required<PluginOptions>;

  constructor(options: PluginOptions = {}) {
    this.options = {
      mappings: options.mappings || DEFAULT_MAPPINGS,
      verbose: options.verbose || false
    };
  }

  apply(compiler: Compiler): void {
    const pluginName = 'FluentUICompatPlugin';
    const path = require('path');

    // Register the import rewrite loader for source files if compiler.options exists
    // This loader uses Babel AST transformation to selectively rewrite imports
    if (compiler.options) {
      const loaderPath = path.resolve(__dirname, 'importRewriteLoader.js');
      
      compiler.options.module = compiler.options.module || { rules: [] };
      compiler.options.module.rules = compiler.options.module.rules || [];
      
      // Add the loader at the beginning to ensure it runs on source files
      compiler.options.module.rules.unshift({
        test: /\.(js|mjs|jsx|ts|tsx)$/,
        // Exclude node_modules to avoid rewriting third-party code
        exclude: /node_modules/,
        use: {
          loader: loaderPath,
          options: {
            mappings: this.options.mappings,
            verbose: this.options.verbose
          }
        }
      });
    }

    // Also hook into the normalModuleFactory for package-level resolution
    // This ensures deep imports (e.g., '@fluentui/utilities/lib/Async') are handled
    compiler.hooks.normalModuleFactory.tap(pluginName, (factory: any) => {
      // Use different hooks based on Webpack version
      if (factory.hooks.beforeResolve) {
        // Webpack 5 approach
        factory.hooks.beforeResolve.tap(pluginName, (resolveData: any) => {
          if (resolveData.request) {
            const rewritten = this.rewriteRequest(resolveData.request);
            if (rewritten !== resolveData.request) {
              if (this.options.verbose) {
                console.log(`[${pluginName}] Rewriting: ${resolveData.request} -> ${rewritten}`);
              }
              resolveData.request = rewritten;
            }
          }
        });
      } else if (factory.hooks.resolver) {
        // Webpack 4 approach (fallback)
        factory.hooks.resolver.tap(pluginName, (resolver: any) => {
          resolver.hooks.resolve.tap(pluginName, (context: any, resolveData: any) => {
            if (resolveData.request) {
              const rewritten = this.rewriteRequest(resolveData.request);
              if (rewritten !== resolveData.request) {
                if (this.options.verbose) {
                  console.log(`[${pluginName}] Rewriting: ${resolveData.request} -> ${rewritten}`);
                }
                resolveData.request = rewritten;
              }
            }
          });
        });
      }
    });
  }

  /**
   * Rewrites a module request based on the configured mappings
   */
  private rewriteRequest(request: string): string {
    for (const mapping of this.options.mappings) {
      if (request === mapping.from) {
        // Direct package replacement
        return mapping.to;
      }
      
      if (request.startsWith(mapping.from + '/')) {
        // Submodule import (e.g., '@fluentui/utilities/lib/Async')
        const subpath = request.substring(mapping.from.length + 1);
        
        // Check if we have specific export mappings
        if (mapping.exports) {
          for (const [fromExport] of Object.entries(mapping.exports)) {
            if (subpath === fromExport || subpath.endsWith('/' + fromExport)) {
              // Map to the specific export in the target package
              return mapping.to;
            }
          }
        }
        
        // Default: replace the package but keep the subpath
        return mapping.to + '/' + subpath;
      }
    }
    
    return request;
  }
}

// Default export for CommonJS compatibility
export default FluentUICompatPlugin;