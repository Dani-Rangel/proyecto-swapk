// frontend/next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Ignora errores de TypeScript en el build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Opcional: también ignorar errores de ESLint
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
