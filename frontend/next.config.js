/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    workerThreads: false,
    cpus: 1
  }
}

module.exports = nextConfig
