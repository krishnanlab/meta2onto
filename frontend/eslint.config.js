import eslintJs from "@eslint/js";
import eslintPluginBetterTailwindcss from "eslint-plugin-better-tailwindcss";
import eslintPluginJsxA11y from "eslint-plugin-jsx-a11y";
import eslintPluginPrettier from "eslint-plugin-prettier";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import eslintPluginReactHooks from "eslint-plugin-react-hooks";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import typescriptEslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["dist", "public"]),
  eslintJs.configs.recommended,
  typescriptEslint.configs.recommended,
  eslintPluginPrettierRecommended,
  eslintPluginReactHooks.configs.flat.recommended,
  eslintPluginJsxA11y.flatConfigs.recommended,
  {
    plugins: {
      prettier: eslintPluginPrettier,
      "better-tailwindcss": eslintPluginBetterTailwindcss,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      "prettier/prettier": "warn",
      ...eslintPluginBetterTailwindcss.configs["recommended-warn"].rules,
      "prefer-const": ["error", { destructuring: "all" }],
      "@typescript-eslint/no-unused-vars": ["warn", { caughtErrors: "none" }],
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/consistent-type-imports": "error",
      "jsx-a11y/label-has-associated-control": [
        "error",
        { controlComponents: ["Select"] },
      ],
      "better-tailwindcss/enforce-consistent-line-wrapping": [
        "warn",
        { strictness: "loose" },
      ],
    },
    settings: { "better-tailwindcss": { entryPoint: "src/styles.css" } },
  },
]);
