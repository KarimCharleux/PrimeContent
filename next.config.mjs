/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    images: {
        unoptimized: true,
    },
    distDir: 'build',
    trailingSlash: true,
    experimental: {
        workerThreads: false,
        cpus: 1
    },
};
export default nextConfig;
