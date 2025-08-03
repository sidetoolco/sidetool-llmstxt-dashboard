/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  output: 'export',
  basePath: process.env.NODE_ENV === 'production' ? '/sidetool-llmstxt-dashboard' : '',
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig