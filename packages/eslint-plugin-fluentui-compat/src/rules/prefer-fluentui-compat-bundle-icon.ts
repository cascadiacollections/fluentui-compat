import { ESLintUtils } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  name => `https://github.com/cascadiacollections/fluentui-compat/tree/main/packages/eslint-plugin-fluentui-compat#${name}`
);

export const preferBundleIcon = createRule({
  name: 'prefer-fluentui-compat-bundle-icon',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prefer bundleIcon from @cascadiacollections/fluentui-compat over @fluentui/react-icons',
    },
    messages: {
      preferBundleIcon: 'Use bundleIcon from @cascadiacollections/fluentui-compat instead of bundleIcon from @fluentui/react-icons for better performance.',
    },
    fixable: 'code',
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      ImportDeclaration(node) {
        if (node.source.value === '@fluentui/react-icons') {
          const bundleIconImport = node.specifiers.find(
            spec =>
              spec.type === 'ImportSpecifier' &&
              spec.imported.type === 'Identifier' &&
              spec.imported.name === 'bundleIcon'
          );

          if (bundleIconImport) {
            context.report({
              node: bundleIconImport,
              messageId: 'preferBundleIcon',
              fix(fixer) {
                const sourceCode = context.getSourceCode();
                
                // Check if there are other imports from @fluentui/react-icons
                const otherImports = node.specifiers.filter(spec => spec !== bundleIconImport);
                
                if (otherImports.length === 0) {
                  // Replace the entire import statement
                  return fixer.replaceText(
                    node,
                    `import { bundleIcon } from '@cascadiacollections/fluentui-compat';`
                  );
                } else {
                  // Remove bundleIcon from this import and add a new import
                  const otherImportsText = otherImports
                    .map(spec => sourceCode.getText(spec))
                    .join(', ');
                  
                  return [
                    fixer.replaceText(
                      node,
                      `import { ${otherImportsText} } from '@fluentui/react-icons';`
                    ),
                    fixer.insertTextAfter(
                      node,
                      `\nimport { bundleIcon } from '@cascadiacollections/fluentui-compat';`
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
