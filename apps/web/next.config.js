/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    optimizePackageImports: ["@/components", "@/lib"],
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  // Configure output tracing to include necessary files for standalone mode
  output: {
    standalone: true,
    tracing: {
      ignoreRootDirectory: true,
      includedFiles: [
        "**/package.json",
        "**/node_modules/**/*.node",
        "**/node_modules/**/*.wasm",
      ],
    },
  },
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
