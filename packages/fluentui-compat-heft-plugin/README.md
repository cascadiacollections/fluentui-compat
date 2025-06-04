# FluentUI Heft Style Extractor Plugin

A Heft plugin that extracts FluentUI merge-styles from runtime TSX, TS, JS, JSX code and generates static CSS files at build time for improved performance.

## Features

- **Build-time style extraction**: Converts runtime merge-styles to static CSS
- **Heft integration**: Seamlessly integrates with the RushStack build pipeline
- **Performance optimization**: Reduces JavaScript bundle size and runtime overhead
- **TypeScript support**: Full TypeScript definitions included
- **Configurable**: Customizable extraction patterns and output options
- **PostCSS processing**: Includes autoprefixer and minification support

## Installation

```bash
npm install --save-dev @cascadiacollections/fluentui-compat-heft-plugin
```

## Usage

### Basic Configuration

Add the plugin to your Heft configuration in `config/heft.json`:

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/heft/v0/heft.schema.json",
  "heftPlugins": [
    {
      "plugin": "@cascadiacollections/fluentui-compat-heft-plugin"
    }
  ]
}
```

### Advanced Configuration

Create a configuration file at `config/fluentui-style-extractor.json`:

```json
{
  "enabled": true,
  "styleExtractor": {
    "include": [
      "src/**/*.styles.ts",
      "src/**/*.styles.tsx"
    ],
    "exclude": [
      "**/*.test.*",
      "**/*.spec.*"
    ],
    "outputDir": "dist",
    "cssFileName": "extracted-styles.css",
    "classPrefix": "fui",
    "enableSourceMaps": true,
    "minifyCSS": true,
    "themeTokens": {
      "colorBrandBackground": "#0078d4",
      "fontSizeBase400": "16px"
    }
  }
}
```

## How It Works

The plugin:

1. **Scans** your source code for `.styles.ts/.tsx/.js/.jsx` files
2. **Parses** the code using Babel to find `getStyles` functions
3. **Extracts** style definitions from merge-styles calls
4. **Generates** static CSS with scoped class names
5. **Transforms** the original code to use pre-compiled class names
6. **Outputs** optimized CSS files and analysis reports

## Configuration Options

- `include`: File patterns to include in extraction
- `exclude`: File patterns to exclude from extraction
- `outputDir`: Directory for generated CSS files
- `cssFileName`: Name of the generated CSS file
- `classPrefix`: Prefix for generated CSS class names
- `enableSourceMaps`: Generate CSS source maps
- `minifyCSS`: Minify the generated CSS
- `themeTokens`: Theme tokens to include as CSS custom properties

## Performance Benefits

- **Reduced bundle size**: Eliminates merge-styles runtime overhead
- **Faster rendering**: Styles are applied via CSS classes instead of JavaScript
- **Better caching**: CSS files can be cached separately from JavaScript
- **Improved parsing**: Browsers can parse CSS faster than JavaScript

## License

MIT - See LICENSE file for details