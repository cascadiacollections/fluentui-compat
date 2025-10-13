# fluentui-compat

> FluentUI React complimentary components and utilities focused on render performance

This is a Rush monorepo containing performant utilities and components for FluentUI React.

## Architecture

This repository is organized as a Rush monorepo using [Rush.js](https://rushjs.io/) for build orchestration and dependency management.

### Structure

```
fluentui-compat/
├── packages/
│   ├── fluentui-compat/                    # Core compatibility library
│   │   ├── src/
│   │   │   ├── bundleIcon.tsx              # Optimized bundled icon component
│   │   │   ├── useAsync.ts                 # React hook for Async utilities
│   │   │   ├── useConst.ts                 # React hook for constant values
│   │   │   └── index.ts                    # Package exports
│   │   └── dist/                           # Built output
│   └── fluentui-compat-webpack-plugin/     # Webpack plugin for automatic imports
│       ├── src/
│       │   ├── index.ts                    # Main plugin implementation
│       │   └── importRewriteLoader.ts      # Babel-based import rewriter
│       └── examples/                       # Configuration examples
├── common/                                 # Rush configuration
└── rush.json                               # Rush configuration
```

## API Documentation

Full API documentation is automatically generated and published to GitHub Pages: [https://cascadiacollections.github.io/fluentui-compat/](https://cascadiacollections.github.io/fluentui-compat/)

The documentation is built using:

- [API Extractor](https://api-extractor.com/) for generating API reports from TypeScript
- [API Documenter](https://api-extractor.com/pages/setup/generating_docs/) for converting reports to markdown
- [DocFX](https://dotnet.github.io/docfx/) for generating the static documentation website

### Future APIs

See [COMPLEMENTARY_APIS.md](./COMPLEMENTARY_APIS.md) for a comprehensive enumeration of potential complementary APIs that may be added to this package, focusing on React best practices, runtime performance, and memory considerations.

## Getting Started

### Prerequisites

- Node.js >=18.20.3
- Rush CLI: `npm install -g @microsoft/rush`

### Installation

```bash
# Install Rush globally
npm install -g @microsoft/rush

# Clone the repository
git clone https://github.com/cascadiacollections/fluentui-compat.git
cd fluentui-compat

# Install dependencies
rush update

# Build all packages
rush build
```

## DevContainer Support

This repository includes DevContainer configuration for consistent development environments. The DevContainer provides:

- Node.js 20 (LTS)
- Rush CLI pre-installed
- VS Code extensions for TypeScript, React, ESLint, and Jest
- Automatic dependency installation

### Using DevContainer

1. **Prerequisites**: Install [Docker](https://docs.docker.com/get-docker/) and [VS Code](https://code.visualstudio.com/) with the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

2. **Open in DevContainer**:

   - Clone the repository
   - Open the folder in VS Code
   - When prompted, click "Reopen in Container" or use Command Palette > "Dev Containers: Reopen in Container"

3. **Manual setup** (if auto-setup fails):
   ```bash
   rush update
   rush build
   ```

The DevContainer will automatically run `rush update` after creation to install all dependencies.

## AI Coding Assistant Support

This repository includes integration with the [RushStack MCP server](https://rushjs.io/pages/ai/rush_mcp/) to enhance AI coding assistants like GitHub Copilot, Cursor, and VS Code with Copilot.

### What is MCP?

The Model Context Protocol (MCP) is a standardized protocol that enables AI coding assistants to understand and work with your Rush monorepo structure. The RushStack MCP server provides:

- **Repository structure awareness**: Helps AI understand your monorepo organization
- **Project dependency information**: Enables AI to understand relationships between packages
- **Rush-specific commands**: Provides AI with knowledge of Rush tooling and workflows
- **Build and configuration context**: Gives AI insight into your build system

### Configuration

The MCP server is pre-configured in this repository via `.cursor/mcp.json` and is automatically available when using compatible AI coding assistants. The server is installed as an autoinstaller package managed by Rush.

#### Supported AI Coding Assistants

- **Cursor**: Automatically detects and uses `.cursor/mcp.json`
- **VS Code with GitHub Copilot**: Requires MCP extension and configuration
- **Other MCP-compatible tools**: Can be configured to use the Rush MCP server

#### Manual Setup (if needed)

If you're using an AI coding assistant that requires manual MCP configuration, the server is located at:

```
common/autoinstallers/rush-mcp-server/node_modules/.bin/rush-mcp-server
```

For more information about the Rush MCP server, see the [official documentation](https://rushjs.io/pages/ai/rush_mcp/).

## Packages

This monorepo contains two main packages:

### `@cascadiacollections/fluentui-compat`

The core compatibility library containing optimized FluentUI components and utilities:

- **bundleIcon**: Optimized higher-order component for creating compound icons
- **useAsync**: React hook that provides an Async instance with automatic cleanup
- **useConst**: React hook for creating constant values that don't change between renders
- **memoizeFunction**: High-performance memoization utilities with configurable cache management

### `@cascadiacollections/fluentui-compat-webpack-plugin`

A Webpack plugin that automatically rewrites imports from official FluentUI packages to use the optimized alternatives from the compatibility library:

- **Webpack 4 & 5 Compatible**: Works with both major Webpack versions
- **Symbol-level Import Rewriting**: Uses Babel to precisely rewrite only supported imports
- **TypeScript Support**: Full TypeScript definitions included
- **Configurable Mappings**: Customize which imports to rewrite

## bundleIcon

An optimized higher-order component for creating compound icons that can switch between filled and regular variants. This component is memoized for optimal render performance.

### Usage

```typescript
import { bundleIcon } from "fluentui-compat";
import { HeartFilled, HeartRegular } from "@fluentui/react-icons";
import { useCallback, useState } from "react";

// Create a bundled icon component
const HeartIcon = bundleIcon(HeartFilled, HeartRegular);

// Use the component
function MyComponent() {
  const [isFavorited, setIsFavorited] = useState(false);

  const handleToggleFavorite = useCallback(() => {
    setIsFavorited((prev) => !prev);
  }, []);

  return (
    <HeartIcon
      filled={isFavorited}
      onClick={handleToggleFavorite}
      className="heart-icon"
    />
  );
}
```

### API

#### `bundleIcon(FilledIcon, RegularIcon)`

Creates a memoized compound icon component.

**Parameters:**

- `FilledIcon`: FluentIcon - The filled variant of the icon
- `RegularIcon`: FluentIcon - The regular variant of the icon

**Returns:**

- A React component that accepts all standard SVG props plus:
  - `filled?: boolean` - Whether to render the filled variant
  - `className?: string` - CSS classes to apply
  - `primaryFill?: string` - Fill color for the icon

### Features

- **Performance Optimized**: Uses React.memo for efficient re-renders
- **Type Safe**: Full TypeScript support with proper type definitions
- **Flexible**: Works with any FluentUI icon components
- **Consistent**: Applies standard icon class names for styling

## useAsync

A React hook that provides an Async instance from `@fluentui/utilities` that is automatically cleaned up on component unmount.

### useAsync Usage

```typescript
import { useAsync } from "@cascadiacollections/fluentui-compat";
import { useCallback } from "react";

function MyComponent() {
  const async = useAsync();

  const handleClick = useCallback(() => {
    async.setTimeout(() => {
      console.log("Delayed action");
    }, 1000);
  }, [async]);

  return <button onClick={handleClick}>Start Timer</button>;
}
```

### useAsync Features

- **Automatic Cleanup**: All async operations are automatically disposed when the component unmounts
- **Development Warnings**: Warns about potential race conditions in development mode
- **React DevTools Integration**: Provides debugging information in development
- **Performance Optimized**: Uses stable references to prevent unnecessary re-renders

## useEventCallback

A React hook that creates stable event handlers that always call the latest version of the callback, preventing unnecessary re-renders while accessing fresh props/state.

### useEventCallback Usage

```typescript
import { useEventCallback } from "@cascadiacollections/fluentui-compat";
import { useState, useCallback } from "react";

function SearchComponent() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({});

  // The callback reference stays stable across renders
  // but always accesses the latest query and filters
  const handleSearch = useEventCallback(() => {
    performSearch(query, filters);
  });

  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <MemoizedResults onSearch={handleSearch} />
    </>
  );
}
```

### useEventCallback Features

- **Stable Reference**: The returned callback has a stable identity that never changes
- **Fresh Values**: Always executes the latest version of the callback with current props/state
- **Performance Optimized**: Prevents re-renders in child components that depend on the callback
- **Type Safe**: Full TypeScript support with generic argument and return types
- **React 19 Compatible**: Uses useLayoutEffect for synchronous updates

### When to Use useEventCallback

- Event handlers that depend on frequently changing props/state
- Callbacks passed to memoized child components to prevent unnecessary re-renders
- Event listeners attached to window, document, or long-lived DOM elements
- Callbacks in useEffect dependencies that shouldn't trigger the effect on every change

## memoizeFunction

High-performance memoization utilities optimized for runtime performance and memory efficiency. Based on FluentUI utilities with modern JavaScript optimizations.

### memoizeFunction Usage

```typescript
import { memoizeFunction, createMemoizer, resetMemoizations } from "@cascadiacollections/fluentui-compat";

// Basic memoization with configurable cache size
const expensiveComputation = memoizeFunction((a: number, b: string) => {
  console.log('Computing...'); // Only called once for same arguments
  return a * b.length + Math.random();
}, 100); // Max 100 cached results before reset

const result1 = expensiveComputation(5, "hello"); // Computes
const result2 = expensiveComputation(5, "hello"); // Cached

// For single-object-argument functions, use createMemoizer
const optimizedTransform = createMemoizer((obj: SomeObject) => ({
  ...obj,
  computed: performExpensiveComputation(obj)
}));

// Global cache reset
resetMemoizations(); // Clears all memoized function caches
```

### memoizeFunction API

#### `memoizeFunction(fn, maxCacheSize?, ignoreNullOrUndefinedResult?)`

Memoizes a function with configurable cache management.

**Parameters:**
- `fn`: Function to memoize
- `maxCacheSize`: Maximum cache entries before reset (default: 100, 0 = unlimited)
- `ignoreNullOrUndefinedResult`: Re-compute null/undefined results until non-null (default: false)

#### `createMemoizer(fn)`

Creates a WeakMap-based memoizer for single-argument functions with object/function parameters.

**Parameters:**
- `fn`: Function to memoize (must accept single object/function argument)

#### `resetMemoizations()`

Resets all memoized function caches globally.

### memoizeFunction Features

- **WeakMap-Based Caching**: Automatic memory management with garbage collection
- **Configurable Cache Limits**: Prevent memory leaks with size-based cache resets
- **Error Caching**: Exceptions are cached to avoid re-computation of failing operations  
- **Primitive Value Support**: Efficient caching of primitive arguments using shared dictionary
- **Global Reset Capability**: Bulk cache invalidation for testing and development
- **Performance Optimized**: Minimized object allocation and fast argument normalization

## Webpack Plugin Usage

For automatic import rewriting in your build process, use the webpack plugin:

```bash
npm install --save-dev @cascadiacollections/fluentui-compat-webpack-plugin
```

```javascript
// webpack.config.js
const FluentUICompatPlugin = require("@cascadiacollections/fluentui-compat-webpack-plugin");

module.exports = {
  plugins: [new FluentUICompatPlugin()],
};
```

This will automatically rewrite imports like:

```typescript
// Before
import { Async } from "@fluentui/utilities";

// After (automatically transformed)
import { useAsync } from "@cascadiacollections/fluentui-compat";
```

For more details, see the [webpack plugin documentation](packages/fluentui-compat-webpack-plugin/README.md).

## Development

### Building

```bash
# Build all packages
rush build

# Build a specific package
rush build --to fluentui-compat
```

### Testing

```bash
# Run tests for all packages
rush test

# Run tests for a specific package
cd packages/fluentui-compat
pnpm test

# Run tests for the webpack plugin
cd packages/fluentui-compat-webpack-plugin
pnpm test
```

### Linting

```bash
# Lint all packages
rush lint

# Lint a specific package
cd packages/fluentui-compat
pnpm run lint

# Lint the webpack plugin
cd packages/fluentui-compat-webpack-plugin
pnpm run lint
```

## Contributing

### Option 1: Using DevContainer (Recommended)

1. Open the repository in VS Code with Dev Containers extension
2. Reopen in container when prompted
3. Make your changes
4. **Create change files**: `rush change` (required for package modifications)
5. Run `rush build` to ensure everything builds
6. Run tests: `cd packages/fluentui-compat && pnpm test`
7. Submit a pull request

### Option 2: Local Development

1. Install Rush CLI: `npm install -g @microsoft/rush`
2. Run `rush update` to install dependencies
3. Make your changes
4. **Create change files**: `rush change` (required for package modifications)
5. Run `rush build` to ensure everything builds
6. Run tests: `cd packages/fluentui-compat && pnpm test`
7. Submit a pull request

**Note**: Change files are required for all package modifications and are automatically verified by CI and git hooks. Git hooks are automatically installed when you run `rush update`. See [MONOREPO.md](MONOREPO.md) for more details.

## License

MIT
