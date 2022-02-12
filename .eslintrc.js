module.exports = {
    root: true,
    parser: "@typescript-eslint/parser",
    env: {
      es6: true,
      node: true,
    },
    plugins: [
      "@typescript-eslint/eslint-plugin"
    ],
    extends: [
      "standard-with-typescript"
    ],
    rules:{
      "no-empty": [2, { "allowEmptyCatch": true }],
    },
    parserOptions: {
      tsconfigRootDir: __dirname,
      project: ['./tsconfig.json'],
    },
    ignorePatterns: ['.eslintrc.js', "**/demo_usage/**/*.js", "bin/**/*.js"]
  }