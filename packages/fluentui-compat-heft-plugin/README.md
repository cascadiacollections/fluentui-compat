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

## Testing

The plugin includes comprehensive test coverage with three types of tests:

### Unit Tests
Tests individual components and methods of the FluentStyleExtractor class.

### Integration Tests
End-to-end tests that process real component files and generate complete HTML demonstrations.

### Snapshot Tests
**Advanced regression testing** that captures exact transformations of CSS-in-JS input to generated CSS and modified JavaScript output.

#### Snapshot Testing Examples

The snapshot tests demonstrate the complete transformation pipeline:

```typescript
// Input: CSS-in-JS merge-styles
export const getStyles = (props) => {
  const { theme, primary, disabled } = props;
  return {
    root: [
      'ms-Button',
      {
        backgroundColor: primary ? theme.palette.themePrimary : theme.palette.white,
        padding: '8px 16px',
        borderRadius: '2px',
        selectors: {
          ':hover': { opacity: 0.8 },
          ':focus': { outline: '2px solid #0078d4' }
        }
      },
      disabled && { opacity: 0.5, cursor: 'not-allowed' }
    ]
  };
};
```

**Transforms to:**

```css
/* Generated CSS */
:root {
  --colorBrandBackground: #0078d4;
  --colorNeutralBackground1: #ffffff;
}

.fui-Button-000001-base { /* extracted styles */ }
```

```typescript
// Transformed JavaScript
export const getStyles = props => {
  return {
    root: ["fui-Button-000001-base", props.className]
  };
};
```

#### Running Snapshot Tests

```bash
# Run all tests including snapshots
npm test

# Update snapshots after code changes
npm test -- --updateSnapshot

# Run only snapshot tests
npm test -- --testPathPattern=snapshots.test.ts
```

#### Snapshot Test Coverage

The snapshot tests validate:

- ✅ **Basic component transformations** - Simple CSS-in-JS to CSS/JS
- ✅ **Complex conditional styles** - Actionable, compact, and variant states
- ✅ **Advanced selector patterns** - Pseudo-classes, child elements, focus states
- ✅ **Theme token integration** - CSS custom properties generation
- ✅ **Multi-component extraction** - Multiple files processed together
- ✅ **Real-world CSS-in-JS patterns** - Complex animations, data attributes, variant mapping

Each snapshot captures:
- Original CSS-in-JS input code
- Generated CSS output with theme tokens
- Transformed JavaScript with class name replacements
- Metadata about the transformation process

This provides **regression protection** ensuring that any changes to the extraction logic are detected and verified.

## Performance Benefits

- **Reduced bundle size**: Eliminates merge-styles runtime overhead
- **Faster rendering**: Styles are applied via CSS classes instead of JavaScript
- **Better caching**: CSS files can be cached separately from JavaScript
- **Improved parsing**: Browsers can parse CSS faster than JavaScript

## License

MIT - See LICENSE file for details