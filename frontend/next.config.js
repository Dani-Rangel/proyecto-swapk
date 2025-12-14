/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  swcMinify: true,
  experimental: {
    workerThreads: false,
    cpus: 1
  }
}

module.exports = nextConfig
