// frontend/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ignora errores de TypeScript en el build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Opcional: también ignorar errores de ESLint
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
