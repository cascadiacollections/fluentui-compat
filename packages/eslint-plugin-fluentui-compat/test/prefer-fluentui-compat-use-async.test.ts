import { RuleTester } from 'eslint';
import { preferUseAsync } from '../src/rules/prefer-fluentui-compat-use-async';

const ruleTester = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
});

ruleTester.run('prefer-fluentui-compat-use-async', preferUseAsync as any, {
  valid: [
    {
      code: `import { useAsync } from '@cascadiacollections/fluentui-compat';`,
    },
    {
      code: `import { EventGroup } from '@fluentui/utilities';`,
    },
    {
      code: `import { Async } from 'some-other-package';`,
    },
  ],
  invalid: [
    {
      code: `import { Async } from '@fluentui/utilities';`,
      errors: [
        {
          messageId: 'preferUseAsync',
        },
      ],
      output: `import { useAsync } from '@cascadiacollections/fluentui-compat';`,
    },
    {
      code: `import { Async, EventGroup } from '@fluentui/utilities';`,
      errors: [
        {
          messageId: 'preferUseAsync',
        },
      ],
      output: `import { EventGroup } from '@fluentui/utilities';\nimport { useAsync } from '@cascadiacollections/fluentui-compat';`,
    },
    {
      code: `import { EventGroup, Async, memoize } from '@fluentui/utilities';`,
      errors: [
        {
          messageId: 'preferUseAsync',
        },
      ],
      output: `import { EventGroup, memoize } from '@fluentui/utilities';\nimport { useAsync } from '@cascadiacollections/fluentui-compat';`,
    },
  ],
});
