import { configWithoutJest } from '@fishbrain/eslint-config-base';

export default [
  ...configWithoutJest,
  {
    ignores: ['eslint.config.js', 'prettier.config.js'],
  },
  {
    // node:test's test() returns a promise that the runner tracks itself.
    files: ['**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },
];
