import eslintJs from "@eslint/js";
import eslintPluginBetterTailwindcss from "eslint-plugin-better-tailwindcss";
import eslintPluginJsxA11y from "eslint-plugin-jsx-a11y";
import eslintPluginPrettier from "eslint-plugin-prettier";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import eslintPluginReactHooks from "eslint-plugin-react-hooks";
import eslintPluginReactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import typescriptEslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["dist", "public"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      eslintJs.configs.recommended,
      typescriptEslint.configs.recommended,
      eslintPluginReactHooks.configs["recommended-latest"],
      eslintPluginReactRefresh.configs.vite,
      eslintPluginPrettierRecommended,
      eslintPluginJsxA11y.flatConfigs.recommended,
    ],
    plugins: {
      prettier: eslintPluginPrettier,
      "better-tailwindcss": eslintPluginBetterTailwindcss,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      ...eslintPluginReactHooks.configs.recommended.rules,
      ...eslintPluginBetterTailwindcss.configs["recommended-warn"].rules,
      "prettier/prettier": "warn",
      "prefer-const": ["error", { destructuring: "all" }],
      "@typescript-eslint/no-unused-vars": ["warn", { caughtErrors: "none" }],
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/consistent-type-imports": "error",
      "react-refresh/only-export-components": ["off"],
      "jsx-a11y/label-has-associated-control": [
        "error",
        { controlComponents: ["Select"] },
      ],
      "better-tailwindcss/enforce-consistent-variable-syntax": "warn",
      "better-tailwindcss/enforce-shorthand-classes": "warn",
      "better-tailwindcss/no-deprecated-classes": "warn",
    },
    settings: { "better-tailwindcss": { entryPoint: "src/styles.css" } },
  },
]);
