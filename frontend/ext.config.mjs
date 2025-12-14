/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,  // ✅ Usa SWC en vez de Terser (más rápido, menos RAM)
  experimental: {
    serverActions: true,
  },
};

module.exports = nextConfig;
