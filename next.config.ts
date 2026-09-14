import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude native Node.js modules from the Next.js bundle
  serverExternalPackages: ['mssql', 'canvas', 'sharp'],
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'drive.google.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
