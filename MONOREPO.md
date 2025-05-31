# fluentui-compat Monorepo

This repository uses Rush for monorepo management.

## Commands

### Install dependencies
```bash
rush update
```

### Build all packages
```bash
rush build
```

### Build specific package
```bash
rush build --to fluentui-compat
```

### Run tests
```bash
rush test
```

### Clean all build outputs
```bash
rush purge
```

## Publishing Workflow

This repository is configured to automatically publish packages to GitHub Packages when changes are merged to the main branch.

### Change Management
```bash
# Record changes for publishing
rush change

# Verify change files (done automatically in CI)
rush change --verify
```

### Manual Publishing
```bash
# Apply version bumps and publish (for maintainers)
rush release
```

The CI pipeline automatically handles:
1. Building and testing all packages
2. Applying version bumps based on change files
3. Publishing to GitHub Packages registry
4. Creating Git tags for releases

For more commands, run `rush --help`.