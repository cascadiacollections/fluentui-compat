# FluentUI Compat DevContainer

This DevContainer provides a modern, AI-enhanced development environment for the fluentui-compat monorepo with GitHub Copilot integration and comprehensive tooling.

## Features

### Core Environment
- **Node.js 20 LTS (Bookworm)** - Latest LTS with full ESM and modern features support
- **Rush CLI (Latest)** - Pre-installed for monorepo management  
- **GitHub CLI** - For Git and GitHub operations
- **PNPM 8.15.8** - Fast, disk-efficient package manager

### AI & Developer Productivity
- **GitHub Copilot** - AI pair programmer for code suggestions
- **GitHub Copilot Chat** - Interactive AI assistant for development questions
- **GitLens** - Enhanced Git capabilities and history visualization
- **Error Lens** - Inline error and warning display
- **Better Comments** - Improved code comment highlighting

### TypeScript & React Development
- **TypeScript Next** - Latest TypeScript language features
- **React Snippets** - ES7+ React/Redux/React-Native snippets
- **Auto Rename Tag** - Automatically rename paired HTML/JSX tags
- **Path IntelliSense** - Autocomplete for file paths

### Code Quality & Testing
- **ESLint** - Real-time linting with ESLint 9
- **Prettier** - Automatic code formatting
- **Jest Runner** - Interactive test running and debugging
- **Jest Extension** - Enhanced Jest testing experience

### Documentation & Collaboration
- **Markdown All in One** - Comprehensive markdown support
- **GitHub Actions** - Workflow visualization and management
- **Pull Request Integration** - Manage PRs directly from VS Code

## Automatic Setup

The DevContainer automatically executes these setup steps:

1. **onCreateCommand**: Installs Rush CLI globally (latest version)
2. **postCreateCommand**: Runs `rush update` to install all dependencies and `rush build` to verify setup
3. **postAttachCommand**: Installs git hooks via `rush install` for change file enforcement
4. **Configuration Sync**: Mounts your local `.gitconfig` for consistent Git identity
5. **Environment**: Sets NODE_ENV to 'development' for optimal tooling behavior

The initial setup typically takes 2-3 minutes depending on network speed.

## Quick Start

### Using the DevContainer

1. **Prerequisites**: 
   - Install [Docker Desktop](https://docs.docker.com/get-docker/)
   - Install [VS Code](https://code.visualstudio.com/)
   - Install [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

2. **Open the Project**:
   ```bash
   # Clone the repository
   git clone https://github.com/cascadiacollections/fluentui-compat.git
   cd fluentui-compat
   
   # Open in VS Code
   code .
   ```

3. **Start DevContainer**:
   - When prompted, click "Reopen in Container"
   - Or use Command Palette (Ctrl/Cmd + Shift + P) → "Dev Containers: Reopen in Container"
   - Wait for automatic setup to complete

4. **Start Developing**:
   - Make changes to code
   - Use VS Code tasks (Ctrl/Cmd + Shift + B) for building
   - Run tests with F5 or the Jest extension
   - Use Copilot for code suggestions (inline and chat)

## Common Development Tasks

### Building
```bash
# Build all packages (recommended)
rush build

# Build specific package
rush build --to fluentui-compat

# Clean rebuild
rush rebuild

# Or use VS Code tasks (Ctrl/Cmd + Shift + B)
```

### Testing
```bash
# Run tests for a specific package
cd packages/fluentui-compat
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- useAsync.test.tsx

# Or use the Jest extension in VS Code sidebar
```

### Linting & Formatting
```bash
# Lint specific package
cd packages/fluentui-compat
npm run lint

# Lint with auto-fix
npm run lint -- --fix

# Format is automatic on save (via Prettier)
```

### Documentation
```bash
# Generate API documentation
cd packages/fluentui-compat
npm run api-extract

# Build full documentation site
npm run docs
```

### Change Files (Important!)
```bash
# Create change file after making changes
rush change

# Verify change files exist
rush change --verify

# This is REQUIRED before submitting PRs!
```

## Using GitHub Copilot

### Inline Suggestions
- Type code and Copilot will suggest completions
- Press `Tab` to accept, `Esc` to dismiss
- Press `Alt + ]` for next suggestion, `Alt + [` for previous

### Copilot Chat
- Open with `Ctrl/Cmd + Shift + I` or click chat icon
- Ask questions about code, APIs, or how to implement features
- Example prompts:
  - "How do I test this React hook with Jest?"
  - "Explain this TypeScript error"
  - "Optimize this component for render performance"
  - "Create a new hook that manages async state with cleanup"

### Slash Commands in Chat
- `/explain` - Explain selected code
- `/fix` - Suggest fixes for problems
- `/tests` - Generate tests
- `/help` - Show available commands

## Debugging

The DevContainer includes powerful debugging configurations:

### Debug Configurations (F5 or Debug panel)
- **Debug Jest Tests (fluentui-compat)** - Debug all tests in main package
- **Debug Jest Tests (webpack-plugin)** - Debug webpack plugin tests
- **Debug Current Jest Test File** - Debug the currently open test file
- **Debug TypeScript Compilation** - Debug tsc build issues
- **Debug Rush Build** - Debug the Rush build process
- **Debug Webpack Plugin Example** - Test webpack plugin in real scenario

### Setting Breakpoints
1. Open the file you want to debug
2. Click in the gutter next to line numbers to set breakpoints (red dots)
3. Select appropriate debug configuration
4. Press F5 or click green play button
5. Use debug toolbar to step through, inspect variables, etc.

## Troubleshooting

### DevContainer Won't Start
**Issue**: Container fails to build or start
**Solutions**:
- Ensure Docker Desktop is running
- Check Docker has sufficient resources (8GB RAM recommended)
- Try: Docker → Troubleshoot → Clean/Purge data
- Rebuild container: Command Palette → "Dev Containers: Rebuild Container"

### Dependencies Not Installed
**Issue**: `node_modules` or packages missing
**Solutions**:
```bash
# Full clean reinstall
rush purge
rush update
rush build
```

### Build Failures
**Issue**: TypeScript or build errors
**Solutions**:
```bash
# Ensure dependencies are current
rush update

# Clean rebuild
rush rebuild

# Check specific package
cd packages/fluentui-compat
npm run build
```

### Test Failures
**Issue**: Jest tests failing or not running
**Solutions**:
```bash
# Ensure build is current
rush build

# Run tests with verbose output
cd packages/fluentui-compat
npm test -- --verbose

# Clear Jest cache
npm test -- --clearCache
```

### Git Hooks Issues
**Issue**: Pre-push hooks failing
**Solutions**:
```bash
# Reinstall hooks
rush install

# Create missing change files
rush change

# Verify change files
rush change --verify
```

### VS Code Extensions Not Loading
**Issue**: Extensions show as not installed
**Solutions**:
- Reload window: Command Palette → "Developer: Reload Window"
- Check extensions are installing: View → Output → select "Dev Containers"
- Manually install from extensions panel if needed

### Copilot Not Working
**Issue**: Copilot suggestions not appearing
**Solutions**:
- Ensure you're signed into GitHub account with Copilot access
- Check Copilot status in bottom-right of VS Code
- Settings → GitHub Copilot → Enable for TypeScript/React
- Reload window if just enabled

### Performance Issues
**Issue**: DevContainer is slow
**Solutions**:
- Allocate more resources to Docker Desktop
- Close unused VS Code extensions
- Use `.dockerignore` to exclude unnecessary files
- Consider native development if DevContainer remains slow

## Additional Resources

- [Rush.js Documentation](https://rushjs.io/)
- [DevContainers Documentation](https://code.visualstudio.com/docs/devcontainers/containers)
- [GitHub Copilot Documentation](https://docs.github.com/en/copilot)
- [Project Documentation](https://cascadiacollections.github.io/fluentui-compat/)
- [Contributing Guide](../CONTRIBUTING.md)

## Getting Help

If you encounter issues not covered here:
1. Check GitHub Issues for similar problems
2. Review CI/CD logs for additional context
3. Ask in GitHub Discussions
4. Use Copilot Chat for quick troubleshooting tips