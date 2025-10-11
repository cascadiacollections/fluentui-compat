# GitHub Copilot Instructions

## Project Overview

This is **fluentui-compat**, a modern Rush monorepo containing high-performance utilities and components for FluentUI React. The project specializes in render performance optimizations and provides compatibility layers enabling FluentUI components to work seamlessly across React 16, 17, 18, and 19.

## Architecture

### Monorepo Structure
- **Rush.js 5.x** for build orchestration and dependency management
- **Two main packages**:
  - `packages/fluentui-compat/` - Core compatibility library with optimized components: `bundleIcon`, `useAsync`, `useConst`, `useForceUpdate`, `useSetTimeout`, `useBoolean`
  - `packages/fluentui-compat-webpack-plugin/` - Webpack 4/5 plugin for automatic import rewriting

### Build System & Tooling
- **TypeScript 5.9+** with strict mode and modern ES2017+ target
- **API Extractor 7.x** for documentation generation and API surface management
- **ESLint 9.x** with TypeScript parser for code quality
- **Jest 30.x** with React 19 support for comprehensive testing
- **PNPM 8.15.8** as package manager with workspace support
- **React Testing Library 16.x** for modern React testing patterns

## Development Workflow

### Change File Requirements ⚠️
**CRITICAL**: All package modifications MUST include change files created with `rush change`. This is enforced by CI/CD and git hooks.

```bash
# After making changes to any package
rush change

# Verify change files before committing
rush change --verify
```

### DevContainer (Recommended)
The project includes a modern DevContainer configuration with:
- Node.js 20 LTS
- GitHub Copilot integration
- Pre-configured extensions and settings
- Automatic dependency installation

**Workflow**:
1. Open repository in VS Code with Dev Containers extension
2. Click "Reopen in Container" when prompted
3. Wait for automatic `rush update` to complete
4. Make changes and write tests
5. Run `rush change` for package modifications
6. Build with `rush build` or use VS Code tasks (Ctrl+Shift+B)
7. Test with package-specific commands or launch configurations
8. Submit PR with change files included

### Local Development
1. **Prerequisites**: Node.js >=20.0.0, Rush CLI
2. Install Rush CLI: `npm install -g @microsoft/rush`
3. Run `rush update` to install dependencies
4. Follow same workflow as DevContainer

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
- **Target**: ES2017+ with modern syntax support
- **Strict mode**: Enabled for type safety
- **Module resolution**: Node with relative imports
- **API Extractor**: Public API surface management and documentation
- **Type inference**: Leverage TypeScript's inference where possible

### React Components
- **Performance-first**: Always consider render performance impact
- **React 19 compatible**: Support React 16.14+ through 19.x
- **Memoization**: Use React.memo, useMemo, useCallback strategically (see `bundleIcon`)
- **Hooks patterns**: Prefer hooks over class components
- **FluentUI consistency**: Follow FluentUI component patterns and naming

### Testing
- **Jest 30.x** with TypeScript support via ts-jest
- **React Testing Library 16.x** for component testing
- **Test location**: `test/` directories in each package
- **Coverage**: Collected from `src/` files, minimum thresholds enforced
- **React 19**: Tests compatible with React 19 APIs and timing
- **Modern patterns**: Avoid legacy fake timers, use modern Jest APIs

## Key Components

### bundleIcon
- **Purpose**: Higher-order component for compound icons (filled/regular variants)
- **Optimization**: Memoized with React.memo for render performance
- **Usage**: Switches between icon variants based on state/props
- **Performance**: Minimal re-renders through proper memoization

### useAsync
- **Purpose**: React hook replacement for FluentUI Async class utilities
- **Features**: Automatic cleanup, memory leak prevention
- **Performance**: Optimized for minimal overhead and proper disposal
- **React 19**: Fully compatible with React 19 lifecycle

### useForceUpdate
- **Purpose**: Hook to force component re-renders when needed
- **Use cases**: Integration with non-React state management
- **Dev tools**: Development warnings for excessive usage patterns
- **Performance**: Uses useReducer for optimal performance

### useSetTimeout / useBoolean / useConst
- **Purpose**: Additional utility hooks for common patterns
- **Performance**: Zero-cost abstractions with proper cleanup
- **Memory safety**: Automatic cleanup on unmount

### Webpack Plugin
- **Purpose**: Automatic import rewriting from @fluentui to fluentui-compat
- **Compatibility**: Webpack 4 and 5 support
- **Technology**: Babel-based AST transformation
- **Configuration**: Flexible mapping configuration with examples

## Important Constraints

1. **Change files are mandatory** - All package modifications require change files via `rush change`
2. **CI/CD enforcement** - PRs without proper change files will be rejected
3. **Git hooks** - Automatically installed to prevent pushes without change files  
4. **API Extractor** - Maintains API consistency; public API changes require explicit review
5. **Performance focus** - Always consider render performance and memory impact
6. **React compatibility** - Support React 16.14+ through 19.x
7. **Rush monorepo patterns** - Follow established conventions for cross-package dependencies
8. **PNPM workspaces** - Use PNPM features for dependency management
9. **Peer dependencies** - Carefully manage peer deps for broad compatibility
10. **Testing requirements** - All new features must have comprehensive tests

## React 19 Compatibility

### Peer Dependencies
The project supports React 16.14.0 through 19.x:
```json
{
  "peerDependencies": {
    "react": ">=16.14.0 <20.0.0",
    "react-dom": ">=16.14.0 <20.0.0"
  }
}
```

### PNPM Configuration
Uses `.pnpmfile.cjs` to override peer dependencies of third-party packages for React 19 compatibility:
- @fluentui/utilities: Extended to support React 19
- @testing-library/react: Extended to support React 19
- @types/react-dom: Extended to support React 19

### Testing Considerations
- Use modern Jest APIs (avoid legacy fake timers)
- React 19 has different timing behavior in tests
- Use React Testing Library 16.x patterns
- Ensure cleanup in all tests to prevent memory leaks

## Documentation

- **API documentation**: Auto-generated with API Extractor from TypeScript declarations
- **Published**: GitHub Pages at https://cascadiacollections.github.io/fluentui-compat/
- **Build process**: API Extractor → API Documenter → DocFX static site
- **Package README**: Comprehensive README files in each package directory
- **Change logs**: Automatically generated from change files during publish
- **Examples**: Real-world usage examples in package documentation

## AI-Assisted Development with Copilot

### Best Practices
- **Context**: Provide function/component context when asking for code
- **Testing**: Always request tests for new functionality
- **Performance**: Ask Copilot to consider React render performance
- **Compatibility**: Remind about React 16-19 compatibility requirements
- **Change files**: Remember to run `rush change` after modifications

### Useful Prompts
```
"Create a React hook that [describes functionality] with proper cleanup and React 19 compatibility"
"Write Jest tests for [component/hook] using React Testing Library 16.x"
"Optimize this component for render performance using React.memo and useMemo"
"Add TypeScript types for [functionality] following the project's strict mode"
```

When working on this codebase, always remember:
1. Change file requirement for all package modifications
2. Performance-oriented design principles
3. React 16-19 compatibility
4. Comprehensive testing with modern patterns
5. API surface management with API Extractor