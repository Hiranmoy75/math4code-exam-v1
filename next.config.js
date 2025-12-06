/** @type {import('next').NextConfig} */
const nextConfig = {
    // Performance optimizations
    compress: true, // Enable gzip compression

    // Image optimization
    images: {
        formats: ['image/webp', 'image/avif'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        minimumCacheTTL: 60,
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'api.dicebear.com',
            },
            {
                protocol: 'https',
                hostname: 'avgmafkynfbynzhlbbpk.supabase.co',
            },
        ],
    },

    // Experimental features for better performance
    experimental: {
        optimizePackageImports: ['lucide-react', 'framer-motion', 'recharts'],
    },

    // Webpack optimizations
    // Webpack optimizations
    // webpack: (config, { isServer }) => {
    //     if (!isServer) {
    //         // Reduce client bundle size
    //         config.optimization = {
    //             ...config.optimization,
    //             splitChunks: {
    //                 chunks: 'all',
    //                 cacheGroups: {
    //                     default: false,
    //                     vendors: false,
    //                     // Vendor chunk for node_modules
    //                     vendor: {
    //                         name: 'vendor',
    //                         chunks: 'all',
    //                         test: /node_modules/,
    //                         priority: 20,
    //                     },
    //                     // Common chunk for shared code
    //                     common: {
    //                         name: 'common',
    //                         minChunks: 2,
    //                         chunks: 'all',
    //                         priority: 10,
    //                         reuseExistingChunk: true,
    //                         enforce: true,
    //                     },
    //                 },
    //             },
    //         };
    //     }
    //     return config;
    // },

    // Headers for caching and security
    async headers() {
        return [
            {
                source: '/:all*(svg|jpg|png|webp|avif)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            {
                source: '/_next/static/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
        ];
    },
};

module.exports = nextConfig;
