import path from 'path';
import { fileURLToPath } from 'url';

import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import eslintPluginImport from 'eslint-plugin-import';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

// Utilisé pour compatibilité avec les anciennes configurations
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended
});

const config = [
  // Règles de base pour tous les fichiers JavaScript/TypeScript
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        process: "readonly",
      },
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      import: eslintPluginImport,
    },
    rules: {
      // Configuration générale
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "warn",
      "no-unused-vars": "off", // Désactivé en faveur de la règle TypeScript
      "no-use-before-define": "off", // Désactivé en faveur de la règle TypeScript
      
      // Règles d'importation
      "import/first": "error",
      "import/no-duplicates": "error",
      "import/order": [
        "error", 
        {
          "groups": ["builtin", "external", "internal", "parent", "sibling", "index"],
          "newlines-between": "always",
          "alphabetize": { "order": "asc", "caseInsensitive": true }
        }
      ],
    },
  },

  // Utiliser Next.js config avec compatibilité
  ...compat.config({ extends: ["next/core-web-vitals"] }),

  // Configuration spécifique à React
  {
    files: ["**/*.{jsx,tsx}"],
    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      // Règles React
      "react/prop-types": "off", // Désactivé car nous utilisons TypeScript
      "react/react-in-jsx-scope": "off", // Pas nécessaire dans Next.js
      "react/jsx-no-target-blank": "warn",
      "react/no-unescaped-entities": "off",
      
      // Règles React Hooks
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },

  // Ignorer les fichiers spécifiques
  {
    ignores: [
      "node_modules/",
      ".next/",
      "out/",
      "build/",
      "public/",
      "next.config.js",
      "postcss.config.js",
      "tailwind.config.js",
      "**/*.config.js",
    ],
  },
];

export default config;