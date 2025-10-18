import { RuleTester } from 'eslint';
import { noDirectFluentuiUtilities } from '../src/rules/no-direct-fluentui-utilities';

const ruleTester = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
});

ruleTester.run('no-direct-fluentui-utilities', noDirectFluentuiUtilities as any, {
  valid: [
    {
      code: `import { useBoolean } from '@cascadiacollections/fluentui-compat';`,
    },
    {
      code: `import { bundleIcon } from '@cascadiacollections/fluentui-compat';`,
    },
    {
      code: `import { memoizeFunction } from '@cascadiacollections/fluentui-compat';`,
    },
    {
      code: `import { useSomeOtherUtility } from '@fluentui/utilities';`,
    },
    {
      code: `import { HeartFilled } from '@fluentui/react-icons';`,
    },
  ],
  invalid: [
    {
      code: `import { Async } from '@fluentui/utilities';`,
      errors: [
        {
          messageId: 'useCompatAlternative',
          data: { name: 'Async', source: '@fluentui/utilities' },
        },
      ],
      output: `import { useAsync } from '@cascadiacollections/fluentui-compat';`,
    },
    {
      code: `import { EventGroup } from '@fluentui/utilities';`,
      errors: [
        {
          messageId: 'useCompatAlternative',
          data: { name: 'EventGroup', source: '@fluentui/utilities' },
        },
      ],
      output: `import { EventGroup } from '@cascadiacollections/fluentui-compat';`,
    },
    {
      code: `import { memoizeFunction, createMemoizer } from '@fluentui/utilities';`,
      errors: [
        {
          messageId: 'useCompatAlternative',
          data: { name: 'memoizeFunction', source: '@fluentui/utilities' },
        },
        {
          messageId: 'useCompatAlternative',
          data: { name: 'createMemoizer', source: '@fluentui/utilities' },
        },
      ],
      output: `import { memoizeFunction, createMemoizer } from '@cascadiacollections/fluentui-compat';`,
    },
    {
      code: `import { Async, somethingElse } from '@fluentui/utilities';`,
      errors: [
        {
          messageId: 'useCompatAlternative',
          data: { name: 'Async', source: '@fluentui/utilities' },
        },
      ],
      output: `import { somethingElse } from '@fluentui/utilities';\nimport { useAsync } from '@cascadiacollections/fluentui-compat';`,
    },
    {
      code: `import { useBoolean } from '@fluentui/react-hooks';`,
      errors: [
        {
          messageId: 'useCompatAlternative',
          data: { name: 'useBoolean', source: '@fluentui/react-hooks' },
        },
      ],
      output: `import { useBoolean } from '@cascadiacollections/fluentui-compat';`,
    },
    {
      code: `import { bundleIcon } from '@fluentui/react-icons';`,
      errors: [
        {
          messageId: 'useCompatAlternative',
          data: { name: 'bundleIcon', source: '@fluentui/react-icons' },
        },
      ],
      output: `import { bundleIcon } from '@cascadiacollections/fluentui-compat';`,
    },
  ],
});
