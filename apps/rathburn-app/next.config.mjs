/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone mode for production builds
  output: "standalone",
  reactStrictMode: true,
  
  // Properly resolve monorepo dependencies for standalone output
  experimental: {
    outputFileTracingRoot: process.env.MONOREPO_ROOT || process.cwd(),
    // This helps with dependencies resolution in monorepo setup
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // If using turbotrace, uncomment the following:
    // turbotrace: {
    //   logLevel: 'info',
    //   contextDirectory: process.env.MONOREPO_ROOT || process.cwd(),
    // },
  },

  // Simplified webpack config to ensure proper path resolution
  webpack: (config, { isServer }) => {
    config.cache = {
      type: "memory",
      maxGenerations: 1,
    };

    // Fix for crypto polyfills and other Node.js built-ins
    if (isServer) {
      config.externals = ['@swc/helpers', ...config.externals];
    }

    // In ESM, we need to conditionally set up fallbacks without using require
    if (!isServer) {
      config.resolve = {
        ...config.resolve,
        fallback: {
          ...config.resolve?.fallback,
          'node-polyfill-crypto': false,
          // Can't use require in ESM, so we just disable these
          'crypto': false,
          'stream': false,
        },
      };
    }

    return config;
  },
};

// const withBundleAnalyzer = bundleAnalyzer({
//   enabled: process.env.ANALYZE === 'true',
// })

// export default withBundleAnalyzer(nextConfig);

export default nextConfig;
