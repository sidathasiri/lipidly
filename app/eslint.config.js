// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    rules: {
      // React Native renders apostrophes in JSX text as-is; this rule only matters for HTML.
      'react/no-unescaped-entities': 'off',
    },
  },
]);
