/**
 * @mars-memory/config — Shared Prettier configuration
 *
 * Usage in an app or package:
 * In package.json: "prettier": "@mars-memory/config/prettier.config.mjs"
 * Or create a local prettier.config.mjs that imports and extends this.
 */
const config = {
  semi: true,
  singleQuote: true,
  trailingComma: "all",
  tabWidth: 2,
  printWidth: 100,
};

export default config;
