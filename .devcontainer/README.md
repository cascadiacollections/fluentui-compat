# FluentUI Compat DevContainer

This DevContainer provides a consistent development environment for the fluentui-compat project.

## Features

- **Node.js 20 (LTS)** - Matches the CI environment and meets project requirements
- **Rush CLI** - Pre-installed for monorepo management  
- **GitHub CLI** - For Git and GitHub operations
- **VS Code Extensions**:
  - TypeScript support with next-generation language features
  - ESLint integration for code quality
  - Prettier for code formatting
  - Jest test runner integration
  - NPM script support
  - Auto-rename tag for React development
  - Path IntelliSense for file imports
  - Node.js Debugger for debugging build processes and tests

## Automatic Setup

The DevContainer automatically:
1. Installs Rush CLI globally
2. Runs `rush update` to install all dependencies
3. Configures VS Code settings for optimal development

## Manual Commands

If you need to run setup manually:

```bash
# Install dependencies
rush update

# Build all packages
rush build

# Run tests
cd packages/fluentui-compat
npm test

# Lint code
cd packages/fluentui-compat  
npm run lint

# Generate documentation
cd packages/fluentui-compat
npm run docs
```

## Debugging

The DevContainer includes the Node.js Debugger extension for debugging:

- **Build processes**: Debug TypeScript compilation and build scripts
- **Tests**: Set breakpoints in Jest tests for debugging
- **Development**: Debug any Node.js scripts used in the project

### Setting up debugging

1. Open a file you want to debug
2. Set breakpoints by clicking in the gutter
3. Use the Debug panel (Ctrl/Cmd + Shift + D) to start debugging
4. Select the appropriate debug configuration for your needs

## Troubleshooting

### Dependencies not installed
If dependencies aren't automatically installed, run:
```bash
rush update
```

### Build issues
Ensure all dependencies are installed, then:
```bash
rush build
```

### VS Code extensions not working
The DevContainer should automatically install extensions. If they're missing:
1. Open Command Palette (Ctrl/Cmd + Shift + P)
2. Run "Developer: Reload Window"

### Test issues
If Jest tests aren't running properly:
```bash
cd packages/fluentui-compat
npm test
```