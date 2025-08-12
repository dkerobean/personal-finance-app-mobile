module.exports = {
  extends: ['eslint:recommended', '@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  env: {
    node: true,
    es6: true,
  },
  rules: {
    'no-unused-vars': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
  },
};