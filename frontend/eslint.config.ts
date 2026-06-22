import js from "@eslint/js";
import tailwind from "eslint-plugin-better-tailwindcss";
import a11y from "eslint-plugin-jsx-a11y";
import prettier from "eslint-plugin-prettier/recommended";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["dist", "public"]),
  js.configs.recommended,
  tslint.configs.recommended,
  prettier,
  reactHooks.configs.flat.recommended,
  a11y.flatConfigs.recommended,
  {
    plugins: {
      "better-tailwindcss": tailwind,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      /** GENERAL */
      "prefer-const": ["error", { destructuring: "all" }],

      /** TYPESCRIPT */
      "@typescript-eslint/no-unused-vars": ["warn", { caughtErrors: "none" }],
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/consistent-type-imports": "error",

      /** ACCESSIBILITY */
      /** https://github.com/dequelabs/axe-core/issues/4566 */
      "jsx-a11y/no-noninteractive-tabindex": ["off"],
      /**
       * allow <label>some text<AnyComponent/></label> but still catch
       * <label>just text</label>
       */
      "jsx-a11y/label-has-associated-control": [
        "error",
        { controlComponents: ["*"] },
      ],

      /** FORMATTING */
      "prettier/prettier": "warn",
      ...tailwind.configs["recommended-warn"].rules,
      /** https://github.com/schoero/eslint-plugin-better-tailwindcss/issues/302 */
      "better-tailwindcss/enforce-consistent-line-wrapping": [
        "warn",
        { strictness: "loose" },
      ],
    },
    settings: { "better-tailwindcss": { entryPoint: "src/styles.css" } },
  },
]);
