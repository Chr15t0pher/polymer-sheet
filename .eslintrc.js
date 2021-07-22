module.exports = {
  env: {
      browser: true,
      es2021: true
  },
  extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
      'ecmaVersion': 12,
      'sourceType': 'module'
  },
  plugins: [
      '@typescript-eslint'
  ],
  rules: {
      '@typescript-eslint/indent': [
          'error',
          2
      ],
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      quotes: [
          'error',
          'single'
      ],
      semi: [
          'error',
          'never'
      ]
  }
}
