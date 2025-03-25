/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
  // Disable ESLint during build
  eslint: {
    // Only run ESLint in development, ignore during production builds
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig 