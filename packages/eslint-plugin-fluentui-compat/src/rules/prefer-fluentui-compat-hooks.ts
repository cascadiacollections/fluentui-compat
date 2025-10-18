import { ESLintUtils } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  name => `https://github.com/cascadiacollections/fluentui-compat/tree/main/packages/eslint-plugin-fluentui-compat#${name}`
);

// Hooks available in fluentui-compat that should be preferred
const COMPAT_HOOKS = [
  'useBoolean',
  'useConst',
  'useEventCallback',
  'useForceUpdate',
  'useId',
  'useIsomorphicLayoutEffect',
  'useMergedRefs',
  'useOnEvent',
  'usePrevious',
  'useSetTimeout',
] as const;

export const preferCompatHooks = createRule({
  name: 'prefer-fluentui-compat-hooks',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prefer hooks from @cascadiacollections/fluentui-compat over @fluentui/react-hooks for better performance',
    },
    messages: {
      preferCompatHook: 'Use {{hookName}} from @cascadiacollections/fluentui-compat instead of @fluentui/react-hooks for better performance and React 19 compatibility.',
    },
    fixable: 'code',
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      ImportDeclaration(node) {
        if (node.source.value === '@fluentui/react-hooks') {
          const compatHookImports = node.specifiers.filter(
            spec =>
              spec.type === 'ImportSpecifier' &&
              spec.imported.type === 'Identifier' &&
              COMPAT_HOOKS.includes(spec.imported.name as any)
          );

          if (compatHookImports.length > 0) {
            // Aggregate all compat hook names for the message
            const compatHookNames = compatHookImports
              .map(hookImport => {
                if (hookImport.type === 'ImportSpecifier' && hookImport.imported.type === 'Identifier') {
                  return hookImport.imported.name;
                }
                return '';
              })
              .filter(name => name !== '')
              .join(', ');

            context.report({
              node,
              messageId: 'preferCompatHook',
              data: {
                hookName: compatHookNames,
              },
              fix(fixer) {
                const sourceCode = context.getSourceCode();

                // Get all compat hooks from this import
                const allCompatHooks = node.specifiers.filter(
                  spec =>
                    spec.type === 'ImportSpecifier' &&
                    spec.imported.type === 'Identifier' &&
                    COMPAT_HOOKS.includes(spec.imported.name as any)
                );

                // Get other (non-compat) imports
                const otherImports = node.specifiers.filter(
                  spec => !allCompatHooks.includes(spec)
                );

                const compatHooksText = allCompatHooks
                  .map(spec => sourceCode.getText(spec))
                  .join(', ');

                if (otherImports.length === 0) {
                  // Replace entire import with fluentui-compat import
                  return fixer.replaceText(
                    node,
                    `import { ${compatHooksText} } from '@cascadiacollections/fluentui-compat';`
                  );
                } else {
                  // Keep other imports from @fluentui/react-hooks and add new import
                  const otherImportsText = otherImports
                    .map(spec => sourceCode.getText(spec))
                    .join(', ');

                  return [
                    fixer.replaceText(
                      node,
                      `import { ${otherImportsText} } from '@fluentui/react-hooks';`
                    ),
                    fixer.insertTextAfter(
                      node,
                      `\nimport { ${compatHooksText} } from '@cascadiacollections/fluentui-compat';`
                    ),
                  ];
                }
              },
            });
          }
        }
      },
    };
  },
});
