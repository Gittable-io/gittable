module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended",
    "@electron-toolkit/eslint-config-ts/recommended",
  ],
  rules: {
    "@typescript-eslint/no-unused-vars": "warn", // Changed from error to warn as it was distracting. It gave me too much errors when writing my code
  },
};
