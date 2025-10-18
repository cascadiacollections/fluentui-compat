import { ESLintUtils } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  name => `https://github.com/cascadiacollections/fluentui-compat/tree/main/packages/eslint-plugin-fluentui-compat#${name}`
);

// Utilities that have compat alternatives
const COMPAT_UTILITIES: Record<string, readonly string[]> = {
  '@fluentui/utilities': [
    'Async',
    'EventGroup',
    'memoizeFunction',
    'createMemoizer',
    'resetMemoizations',
  ],
  '@fluentui/react-hooks': [
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
  ],
  '@fluentui/react-icons': ['bundleIcon'],
};

export const noDirectFluentuiUtilities = createRule({
  name: 'no-direct-fluentui-utilities',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Discourage direct usage of FluentUI utilities that have optimized alternatives in @cascadiacollections/fluentui-compat',
    },
    messages: {
      useCompatAlternative: 'Import {{name}} from @cascadiacollections/fluentui-compat instead of {{source}} for better performance and React 19 compatibility.',
    },
    fixable: 'code',
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      ImportDeclaration(node) {
        const source = node.source.value as string;
        
        if (source in COMPAT_UTILITIES) {
          const compatUtilities = COMPAT_UTILITIES[source];
          
          const compatImports = node.specifiers.filter(
            spec =>
              spec.type === 'ImportSpecifier' &&
              spec.imported.type === 'Identifier' &&
              compatUtilities.includes(spec.imported.name)
          );

          if (compatImports.length > 0) {
            compatImports.forEach(importSpec => {
              if (importSpec.type === 'ImportSpecifier' && importSpec.imported.type === 'Identifier') {
                context.report({
                  node: importSpec,
                  messageId: 'useCompatAlternative',
                  data: {
                    name: importSpec.imported.name,
                    source,
                  },
                  fix(fixer) {
                    const sourceCode = context.getSourceCode();
                    
                    // Get all compat utilities from this import
                    const allCompatImports = node.specifiers.filter(
                      spec =>
                        spec.type === 'ImportSpecifier' &&
                        spec.imported.type === 'Identifier' &&
                        compatUtilities.includes(spec.imported.name)
                    );
                    
                    // Get other imports
                    const otherImports = node.specifiers.filter(
                      spec => !allCompatImports.includes(spec)
                    );
                    
                    const compatImportsText = allCompatImports
                      .map(spec => {
                        if (spec.type === 'ImportSpecifier') {
                          // Handle special case: Async -> useAsync, preserving local alias
                          if (spec.imported.type === 'Identifier' && spec.imported.name === 'Async') {
                            return spec.local.name !== 'Async'
                              ? `useAsync as ${spec.local.name}`
                              : 'useAsync';
                          }
                          return sourceCode.getText(spec);
                        }
                        return sourceCode.getText(spec);
                      })
                      .join(', ');
                    
                    if (otherImports.length === 0) {
                      // Replace entire import
                      return fixer.replaceText(
                        node,
                        `import { ${compatImportsText} } from '@cascadiacollections/fluentui-compat';`
                      );
                    } else {
                      // Keep other imports and add new import
                      const otherImportsText = otherImports
                        .map(spec => sourceCode.getText(spec))
                        .join(', ');
                      
                      return [
                        fixer.replaceText(
                          node,
                          `import { ${otherImportsText} } from '${source}';`
                        ),
                        fixer.insertTextAfter(
                          node,
                          `\nimport { ${compatImportsText} } from '@cascadiacollections/fluentui-compat';`
                        ),
                      ];
                    }
                  },
                });
              }
            });
          }
        }
      },
    };
  },
});
