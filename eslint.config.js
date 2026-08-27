/**
 * The design system lints itself with its own rule.
 *
 * If the package that defines the tokens cannot pass its own check, no
 * application is going to.
 */

import pta from "./tools/eslint-plugin-pta-design/index.js";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    files: ["src/**/*.{ts,tsx}", "demo/**/*.{ts,tsx}", "scripts/**/*.mjs"],
    plugins: { "pta-design": pta },
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      "pta-design/no-raw-color": "error",
      // The generator and the token files legitimately read Layer 1.
      "pta-design/no-layer1-import": "error",
    },
  },
];
