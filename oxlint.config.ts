import { defineConfig } from 'oxlint'

const COMPLEXITY_MAX = 40
const MAX_STATEMENTS = 30
const JSX_MAX_DEPTH = 10
const ID_LENGTH_MAX = 40
const ID_LENGTH_MIN = 2
const MAX_LINES = 700
const MAX_LINES_PER_FUNCTION = 300

export default defineConfig({
  categories: {
    correctness: 'error',
    nursery: 'off',
    pedantic: 'warn',
    perf: 'warn',
    restriction: 'off',
    style: 'warn',
    suspicious: 'warn',
  },
  ignorePatterns: [
    '.git',
    '.astro',
    '.claude',
    '.agents',
    '.codex',
    '.husky',
    '.opencode',
    '.specify',
    'specs',
    '.astro',
    '.trae',
    '.agent',
  ],
  overrides: [
    {
      env: {
        'vitest/globals': true,
      },
      files: ['**/*.{test,spec}.{ts,tsx,js,jsx}', '**/__tests__/**'],
      plugins: ['vitest'],
      rules: {
        'id-length': 'off',
        'import/no-nodejs-modules': 'off',
        'init-declarations': 'off',
        'max-lines': 'off',
        'max-lines-per-function': 'off',
        'max-statements': 'off',
        'no-explicit-any': 'off',
        'no-magic-numbers': 'off',
        'prefer-destructuring': 'off',
        'typescript/consistent-type-imports': 'off',
        'typescript/no-explicit-any': 'off',
        'vitest/prefer-called-once': 'off',
        'vitest/prefer-describe-function-title': 'off',
      },
    },
    {
      files: ['*.d.ts'],
      rules: {
        'no-unassigned-import': 'off',
        'triple-slash-reference': 'off',
        unambiguous: 'off',
      },
    },
    {
      files: ['**/*.tsx'],
      plugins: ['jsx-a11y', 'react', 'react-perf'],
      rules: {
        'jsx-max-depth': ['warn', { max: JSX_MAX_DEPTH }],
        'jsx-no-jsx-as-prop': 'off',
        'jsx-no-new-array-as-prop': 'off',
        'jsx-no-new-function-as-prop': 'off',
        'jsx-no-new-object-as-prop': 'off',
        'jsx-props-no-spreading': 'off',
        'react-in-jsx-scope': 'off',
        'react/jsx-no-constructed-context-values': 'off',
        'react/no-array-index-key': 'off',
        'unicorn/filename-case': ['warn', { case: 'pascalCase' }],
      },
    },
    {
      files: ['**/*.astro'],
      rules: {
        // Astro components use side-effect CSS imports and inline IIFEs
        'func-names': 'off',
        'import/no-unassigned-import': 'off',
        'unicorn/filename-case': ['warn', { case: 'pascalCase' }],
      },
    },
    {
      files: ['**/pages/**/*.astro'],
      rules: {
        'unicorn/filename-case': ['warn', { case: 'kebabCase' }],
      },
    },
    {
      files: ['**/pages/api/**/*.ts'],
      rules: {
        'import/no-nodejs-modules': 'off',
      },
    },
    {
      files: ['**/*.config.{js,ts,mjs,cjs}', 'scripts/**/*', 'vitest.*.ts'],
      rules: {
        'import/no-default-export': 'off',
        'import/no-nodejs-modules': 'off',
        'no-explicit-any': 'off',
      },
    },
    {
      files: ['**/components/ui/*.tsx', '**/lib/utils.ts'],
      rules: {
        'func-style': 'off',
        'id-length': 'off',
        'import/no-namespace': 'off',
        'no-magic-numbers': 'off',
        'no-shadow': 'off',
        'unicorn/filename-case': ['warn', { case: 'kebabCase' }],
      },
    },
  ],
  plugins: ['typescript', 'unicorn', 'oxc', 'import'],
  rules: {
    complexity: ['warn', COMPLEXITY_MAX],
    'eslint/no-unused-vars': 'error',
    'func-style': ['warn', 'declaration', { allowArrowFunctions: true, overrides: { namedExports: 'ignore' } }],
    'group-exports': 'off',
    'id-length': [
      'warn',
      {
        exceptions: ['i', 'j', 'k', 'x', 'y', 'z', 'T', 'K', 'Q', 'V'],
        max: ID_LENGTH_MAX,
        min: ID_LENGTH_MIN,
        properties: 'never',
      },
    ],
    'import/exports-last': 'off',
    'import/first': 'error',
    'import/no-amd': 'error',
    'import/no-commonjs': 'warn',
    'import/no-cycle': 'error',
    'import/no-default-export': 'error',
    'import/no-duplicates': 'error',
    'import/no-named-default': 'warn',
    'import/no-unresolved': 'error',
    'import/no-unused-modules': 'warn',
    'max-dependencies': 'off',
    'max-depth': ['warn', 6],
    'max-lines': ['warn', MAX_LINES],
    'max-lines-per-function': ['warn', MAX_LINES_PER_FUNCTION],
    'max-params': ['warn', 5],
    'max-statements': ['warn', MAX_STATEMENTS],
    'no-array-for-each': 'off',
    'no-await-in-loop': 'off',
    'no-continue': 'off',
    'no-duplicate-imports': [
      'error',
      {
        allowSeparateTypeImports: true,
      },
    ],
    'no-inline-comments': 'off',
    'no-magic-numbers': 'off',
    // 'no-magic-numbers': [
    //   'warn',
    //   {
    //     Ignore: [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 100, 1024],
    //     IgnoreArrayIndexes: true,
    //     IgnoreDefaultValues: true,
    //     IgnoreNumericLiteralTypes: true,
    //     IgnoreReadonlyClassProperties: true,
    //     IgnoreTypeIndexes: true,
    //   },
    // ],
    'no-map-spread': 'off',
    'no-named-export': 'allow',
    'no-negated-condition': 'off',
    'no-nested-ternary': 'off',
    'no-restricted-syntax': [
      'error',
      {
        message: 'Export objects are not allowed. Use inline exports instead.',
        selector: 'ExportNamedDeclaration[declaration=null][source=null]',
      },
    ],
    'no-ternary': 'allow',
    'prefer-default-export': 'off',
    'require-await': 'off',
    'sort-imports': 'off',
    'typescript/no-explicit-any': 'warn',
    'typescript/no-unused-vars': 'warn',
    'typescript/unified-signatures': 'off',
    'unicorn/filename-case': ['warn', { case: 'kebabCase' }],
    'unicorn/no-nested-ternary': 'error',
    'unicorn/no-null': 'off',
    'unicorn/prevent-abbreviations': [
      'warn',
      {
        allowList: {
          Params: true,
          Props: true,
          Ref: true,
          params: true,
          props: true,
          ref: true,
        },
      },
    ],
  },
})
