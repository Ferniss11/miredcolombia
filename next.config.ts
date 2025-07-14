import { config } from 'dotenv';
config(); // Carga las variables de entorno desde .env

import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
        config.externals.push('@opentelemetry/exporter-jaeger');
    }
    return config;
  },
  serverExternalPackages: ['firebase-admin'],
};

export default nextConfig;
