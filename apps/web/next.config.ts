import type { NextConfig } from 'next';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1', '*.frp.*'],
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  async rewrites() {
    const target = process.env.CONTROL_API_INTERNAL_BASE_URL ?? 'http://127.0.0.1:3001';

    return [
      {
        source: '/api/v1/:path*',
        destination: `${target}/api/v1/:path*`,
      },
    ];
  },
  turbopack: {
    root: join(appDir, '../..'),
  },
};

export default nextConfig;
