// remove this after https://github.com/import-js/eslint-plugin-import/issues/2467 is fixed

module.exports = {
  name: 'no-relative-parent-imports',
  meta: {
    type: 'problem',
    docs: {
      description: 'Forbidden relative parent import',
      category: 'Stylistic Issues',
    },
    schema: [],
  },

  create: (context) => {
    return {
      'Program > ImportDeclaration': (node) => {
        if (node.source.value.startsWith('..')) {
          context.report({
            node,
            message: 'Relative Parent imports are not allowed, only absolute/relative imports are allowed.',
          });
        }
      },
    };
  },
};
