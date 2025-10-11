'use strict';

/**
 * When using the PNPM package manager, you can use pnpmfile.js to workaround
 * dependencies that have mistakes in their package.json file.  (This feature is
 * functionally similar to Yarn's "resolutions".)
 *
 * For details, see the PNPM documentation:
 * https://pnpm.io/pnpmfile#hooks
 *
 * IMPORTANT: SINCE THIS FILE CONTAINS EXECUTABLE CODE, MODIFYING IT IS LIKELY TO INVALIDATE
 * ANY CACHED DEPENDENCY ANALYSIS.  After any modification to pnpmfile.js, it's recommended to run
 * "rush update --full" so that PNPM will recalculate all version selections.
 */
module.exports = {
  hooks: {
    readPackage
  }
};

/**
 * This hook is invoked during installation before a package's dependencies
 * are selected.
 * The `packageJson` parameter is the deserialized package.json
 * contents for the package that is about to be installed.
 * The `context` parameter provides a log() function.
 * The return value is the updated object.
 */
function readPackage(packageJson, context) {

  // Override @fluentui/utilities peer dependencies to support React 19
  if (packageJson.name === '@fluentui/utilities') {
    context.log('Overriding peer dependencies for @fluentui/utilities to support React 19');
    packageJson.peerDependencies = {
      ...packageJson.peerDependencies,
      '@types/react': '>=16.8.0 <20.0.0',
      'react': '>=16.8.0 <20.0.0'
    };
  }

  // Override @fluentui/react-window-provider peer dependencies to support React 19
  if (packageJson.name === '@fluentui/react-window-provider') {
    context.log('Overriding peer dependencies for @fluentui/react-window-provider to support React 19');
    packageJson.peerDependencies = {
      ...packageJson.peerDependencies,
      '@types/react': '>=16.8.0 <20.0.0',
      'react': '>=16.8.0 <20.0.0'
    };
  }

  // Override @testing-library/react peer dependencies to support React 19
  if (packageJson.name === '@testing-library/react') {
    context.log('Overriding peer dependencies for @testing-library/react to support React 19');
    packageJson.peerDependencies = {
      ...packageJson.peerDependencies,
      'react': '^18.0.0 || ^19.0.0',
      'react-dom': '^18.0.0 || ^19.0.0'
    };
  }

  // Override @types/react-dom peer dependencies to support React 19
  if (packageJson.name === '@types/react-dom') {
    context.log('Overriding peer dependencies for @types/react-dom to support React 19');
    packageJson.peerDependencies = {
      ...packageJson.peerDependencies,
      '@types/react': '^18.0.0 || ^19.0.0'
    };
  }

  // Override @fluentui/react-context-selector peer dependencies to support scheduler 0.23.2
  if (packageJson.name === '@fluentui/react-context-selector') {
    context.log('Overriding peer dependencies for @fluentui/react-context-selector to support scheduler 0.23.2');
    packageJson.peerDependencies = {
      ...packageJson.peerDependencies,
      'scheduler': '>=0.19.0 <0.24.0'
    };
  }

  return packageJson;
}
