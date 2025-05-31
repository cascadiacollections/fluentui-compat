# fluentui-compat

> FluentUI React complimentary components and utilities focused on render performance

This is a Rush monorepo containing performant utilities and components for FluentUI React.

## Architecture

This repository is organized as a Rush monorepo using [Rush.js](https://rushjs.io/) for build orchestration and dependency management.

### Structure

```
fluentui-compat/
├── packages/
│   └── fluentui-compat/          # Core package
│       ├── src/
│       │   ├── bundleIcon.tsx    # Optimized bundled icon component
│       │   └── index.ts          # Package exports
│       └── dist/                 # Built output
├── common/                       # Rush configuration
└── rush.json                     # Rush configuration
```

## API Documentation

Full API documentation is automatically generated and published to GitHub Pages: [https://cascadiacollections.github.io/fluentui-compat/](https://cascadiacollections.github.io/fluentui-compat/)

The documentation is built using:
- [API Extractor](https://api-extractor.com/) for generating API reports from TypeScript
- [API Documenter](https://api-extractor.com/pages/setup/generating_docs/) for converting reports to markdown
- [DocFX](https://dotnet.github.io/docfx/) for generating the static documentation website

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

## Packages

### `fluentui-compat`

The core package containing optimized FluentUI components and utilities.

## bundleIcon

An optimized higher-order component for creating compound icons that can switch between filled and regular variants. This component is memoized for optimal render performance.

### Usage

```typescript
import { bundleIcon } from 'fluentui-compat';
import { HeartFilled, HeartRegular } from '@fluentui/react-icons';
import { useCallback, useState } from 'react';

// Create a bundled icon component
const HeartIcon = bundleIcon(HeartFilled, HeartRegular);

// Use the component
function MyComponent() {
  const [isFavorited, setIsFavorited] = useState(false);
  
  const handleToggleFavorite = useCallback(() => {
    setIsFavorited(prev => !prev);
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
npm test
```

### Linting

```bash
# Lint all packages
rush lint

# Lint a specific package
cd packages/fluentui-compat
npm run lint
```

## Contributing

### Option 1: Using DevContainer (Recommended)

1. Open the repository in VS Code with Dev Containers extension
2. Reopen in container when prompted
3. Make your changes
4. **Create change files**: `rush change` (required for package modifications)
5. Run `rush build` to ensure everything builds  
6. Run tests: `cd packages/fluentui-compat && npm test`
7. Submit a pull request

### Option 2: Local Development

1. Install Rush CLI: `npm install -g @microsoft/rush`
2. Run `rush update` to install dependencies
3. Make your changes
4. **Create change files**: `rush change` (required for package modifications)
5. Run `rush build` to ensure everything builds
6. Run tests: `cd packages/fluentui-compat && npm test`
7. Submit a pull request

**Note**: Change files are required for all package modifications and are automatically verified by CI and git hooks. Git hooks are automatically installed when you run `rush update`. See [MONOREPO.md](MONOREPO.md) for more details.

## License

MIT
