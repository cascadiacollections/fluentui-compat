import { preferBundleIcon } from './rules/prefer-fluentui-compat-bundle-icon';
import { preferCompatHooks } from './rules/prefer-fluentui-compat-hooks';
import { preferUseAsync } from './rules/prefer-fluentui-compat-use-async';
import { noDirectFluentuiUtilities } from './rules/no-direct-fluentui-utilities';

const rules = {
  'prefer-fluentui-compat-bundle-icon': preferBundleIcon,
  'prefer-fluentui-compat-hooks': preferCompatHooks,
  'prefer-fluentui-compat-use-async': preferUseAsync,
  'no-direct-fluentui-utilities': noDirectFluentuiUtilities,
};

const configs = {
  recommended: {
    plugins: ['@cascadiacollections/fluentui-compat'],
    rules: {
      '@cascadiacollections/fluentui-compat/prefer-fluentui-compat-bundle-icon': 'warn',
      '@cascadiacollections/fluentui-compat/prefer-fluentui-compat-hooks': 'warn',
      '@cascadiacollections/fluentui-compat/prefer-fluentui-compat-use-async': 'warn',
      '@cascadiacollections/fluentui-compat/no-direct-fluentui-utilities': 'warn',
    },
  },
  strict: {
    plugins: ['@cascadiacollections/fluentui-compat'],
    rules: {
      '@cascadiacollections/fluentui-compat/prefer-fluentui-compat-bundle-icon': 'error',
      '@cascadiacollections/fluentui-compat/prefer-fluentui-compat-hooks': 'error',
      '@cascadiacollections/fluentui-compat/prefer-fluentui-compat-use-async': 'error',
      '@cascadiacollections/fluentui-compat/no-direct-fluentui-utilities': 'error',
    },
  },
};

export = {
  rules,
  configs,
};
