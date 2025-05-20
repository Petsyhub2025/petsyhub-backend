const rulesDirPlugin = require('eslint-plugin-rulesdir');

rulesDirPlugin.RULES_DIR = ['eslint-custom-plugins'];

module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.base.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin', 'prettier', 'filename-rules', '@nx', 'import', 'rulesdir'],
  extends: ['plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true, // always try to resolve types under `<root>@types` directory even it doesn't contain any source code, like `@types/unist`
        project: 'tsconfig.base.json',
      },
    },
  },
  root: true,
  env: {
    node: true,
    jest: true,
  },
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-inferrable-types': 'off',
    '@typescript-eslint/no-empty-interface': 'off',
    '@typescript-eslint/ban-types': 'warn',
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-duplicate-enum-values': 'warn',
    'prettier/prettier': 'warn',
    // 'import/no-relative-parent-imports': 'error', // TODO: enable this rule when https://github.com/import-js/eslint-plugin-import/issues/2467 is fixed
    'rulesdir/no-relative-parent-imports': 'error',
    'no-console': 'error',
    'filename-rules/match': [
      'error',
      /(^([a-z][a-z\d]*)(-[a-z\d]+)*\.(schema|helper|factory|type-guard|interface|pipeline|dto|service|config|listener|controller|module|aggregation|enum|relation|node|model|pipe|provider|default|constant|middleware|guard|loader|filter|decorator|interceptor|validator|class|type|util|plugin|strategy|template|process)\.ts$)|(^index\.ts$)|(^main\.ts$)|(spec\.ts$)/,
    ],
  },
};
