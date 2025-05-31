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

### Change File Requirements

**⚠️ Important**: All modifications to packages **must** include change files. This is enforced by CI and required for merging to main.

When you modify any package code, you must run:
```bash
rush change
```

This will prompt you to describe your changes and create the necessary change files. These files:
- Document what changed and how it affects versioning
- Are automatically processed during publishing to generate changelogs
- Are **required** for all package modifications

### Change Management
```bash
# Record changes for publishing (REQUIRED after modifying packages)
rush change

# Verify change files (done automatically in CI)
rush change --verify
```

**CI Enforcement**: The CI workflow automatically verifies that change files are present for all modified packages. Pushes and merges to main will be rejected if change files are missing.

**Optional Git Hook**: For additional local protection, you can enable the pre-push git hook:
```bash
# Enable the pre-push hook to check change files before pushing
cp common/git-hooks/pre-push.sample .git/hooks/pre-push
chmod +x .git/hooks/pre-push
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