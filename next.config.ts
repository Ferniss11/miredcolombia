
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
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve server-only modules on the client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }

    // Enable WebAssembly experiments for both client and server builds
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    // Add a rule to handle .wasm files
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });

    // Ensure config.externals is an array before pushing
    if (!Array.isArray(config.externals)) {
      config.externals = [];
    }

    // Externalize Node.js built-in modules and problematic packages for server builds
    if (isServer) {
      config.externals.push(
        'http2',
        'farmhash-modern',
        'node:events',
        'node:process',
        'node:stream',
        // Add other node: modules if they appear in errors
      );
    }

    config.externals.push('@opentelemetry/exporter-jaeger');
    return config;
  },
  serverExternalPackages: ['firebase-admin', 'teeny-request', 'google-auth-library'],
};

export default nextConfig;
