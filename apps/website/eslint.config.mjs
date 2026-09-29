import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  { ignores: ['.next/**', 'next-env.d.ts'] },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.mjs'],
    languageOptions: { parser: tseslint.parser },
    // Registered (no rules enabled) so existing eslint-disable comments resolve.
    plugins: { '@typescript-eslint': tseslint.plugin, 'react-hooks': reactHooks },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@vanilla-extract/css',
              message:
                'Do not import @vanilla-extract/css in the website app. All vanilla-extract usage must live inside @imbustai/ds. Use CSS modules (.module.css) for app-specific styles.',
            },
            {
              name: '@vanilla-extract/recipes',
              message:
                'Do not import @vanilla-extract/recipes in the website app. All recipe-based components must live inside @imbustai/ds.',
            },
            {
              name: '@vanilla-extract/sprinkles',
              message:
                'Do not import @vanilla-extract/sprinkles in the website app. All sprinkles usage must live inside @imbustai/ds.',
            },
          ],
        },
      ],
    },
  },
];
