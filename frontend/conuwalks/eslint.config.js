// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const globals = require("globals");
const jestPlugin = require("eslint-plugin-jest");

module.exports = defineConfig([
  ...expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    // Apply Jest rules and globals ONLY to test files and setup file
    files: [
      "**/*.test.js",
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/__tests__/**",
      "jest.setup.js",
    ],
    ...jestPlugin.configs["flat/recommended"],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
]);
