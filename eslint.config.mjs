import js from "@eslint/js";
import astro from "eslint-plugin-astro";
import ts from "typescript-eslint";
import globals from "globals";

export default ts.config(
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      ".astro/**",
      "output/**",
      "public/**",
      "src/assets/**",
      ".agents/**",
      ".codex/**",
      ".claude/**",
    ],
  },
  js.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs,ts,astro}"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  {
    files: ["**/*.ts"],
    extends: [...ts.configs.recommended],
    rules: {
      // Existing PDF/GSAP adapters and development diagnostics use dynamic APIs.
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  ...astro.configs["flat/recommended"],
  {
    files: ["**/*.astro"],
    languageOptions: { parserOptions: { parser: ts.parser } },
  },
);
