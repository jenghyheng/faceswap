/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'img.theapi.app',
      },
      {
        protocol: 'https',
        hostname: 'piapi.io',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'devimg.tinylittleme.com',
      },
    ],
  },
  // Disable ESLint during build
  eslint: {
    // Only run ESLint in development, ignore during production builds
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig; 