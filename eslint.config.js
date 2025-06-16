import { configWithoutJest } from '@fishbrain/eslint-config-base';

export default [
  ...configWithoutJest,
  {
    ignores: ['eslint.config.js', 'prettier.config.js'],
  },
  {
    rules: {
      'import/no-unresolved': ['error', { ignore: ['@octokit/rest'] }],
    },
  },
];
