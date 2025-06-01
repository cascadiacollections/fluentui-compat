# FluentUI Compat Webpack Plugin

A Webpack plugin that automatically rewrites imports from official FluentUI packages to use performance-optimized alternatives from `@cascadiacollections/fluentui-compat`.

## Features

- ✅ **Webpack 4 & 5 Compatible**: Works with both major Webpack versions
- ✅ **Drop-in Ready**: Minimal configuration required to get started
- ✅ **ES6 & CommonJS**: Handles both `import` statements and `require()` calls
- ✅ **Configurable Mappings**: Customize which imports to rewrite
- ✅ **TypeScript Support**: Full TypeScript definitions included
- ✅ **Performance Focused**: Helps migrate to optimized FluentUI components

## Installation

```bash
npm install --save-dev @cascadiacollections/fluentui-compat-webpack-plugin
```

## Quick Start

Add the plugin to your webpack configuration:

```javascript
// webpack.config.js
const FluentUICompatPlugin = require('@cascadiacollections/fluentui-compat-webpack-plugin');

module.exports = {
  // ... your existing config
  plugins: [
    new FluentUICompatPlugin()
  ]
};
```

That's it! The plugin will automatically start rewriting FluentUI imports to use optimized alternatives.

## What Gets Rewritten

By default, the plugin includes these mappings:

| Original Import | Rewritten To | Benefit |
|----------------|-------------|---------|
| `@fluentui/utilities` → `useAsync` | `@cascadiacollections/fluentui-compat` → `useAsync` | React hook with automatic cleanup |
| `@fluentui/utilities` → `useConst` | `@cascadiacollections/fluentui-compat` → `useConst` | Optimized memoization hook |

### Example Transformation

**Before:**
```typescript
import { useAsync } from '@fluentui/utilities';

function MyComponent() {
  const async = useAsync(); // React hook usage
  
  // ... rest of component
}
```

**After (automatically rewritten):**
```typescript
import { useAsync } from '@cascadiacollections/fluentui-compat';

function MyComponent() {
  const async = useAsync(); // Optimized hook with automatic cleanup
  
  // ... rest of component
}
```

## Configuration

### Custom Mappings

You can define your own import mappings:

```javascript
new FluentUICompatPlugin({
  mappings: [
    {
      from: '@fluentui/utilities',
      to: '@cascadiacollections/fluentui-compat',
      exports: {
        'useAsync': 'useAsync',
        'useConst': 'useConst'
      }
    },
    {
      from: '@fluentui/react-icons',
      to: '@cascadiacollections/fluentui-compat',
      exports: {
        'bundleIcon': 'bundleIcon'
      }
    }
  ]
})
```

### Verbose Logging

Enable logging to see what imports are being rewritten:

```javascript
new FluentUICompatPlugin({
  verbose: true
})
```

This will output rewrite operations to the console:
```
[FluentUICompatPlugin] Rewriting: @fluentui/utilities -> @cascadiacollections/fluentui-compat
```

## Configuration Options

### `PluginOptions`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mappings` | `ImportMapping[]` | See default mappings | Array of import rewrite rules |
| `verbose` | `boolean` | `false` | Enable logging of rewrite operations |

### `ImportMapping`

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `from` | `string` | ✅ | Source package to match (e.g., `@fluentui/utilities`) |
| `to` | `string` | ✅ | Target package to rewrite to |
| `exports` | `Record<string, string>` | ❌ | Specific export mappings. If omitted, rewrites entire package |

## TypeScript Support

The plugin includes full TypeScript definitions. For TypeScript projects, you may also want to set up module path mapping in your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@fluentui/utilities": ["node_modules/@cascadiacollections/fluentui-compat"]
    }
  }
}
```

## Webpack Compatibility

This plugin is tested and compatible with:

- Webpack 4.x
- Webpack 5.x

The plugin automatically detects the Webpack version and uses the appropriate APIs.

## Performance Benefits

By using this plugin, you can automatically migrate to performance-optimized FluentUI alternatives:

- **Automatic Cleanup**: Hooks like `useAsync` provide automatic resource cleanup
- **Optimized Components**: Components like `bundleIcon` are memoized for better render performance  
- **Reduced Bundle Size**: Potential for smaller bundles through better tree-shaking
- **Memory Safety**: Prevents common memory leaks from manual resource management

## Examples

### React Application

```javascript
// webpack.config.js for a React app
const FluentUICompatPlugin = require('@cascadiacollections/fluentui-compat-webpack-plugin');

module.exports = {
  entry: './src/index.tsx',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  plugins: [
    new FluentUICompatPlugin({
      verbose: process.env.NODE_ENV === 'development'
    })
  ]
};
```

### Next.js

```javascript
// next.config.js
const FluentUICompatPlugin = require('@cascadiacollections/fluentui-compat-webpack-plugin');

module.exports = {
  webpack: (config) => {
    config.plugins.push(new FluentUICompatPlugin());
    return config;
  }
};
```

### Create React App (with CRACO)

```javascript
// craco.config.js
const FluentUICompatPlugin = require('@cascadiacollections/fluentui-compat-webpack-plugin');

module.exports = {
  webpack: {
    plugins: {
      add: [new FluentUICompatPlugin()]
    }
  }
};
```

## Migration Guide

1. **Install the plugin** and `@cascadiacollections/fluentui-compat`
2. **Add the plugin** to your webpack configuration
3. **Build your project** - imports will be automatically rewritten
4. **Test thoroughly** to ensure all functionality works correctly
5. **Update import statements** if you were using the old `Async` class to use the `useAsync` hook instead

## Troubleshooting

### Plugin Not Working

1. Ensure the plugin is added to the `plugins` array in your webpack config
2. Check that you're importing from packages that have mappings configured
3. Enable `verbose: true` to see what's being rewritten

### TypeScript Errors

If you see TypeScript errors after enabling the plugin, you may need to:

1. Update your `tsconfig.json` with path mappings (see TypeScript Support section)
2. Ensure you have `@cascadiacollections/fluentui-compat` installed
3. Restart your TypeScript language server

### Build Errors

If you encounter build errors:

1. Ensure all mapped packages are installed as dependencies
2. Check that your webpack configuration is valid
3. Try building with `verbose: true` to see detailed rewrite operations

## Contributing

We welcome contributions! Please see the main [repository](https://github.com/cascadiacollections/fluentui-compat) for contribution guidelines.

## License

MIT