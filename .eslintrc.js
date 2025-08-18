module.exports = {
  extends: ['eslint:recommended'],
  env: {
    node: true,
    es6: true,
    browser: true,
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      rules: {
        'no-unused-vars': 'off', // Turn off for TypeScript files
      },
    },
    {
      files: ['**/__tests__/**/*.ts', '**/__tests__/**/*.tsx', '**/*.test.ts', '**/*.test.tsx'],
      env: {
        jest: true,
      },
      globals: {
        'React': 'readonly',
        'RequestInit': 'readonly',
        'ResponseInit': 'readonly',
      },
    },
    {
      files: ['supabase/functions/**/*.ts'],
      env: {
        node: false,
        browser: false,
      },
      globals: {
        'Deno': 'readonly',
        'console': 'readonly',
        'fetch': 'readonly',
        'Request': 'readonly',
        'Response': 'readonly',
        'Headers': 'readonly',
        'URL': 'readonly',
        'URLSearchParams': 'readonly',
        'btoa': 'readonly',
        'atob': 'readonly',
        'TextEncoder': 'readonly',
        'TextDecoder': 'readonly',
      },
    },
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    'no-unused-vars': 'error',
    'no-console': 'warn',
  },
};