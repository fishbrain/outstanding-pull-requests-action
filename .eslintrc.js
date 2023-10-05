module.exports = {
  extends: ['eslint-config-fishbrain-base'],
  parserOptions: {
    project: ['./tsconfig.json'],
  },
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
  },
};
