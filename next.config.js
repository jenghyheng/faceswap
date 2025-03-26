/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'devimg.tinylittleme.com',
      'lh3.googleusercontent.com',
      'img.theapi.app'  // Add the API's image domain
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'devimg.tinylittleme.com',
        pathname: '/card/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/a/**',  // Pattern for Google profile images
      },
      {
        protocol: 'https',
        hostname: 'img.theapi.app',
        pathname: '/temp/**',  // Pattern for API result images
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
  // Ensure CSS modules work correctly
  webpack: (config) => {
    config.module.rules.push({
      test: /\.css$/,
      use: ['style-loader', 'css-loader', 'postcss-loader'],
    });
    return config;
  },
  // Enable source maps in production for better debugging
  productionBrowserSourceMaps: true,
}

module.exports = nextConfig 