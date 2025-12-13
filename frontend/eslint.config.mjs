// frontend/eslint.config.mjs
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals.js';
import nextTs from 'eslint-config-next/typescript.js';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // 👇 Desactiva reglas problemáticas con Railway (opcional, pero ayuda)
      '@next/next/no-html-link-for-pages': 'off',
      'react/no-unescaped-entities': 'off',
    },
  },
  // Ignorar archivos generados
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'dist/**',
  ]),
]);
