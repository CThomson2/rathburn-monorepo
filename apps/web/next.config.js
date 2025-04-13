/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    optimizePackageImports: ["@/components", "@/lib"],
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  outputFileTracing: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Properly configure crypto polyfill
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false, // Let webpack handle the polyfill
      };
    }
    return config;
  },
};

module.exports = nextConfig;
