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
};

module.exports = nextConfig; 