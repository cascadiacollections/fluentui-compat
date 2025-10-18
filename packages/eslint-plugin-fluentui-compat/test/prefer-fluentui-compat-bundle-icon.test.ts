import { RuleTester } from 'eslint';
import { preferBundleIcon } from '../src/rules/prefer-fluentui-compat-bundle-icon';

const ruleTester = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
});

ruleTester.run('prefer-fluentui-compat-bundle-icon', preferBundleIcon as any, {
  valid: [
    {
      code: `import { bundleIcon } from '@cascadiacollections/fluentui-compat';`,
    },
    {
      code: `import { HeartFilled, HeartRegular } from '@fluentui/react-icons';`,
    },
    {
      code: `import { bundleIcon } from 'some-other-package';`,
    },
  ],
  invalid: [
    {
      code: `import { bundleIcon } from '@fluentui/react-icons';`,
      errors: [
        {
          messageId: 'preferBundleIcon',
        },
      ],
      output: `import { bundleIcon } from '@cascadiacollections/fluentui-compat';`,
    },
    {
      code: `import { bundleIcon, HeartFilled, HeartRegular } from '@fluentui/react-icons';`,
      errors: [
        {
          messageId: 'preferBundleIcon',
        },
      ],
      output: `import { HeartFilled, HeartRegular } from '@fluentui/react-icons';\nimport { bundleIcon } from '@cascadiacollections/fluentui-compat';`,
    },
    {
      code: `import { HeartFilled, bundleIcon } from '@fluentui/react-icons';`,
      errors: [
        {
          messageId: 'preferBundleIcon',
        },
      ],
      output: `import { HeartFilled } from '@fluentui/react-icons';\nimport { bundleIcon } from '@cascadiacollections/fluentui-compat';`,
    },
  ],
});
