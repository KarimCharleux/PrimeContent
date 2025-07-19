/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        unoptimized: true,
    },
    experimental: {
        serverActions: {
            allowedOrigins: ['localhost:3000', 'dalifilms.fr', 'www.dalifilms.fr'],
            bodySizeLimit: '5gb', // ✅ Support uploads 5GB
        },
    },
    trailingSlash: true,
    assetPrefix: process.env.NODE_ENV === 'production' ? '/' : '',
    webpack: (config, { dev, isServer }) => {
        // Ajout de la résolution des alias
        config.resolve.alias = {
            ...config.resolve.alias,
            '@': '.',
        };
        return config;
    },
    reactStrictMode: false,
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block',
                    },
                ],
            },
        ];
    },
};
export default nextConfig;
