import path from 'path';
/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    images: {
        unoptimized: true,
    },
    distDir: '.next',
    trailingSlash: true,
};
export default nextConfig;
