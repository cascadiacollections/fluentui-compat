#!/usr/bin/env node

/**
 * This script automates the release process:
 * 1. Applies version bumps based on change files
 * 2. Publishes packages to GitHub Packages registry
 */

const { execSync } = require('child_process');
const path = require('path');

// Change to the repository root
const repoRoot = path.resolve(__dirname, '../..');
process.chdir(repoRoot);

console.log('Starting release process...');

try {
  // Step 1: Apply version changes
  console.log('\n1. Applying version changes...');
  execSync('node common/scripts/install-run-rush.js version --bump', { 
    stdio: 'inherit',
    cwd: repoRoot 
  });

  // Step 2: Rebuild to ensure everything is up to date
  console.log('\n2. Rebuilding packages...');
  execSync('node common/scripts/install-run-rush.js rebuild --verbose', { 
    stdio: 'inherit',
    cwd: repoRoot 
  });

  // Step 3: Publish packages
  console.log('\n3. Publishing packages to GitHub Packages...');
  execSync('node common/scripts/install-run-rush.js publish --include-all --publish --apply', { 
    stdio: 'inherit',
    cwd: repoRoot 
  });

  console.log('\n✅ Release completed successfully!');

} catch (error) {
  console.error('\n❌ Release failed:', error.message);
  process.exit(1);
}