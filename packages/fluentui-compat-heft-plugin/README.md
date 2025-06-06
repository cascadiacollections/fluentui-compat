# FluentUI Heft Style Extractor Plugin

A comprehensive Heft plugin that extracts FluentUI merge-styles from runtime TSX, TS, JS, JSX code and generates static CSS files at build time for improved performance.

## Features

- **Build-time style extraction**: Converts runtime merge-styles to static CSS
- **Comprehensive API coverage**: Supports all major merge-styles APIs
- **Heft integration**: Seamlessly integrates with the RushStack build pipeline
- **Performance optimization**: Reduces JavaScript bundle size and runtime overhead
- **TypeScript support**: Full TypeScript definitions included
- **Configurable**: Customizable extraction patterns and output options
- **PostCSS processing**: Includes autoprefixer and minification support

## Supported merge-styles APIs

### Core APIs
- **`getStyles()` functions**: Traditional style function pattern
- **`mergeStyles()`**: Direct style merging calls
- **`mergeStyleSets()`**: Style set creation and merging
- **`concatStyleSets()`** and **`concatStyleSetsWithProps()`**: Style composition utilities
- **`mergeCss()`** and **`mergeCssSets()`**: CSS merging with IStyleOptions support

### Advanced APIs
- **`fontFace()`**: Font registration and @font-face rules
- **`keyframes()`**: Animation keyframes and @keyframes rules
- **Global selectors**: `:global()` wrapped selectors for global CSS rules
- **RTL and accessibility options**: Support for right-to-left layouts and accessibility features

### Function Patterns
- **Multiple naming patterns**: `getStyles`, `useStyles`, `createStyles`, `makeStyles`, `buildStyles`
- **Pattern matching**: Any function ending with "Style" or "Styles"
- **Class methods**: Style methods within classes
- **Custom wrapper functions**: Detection of custom style utility functions

### Usage Patterns
- **Inline calls**: Direct `mergeStyles()` calls in component render methods
- **Class name composition**: Combining existing class names with merge-styles results
- **Conditional styles**: Complex boolean logic and ternary expressions
- **Theme integration**: Theme token usage and interpolation

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
2. **Parses** the code using Babel to find style-related functions and API calls
3. **Extracts** style definitions from all supported merge-styles APIs
4. **Generates** static CSS with scoped class names
5. **Transforms** the original code to use pre-compiled class names
6. **Outputs** optimized CSS files and analysis reports

## API Pattern Examples

### Traditional getStyles Functions
```typescript
// Input: Traditional pattern
export const getStyles = (props) => ({
  root: {
    backgroundColor: props.primary ? '#0078d4' : '#f3f2f1',
    padding: '8px 16px',
    borderRadius: '2px'
  }
});

// Output: Pre-compiled CSS classes
export const getStyles = (props) => ({
  root: ['css-0', props.className]
});
```

### Direct mergeStyleSets Usage
```typescript
// Input: Direct API call
import { mergeStyleSets } from '@fluentui/merge-styles';

export const buttonClasses = mergeStyleSets({
  root: { padding: '8px 16px' },
  icon: { fontSize: '16px' },
  label: { fontWeight: '600' }
});

// Output: Pre-compiled class map
export const buttonClasses = {
  root: 'css-1',
  icon: 'css-2', 
  label: 'css-3'
};
```

### Style Composition with concatStyleSets
```typescript
// Input: Style composition
import { concatStyleSets } from '@fluentui/merge-styles';

const baseStyles = { root: { margin: 0 } };
const themeStyles = { root: { backgroundColor: '#fff' } };

export const combinedStyles = concatStyleSets(baseStyles, themeStyles);

// Output: Merged result
export const combinedStyles = {
  root: 'css-4'
};
```

### Font Registration with fontFace
```typescript
// Input: Font registration
import { fontFace } from '@fluentui/merge-styles';

export const customFont = fontFace({
  fontFamily: 'CustomFont',
  src: "url('custom.woff2') format('woff2')"
});

// Output: Generated font family name
export const customFont = 'CustomFont-abc123';
```

### Animation with keyframes
```typescript
// Input: Animation definition
import { keyframes } from '@fluentui/merge-styles';

export const fadeIn = keyframes({
  '0%': { opacity: 0 },
  '100%': { opacity: 1 }
});

// Output: Generated animation name
export const fadeIn = 'fadeIn-def456';
```

### Inline merge-styles Calls
```typescript
// Input: Inline usage in components
import { mergeStyles } from '@fluentui/merge-styles';

export const Button = ({ primary }) => (
  <button className={mergeStyles({
    backgroundColor: primary ? '#0078d4' : '#f3f2f1',
    color: primary ? '#fff' : '#000'
  })}>
    Click me
  </button>
);

// Output: Pre-compiled class
export const Button = ({ primary }) => (
  <button className="css-5">
    Click me
  </button>
);
```

### Global Selectors
```typescript
// Input: Global CSS patterns
export const getGlobalStyles = () => ({
  root: {
    position: 'relative',
    selectors: {
      ':global(.custom-theme)': {
        backgroundColor: '#f8f7f6'
      },
      ':global(.dark-theme) &': {
        color: '#ffffff'
      }
    }
  }
});

// Output: Processed selectors (global wrappers removed)
// CSS Generated:
// .css-6 { position: relative; }
// .custom-theme { background-color: #f8f7f6; }
// .dark-theme .css-6 { color: #ffffff; }
```

### Alternative Function Naming Patterns
```typescript
// All of these patterns are supported:
export const useButtonStyles = (props) => ({ /* styles */ });
export const createCardStyles = (theme) => ({ /* styles */ });
export const makeLayoutStyles = () => ({ /* styles */ });
export const buildFormStyles = (props) => ({ /* styles */ });
export const customComponentStyles = () => ({ /* styles */ });

// Class methods are also supported:
class StyleProvider {
  getComponentStyles(props) {
    return { root: { display: 'block' } };
  }
}
```

### Custom Wrapper Functions
```typescript
// Input: Custom style utilities
const createComponentStyle = (base, theme) => ({
  ...base,
  ...theme,
  position: 'relative'
});

export const getCardStyles = (props) => ({
  root: createComponentStyle(
    { backgroundColor: '#fff' },
    { border: `1px solid ${props.theme.palette.neutralLight}` }
  )
});

// Output: Wrapper functions are detected and processed
export const getCardStyles = (props) => ({
  root: ['css-7', props.className]
});
```

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