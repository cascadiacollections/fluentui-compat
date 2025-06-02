# GitHub Copilot Instructions

## Project Overview

This is **fluentui-compat**, a Rush monorepo containing performant utilities and components for FluentUI React. The project focuses on render performance optimizations and provides compatibility layers for FluentUI components.

## Architecture

### Monorepo Structure
- **Rush.js** for build orchestration and dependency management
- **Two main packages**:
  - `packages/fluentui-compat/` - Core compatibility library with components like `bundleIcon`, `useAsync`, `useConst`
  - `packages/fluentui-compat-webpack-plugin/` - Webpack plugin for automatic import rewriting

### Build System
- **Heft Build Orchestrator** for TypeScript compilation
- **API Extractor** for documentation generation
- **ESLint** integration during build
- **Jest** for testing
- **PNPM** as package manager (version 8.15.8)

## Development Workflow

### Change File Requirements ⚠️
**CRITICAL**: All package modifications MUST include change files created with `rush change`. This is enforced by CI and git hooks.

```bash
# After making changes to any package
rush change
```

### DevContainer (Recommended)
1. Open in VS Code with Dev Containers extension
2. Reopen in container when prompted
3. Make changes
4. Run `rush change` for package modifications
5. Build with `rush build`
6. Test with package-specific commands
7. Submit PR

### Local Development
1. Install Rush CLI: `npm install -g @microsoft/rush`
2. Run `rush update` to install dependencies
3. Follow same workflow as DevContainer

## Common Commands

```bash
# Install dependencies
rush update

# Build all packages
rush build

# Build specific package
rush build --to fluentui-compat

# Test specific package
cd packages/fluentui-compat && pnpm test

# Lint specific package  
cd packages/fluentui-compat && pnpm run lint

# Record changes (REQUIRED)
rush change

# Verify change files
rush change --verify
```

## Code Style & Conventions

### TypeScript
- Modern ES2017+ target
- Strict TypeScript configuration
- API Extractor for public API management

### React Components
- Focus on render performance
- Memoization for optimal performance (see `bundleIcon`)
- Consistent with FluentUI patterns

### Testing
- Jest with TypeScript support
- Test files in `test/` directories
- Coverage collection from `src/` files

## Key Components

### bundleIcon
- Higher-order component for compound icons
- Switches between filled/regular variants
- Memoized for performance

### useAsync
- React hook replacement for FluentUI Async utilities
- Performance-focused implementation

### Webpack Plugin
- Automatic import rewriting
- Babel-based transformation
- Configuration examples provided

## Important Constraints

1. **Change files are mandatory** for all package modifications
2. **CI will reject** PRs without proper change files
3. **Git hooks** automatically installed to prevent pushes without change files
4. **API Extractor** maintains API consistency - public API changes require explicit approval
5. **Performance focus** - always consider render performance impact
6. **Rush monorepo patterns** - follow established conventions for cross-package dependencies

## Documentation

- API documentation auto-generated with API Extractor
- Published to GitHub Pages
- DocFX for static site generation
- Comprehensive README files per package

When working on this codebase, always remember the change file requirement and focus on maintaining the performance-oriented design principles.