import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.piapi.ai',
      },
      {
        protocol: 'https',
        hostname: 'assets.piapi.ai',
      },
      {
        protocol: 'https',
        hostname: 'devimg.tinylittleme.com',
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'img.theapi.app',
      },
    ],
  },
};

export default nextConfig;
