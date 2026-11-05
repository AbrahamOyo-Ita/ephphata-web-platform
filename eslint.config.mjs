import { FlatCompat } from "@eslint/eslintrc";
import { defineConfig, globalIgnores } from "eslint/config";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

export default defineConfig([
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  globalIgnores([".next/**", "node_modules/**", "qa/**", "public/brand/**", "next-env.d.ts"]),
  {
    rules: {
      // Existing components intentionally synchronize browser state from effects.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      "react-hooks/immutability": "off",
      "react-hooks/rules-of-hooks": "warn",
      "@typescript-eslint/no-require-imports": "off",
      "@next/next/no-html-link-for-pages": "off",
    },
  },
]);
