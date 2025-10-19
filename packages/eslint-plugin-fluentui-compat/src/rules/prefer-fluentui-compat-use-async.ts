import { ESLintUtils } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  name => `https://github.com/cascadiacollections/fluentui-compat/tree/main/packages/eslint-plugin-fluentui-compat#${name}`
);

export const preferUseAsync = createRule({
  name: 'prefer-fluentui-compat-use-async',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prefer useAsync hook from @cascadiacollections/fluentui-compat over Async class from @fluentui/utilities',
    },
    messages: {
      preferUseAsync: 'Use useAsync hook from @cascadiacollections/fluentui-compat instead of Async class from @fluentui/utilities for better React integration and automatic cleanup.',
    },
    fixable: 'code',
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      ImportDeclaration(node) {
        if (node.source.value === '@fluentui/utilities') {
          const asyncImport = node.specifiers.find(
            spec =>
              spec.type === 'ImportSpecifier' &&
              spec.imported.type === 'Identifier' &&
              spec.imported.name === 'Async'
          );

          if (asyncImport) {
            context.report({
              node: asyncImport,
              messageId: 'preferUseAsync',
              fix(fixer) {
                const sourceCode = context.getSourceCode();
                
                // Check if there are other imports from @fluentui/utilities
                const otherImports = node.specifiers.filter(spec => spec !== asyncImport);
                
                if (otherImports.length === 0) {
                  // Replace the entire import statement
                  return fixer.replaceText(
                    node,
                    `import { useAsync } from '@cascadiacollections/fluentui-compat';`
                  );
                } else {
                  // Remove Async from this import and add a new import
                  const otherImportsText = otherImports
                    .map(spec => sourceCode.getText(spec))
                    .join(', ');
                  
                  return [
                    fixer.replaceText(
                      node,
                      `import { ${otherImportsText} } from '@fluentui/utilities';`
                    ),
                    fixer.insertTextAfter(
                      node,
                      `\nimport { useAsync } from '@cascadiacollections/fluentui-compat';`
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
