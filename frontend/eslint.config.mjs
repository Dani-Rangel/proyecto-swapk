// frontend/eslint.config.mjs
// frontend/eslint.config.mjs
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals.js'; // ✅ .js obligatorio
import nextTypeScript from 'eslint-config-next/typescript.js';          // ✅ .js obligatorio

export default [
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    rules: {
      '@next/next/no-html-link-for-pages': 'off',
      'react/no-unescaped-entities': 'off',
    },
  },
];
