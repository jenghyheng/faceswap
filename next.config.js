/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'devimg.tinylittleme.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',  // Pattern for Google profile images
      },
      {
        protocol: 'https',
        hostname: 'img.theapi.app',
        pathname: '/**',  // Pattern for API result images
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
  // Enable source maps in production for better debugging
  productionBrowserSourceMaps: true,
}

module.exports = nextConfig 