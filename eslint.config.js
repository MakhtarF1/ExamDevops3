import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import tseslint from "@typescript-eslint/eslint-plugin";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node, // Ajoute les variables globales de Node.js
        structuredClone: "readonly", // Déclare structuredClone comme une fonction disponible
      },
    },
  },

  // Configuration des règles JS
  pluginJs.configs.recommended, // Recommandations de ESLint pour JS

  // Configuration des règles TypeScript
  {
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      "@typescript-eslint/explicit-module-boundary-types": "off", // Exemples de règles spécifiques pour TypeScript
      "@typescript-eslint/no-explicit-any": "off", // Désactive la règle pour l'utilisation de `any`
    },
  },

  // Configuration des règles React
  {
    plugins: {
      react: pluginReact,
    },
    rules: {
      "react/jsx-uses-react": "off", // Désactive cette règle (si tu utilises React 17 ou supérieur)
      "react/jsx-uses-vars": "off", // Désactive cette règle pour éviter l'erreur "variable 'X' is defined but never used"
    },
  },
];
