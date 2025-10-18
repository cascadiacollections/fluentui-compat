import { RuleTester } from 'eslint';
import { preferCompatHooks } from '../src/rules/prefer-fluentui-compat-hooks';

const ruleTester = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
});

ruleTester.run('prefer-fluentui-compat-hooks', preferCompatHooks as any, {
  valid: [
    {
      code: `import { useBoolean } from '@cascadiacollections/fluentui-compat';`,
    },
    {
      code: `import { useConst, useId } from '@cascadiacollections/fluentui-compat';`,
    },
    {
      code: `import { useSomeOtherHook } from '@fluentui/react-hooks';`,
    },
    {
      code: `import { useBoolean } from 'some-other-package';`,
    },
  ],
  invalid: [
    {
      code: `import { useBoolean } from '@fluentui/react-hooks';`,
      errors: [
        {
          messageId: 'preferCompatHook',
          data: { hookName: 'useBoolean' },
        },
      ],
      output: `import { useBoolean } from '@cascadiacollections/fluentui-compat';`,
    },
    {
      code: `import { useBoolean, useConst } from '@fluentui/react-hooks';`,
      errors: [
        {
          messageId: 'preferCompatHook',
          data: { hookName: 'useBoolean' },
        },
        {
          messageId: 'preferCompatHook',
          data: { hookName: 'useConst' },
        },
      ],
      output: `import { useBoolean, useConst } from '@cascadiacollections/fluentui-compat';`,
    },
    {
      code: `import { useBoolean, useSomeOtherHook } from '@fluentui/react-hooks';`,
      errors: [
        {
          messageId: 'preferCompatHook',
          data: { hookName: 'useBoolean' },
        },
      ],
      output: `import { useSomeOtherHook } from '@fluentui/react-hooks';\nimport { useBoolean } from '@cascadiacollections/fluentui-compat';`,
    },
    {
      code: `import { useId, useForceUpdate, usePrevious } from '@fluentui/react-hooks';`,
      errors: [
        {
          messageId: 'preferCompatHook',
          data: { hookName: 'useId' },
        },
        {
          messageId: 'preferCompatHook',
          data: { hookName: 'useForceUpdate' },
        },
        {
          messageId: 'preferCompatHook',
          data: { hookName: 'usePrevious' },
        },
      ],
      output: `import { useId, useForceUpdate, usePrevious } from '@cascadiacollections/fluentui-compat';`,
    },
  ],
});
