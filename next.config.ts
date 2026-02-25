import type { NextConfig } from 'next';

const apiUrl = process.env.API_URL || 'http://localhost:8000';

const nextConfig: NextConfig = {
    output: 'standalone',
    poweredByHeader: false,
    reactStrictMode: true,
    env: {
        API_URL: apiUrl,
    },
    async rewrites() {
        return [
            {
                source: '/api/v1/:path*',
                destination: `${apiUrl}/api/v1/:path*`,
            },
        ];
    },
};

export default nextConfig;
