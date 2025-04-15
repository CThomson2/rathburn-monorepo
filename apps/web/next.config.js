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
  // Exclude specific files or directories from the build
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
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
  // Exclude specific paths from the build
  distDir: "build",
  // Create a custom .nextignore file at project root to exclude paths
  eslint: {
    // Add custom dirs to exclude from linting
    ignoreDuringBuilds: true,
  },
  typescript: {
    // You can ignore type checking errors during production builds
    ignoreBuildErrors: false,
  },
  // Ignore specific paths during build
  poweredByHeader: false,
  transpilePackages: [],
  // Other method to exclude files: create .babelignore in project root
};

// To completely exclude a page route from the build, you can:
// 1. Use dynamic imports with next/dynamic and set ssr: false
// 2. Create a custom webpack config with null-loader for specific paths
// 3. Use environment variables to conditionally render content
// 4. Use .env.production vs .env.development to control what gets built

module.exports = nextConfig;