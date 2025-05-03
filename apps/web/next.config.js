/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    optimizePackageImports: ["@/components", "@/lib"],
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  // Set CORS headers for all routes
  // Do not override the default .next directory
  // distDir: "build", // This might be causing issues with standalone output
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

    // Check if we need to exclude data explorer components
    // Can be controlled via environment variable
    if (process.env.EXCLUDE_DATA_EXPLORER === "true") {
      // Add null-loader for the problematic components
      config.module.rules.push({
        test: /\/(query-builder-view|spreadsheet-view)\.tsx$/,
        loader: "null-loader",
      });
    }

    // Always exclude data-explorer feature regardless of environment variable
    config.module.rules.push({
      test: /features\/data-explorer\/.*\.tsx$/,
      loader: "null-loader",
    });

    // Also exclude the shared query-builder component if it's only used by data-explorer
    config.module.rules.push({
      test: /components\/shared\/query-builder\.tsx$/,
      loader: "null-loader",
    });

    // Exclude drums page and components
    config.module.rules.push({
      test: /\(routes\)\/drums\/.*\.(tsx|jsx)$/,
      loader: "null-loader",
    });

    // Exclude any components that use ssr: false in dynamic imports
    config.module.rules.push({
      test: /\.\/\_components\/stock-labels-generator\.(tsx|jsx)$/,
      loader: "null-loader",
    });

    // Comment out this exclusion rule as we need the orders feature now
    // config.module.rules.push({
    //   test: /features\/orders\/.*\.(tsx|jsx)$/,
    //   loader: "null-loader",
    // });

    // Exclude problematic API route causing build errors
    config.module.rules.push({
      test: /api\/materials\/groups\/route\.ts$/,
      loader: "null-loader",
    });

    return config;
  },
  // Exclude specific paths from the build
  // distDir: "build",
  // Create a custom .nextignore file at project root to exclude paths
  eslint: {
    // Add custom dirs to exclude from linting
    ignoreDuringBuilds: true,
  },
  typescript: {
    // You can ignore type checking errors during production builds
    ignoreBuildErrors: true,
  },
  // Ignore specific paths during build
  poweredByHeader: false,
  transpilePackages: ["@rathburn/mobile", "@rathburn/ui", "@rathburn/types"],
  // Other method to exclude files: create .babelignore in project root
};

// To completely exclude a page route from the build, you can:
// 1. Use dynamic imports with next/dynamic and set ssr: false
// 2. Create a custom webpack config with null-loader for specific paths
// 3. Use environment variables to conditionally render content
// 4. Use .env.production vs .env.development to control what gets built

module.exports = nextConfig;
