# @cascadiacollections/eslint-plugin-fluentui-compat

ESLint plugin to encourage using optimized `@cascadiacollections/fluentui-compat` APIs over source FluentUI APIs for better performance and React 19 compatibility.

## Installation

```bash
npm install --save-dev @cascadiacollections/eslint-plugin-fluentui-compat
```

## Usage

Add `@cascadiacollections/fluentui-compat` to the plugins section of your `.eslintrc` configuration file:

> **Note:** The plugin key in the configuration omits the `eslint-plugin-` prefix by ESLint convention. For scoped packages like `@cascadiacollections/eslint-plugin-fluentui-compat`, the plugin identifier is `@cascadiacollections/fluentui-compat`.
```json
{
  "plugins": ["@cascadiacollections/fluentui-compat"]
}
```

Then configure the rules you want to use under the rules section:

```json
{
  "rules": {
    "@cascadiacollections/fluentui-compat/prefer-fluentui-compat-bundle-icon": "warn",
    "@cascadiacollections/fluentui-compat/prefer-fluentui-compat-hooks": "warn",
    "@cascadiacollections/fluentui-compat/prefer-fluentui-compat-use-async": "warn",
    "@cascadiacollections/fluentui-compat/no-direct-fluentui-utilities": "warn"
  }
}
```

### Recommended Configuration

You can use the recommended configuration which enables all rules with warnings:

```json
{
  "extends": ["plugin:@cascadiacollections/fluentui-compat/recommended"]
}
```

### Strict Configuration

For stricter enforcement (errors instead of warnings), use the strict configuration:

```json
{
  "extends": ["plugin:@cascadiacollections/fluentui-compat/strict"]
}
```

## Rules

### `prefer-fluentui-compat-bundle-icon`

Prefer `bundleIcon` from `@cascadiacollections/fluentui-compat` over `@fluentui/react-icons` for better performance.

**Benefits:**
- Optimized memoization for minimal re-renders
- Better performance with compound icons
- Consistent with fluentui-compat optimizations

**Bad:**
```typescript
import { bundleIcon } from '@fluentui/react-icons';

const HeartIcon = bundleIcon(HeartFilled, HeartRegular);
```

**Good:**
```typescript
import { bundleIcon } from '@cascadiacollections/fluentui-compat';

const HeartIcon = bundleIcon(HeartFilled, HeartRegular);
```

### `prefer-fluentui-compat-hooks`

Prefer hooks from `@cascadiacollections/fluentui-compat` over `@fluentui/react-hooks` for better performance and React 19 compatibility.

**Affected hooks:**
- `useBoolean`
- `useConst`
- `useEventCallback`
- `useForceUpdate`
- `useId`
- `useIsomorphicLayoutEffect`
- `useMergedRefs`
- `useOnEvent`
- `usePrevious`
- `useSetTimeout`

**Benefits:**
- Full React 19 compatibility
- Optimized for render performance
- Automatic cleanup and memory management
- Stable callback references

**Bad:**
```typescript
import { useBoolean, useConst } from '@fluentui/react-hooks';

function MyComponent() {
  const [isOpen, { setTrue, setFalse }] = useBoolean(false);
  const constant = useConst(() => createExpensiveValue());
  // ...
}
```

**Good:**
```typescript
import { useBoolean, useConst } from '@cascadiacollections/fluentui-compat';

function MyComponent() {
  const [isOpen, { setTrue, setFalse }] = useBoolean(false);
  const constant = useConst(() => createExpensiveValue());
  // ...
}
```

### `prefer-fluentui-compat-use-async`

Prefer `useAsync` hook from `@cascadiacollections/fluentui-compat` over `Async` class from `@fluentui/utilities` for better React integration and automatic cleanup.

**Benefits:**
- Automatic cleanup on component unmount
- Better React integration with hooks
- Development warnings for race conditions
- Prevents memory leaks

**Bad:**
```typescript
import { Async } from '@fluentui/utilities';

function MyComponent() {
  const async = new Async();
  
  useEffect(() => {
    return () => async.dispose();
  }, []);
  
  // ...
}
```

**Good:**
```typescript
import { useAsync } from '@cascadiacollections/fluentui-compat';

function MyComponent() {
  const async = useAsync();
  
  // Automatic cleanup on unmount
  // ...
}
```

### `no-direct-fluentui-utilities`

Discourage direct usage of FluentUI utilities that have optimized alternatives in `@cascadiacollections/fluentui-compat`.

This is a comprehensive rule that catches all utilities with compat alternatives across multiple packages:

**Utilities from `@fluentui/utilities`:**
- `Async` → use `useAsync`
- `EventGroup`
- `memoizeFunction`
- `createMemoizer`
- `resetMemoizations`

**Utilities from `@fluentui/react-hooks`:**
- `useBoolean`, `useConst`, `useEventCallback`, `useForceUpdate`, `useId`
- `useIsomorphicLayoutEffect`, `useMergedRefs`, `useOnEvent`, `usePrevious`, `useSetTimeout`

**Utilities from `@fluentui/react-icons`:**
- `bundleIcon`

**Benefits:**
- Ensures consistent usage of optimized APIs
- Better performance and memory management
- React 19 compatibility
- Catches all FluentUI imports that have compat alternatives

**Bad:**
```typescript
import { Async, EventGroup } from '@fluentui/utilities';
import { useBoolean } from '@fluentui/react-hooks';
import { bundleIcon } from '@fluentui/react-icons';
```

**Good:**
```typescript
import { useAsync, EventGroup, useBoolean, bundleIcon } from '@cascadiacollections/fluentui-compat';
```

## Autofix Support

All rules support ESLint's `--fix` option to automatically update imports:

```bash
eslint --fix src/**/*.ts
```

The plugin will:
- Replace entire imports when all symbols have compat alternatives
- Split imports when only some symbols have compat alternatives
- Preserve import aliases and formatting

## Why Use This Plugin?

The `@cascadiacollections/fluentui-compat` package provides optimized, performance-focused alternatives to common FluentUI utilities:

1. **Better Performance**: Optimized implementations with minimal re-renders
2. **React 19 Compatibility**: Full support for React 16.14+ through 19.x
3. **Memory Efficiency**: Automatic cleanup and memory leak prevention
4. **Modern Patterns**: Hooks-based API aligned with modern React best practices
5. **Type Safety**: Full TypeScript support with strict type checking

## Migration Guide

### Step 1: Install the Plugin

```bash
npm install --save-dev @cascadiacollections/eslint-plugin-fluentui-compat
```

### Step 2: Add to ESLint Config

```json
{
  "extends": ["plugin:@cascadiacollections/fluentui-compat/recommended"]
}
```

### Step 3: Run ESLint with Fix

```bash
eslint --fix src/**/*.{ts,tsx}
```

### Step 4: Install fluentui-compat

```bash
npm install @cascadiacollections/fluentui-compat
```

### Step 5: Verify and Test

Review the changes and run your tests to ensure everything works correctly.

## Configuration Examples

### JavaScript (.eslintrc.js)

```javascript
module.exports = {
  plugins: ['@cascadiacollections/fluentui-compat'],
  rules: {
    '@cascadiacollections/fluentui-compat/prefer-fluentui-compat-bundle-icon': 'warn',
    '@cascadiacollections/fluentui-compat/prefer-fluentui-compat-hooks': 'warn',
    '@cascadiacollections/fluentui-compat/prefer-fluentui-compat-use-async': 'warn',
    '@cascadiacollections/fluentui-compat/no-direct-fluentui-utilities': 'warn',
  },
};
```

### TypeScript with ESLint 9+ (eslint.config.js)

```javascript
import fluentuiCompat from '@cascadiacollections/eslint-plugin-fluentui-compat';

export default [
  {
    plugins: {
      '@cascadiacollections/fluentui-compat': fluentuiCompat,
    },
    rules: {
      '@cascadiacollections/fluentui-compat/prefer-fluentui-compat-bundle-icon': 'warn',
      '@cascadiacollections/fluentui-compat/prefer-fluentui-compat-hooks': 'warn',
      '@cascadiacollections/fluentui-compat/prefer-fluentui-compat-use-async': 'warn',
      '@cascadiacollections/fluentui-compat/no-direct-fluentui-utilities': 'warn',
    },
  },
];
```

### Monorepo Configuration

For Rush or other monorepos, add to your root ESLint config:

```json
{
  "root": true,
  "extends": ["plugin:@cascadiacollections/fluentui-compat/recommended"],
  "overrides": [
    {
      "files": ["*.ts", "*.tsx"],
      "parser": "@typescript-eslint/parser"
    }
  ]
}
```

## Contributing

See the main [fluentui-compat repository](https://github.com/cascadiacollections/fluentui-compat) for contribution guidelines.

## License

MIT
