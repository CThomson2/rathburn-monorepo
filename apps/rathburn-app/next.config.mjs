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
      bodySizeLimit: "2mb",
    },
    // Required for proper output tracing of dependencies
    outputFileTracingExcludes: {
      "*": [
        "node_modules/@swc/core-darwin-arm64",
        "node_modules/@swc/core-darwin-x64",
        "node_modules/@swc/core-linux-arm64-gnu",
        "node_modules/@swc/core-linux-arm64-musl",
        "node_modules/@swc/core-linux-x64-gnu",
        "node_modules/@swc/core-linux-x64-musl",
        "node_modules/@swc/core-win32-arm64-msvc",
        "node_modules/@swc/core-win32-ia32-msvc",
        "node_modules/@swc/core-win32-x64-msvc",
      ],
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
      config.externals = ["@swc/helpers", ...config.externals];

      // Add global polyfill for crypto at build time
      if (typeof global.crypto === "undefined") {
        try {
          // Use dynamic import with .then() instead of await
          import("crypto").then((nodeCrypto) => {
            global.crypto = {
              getRandomValues: function (buffer) {
                return nodeCrypto.randomFillSync(buffer);
              },
              subtle: nodeCrypto.webcrypto
                ? nodeCrypto.webcrypto.subtle
                : undefined,
            };
          });
        } catch (error) {
          console.warn("Failed to polyfill crypto:", error.message);
        }
      }
    }

    // In ESM, we need to conditionally set up fallbacks without using require
    if (!isServer) {
      config.resolve = {
        ...config.resolve,
        fallback: {
          ...config.resolve?.fallback,
          // Use empty modules for Node.js built-ins in browser
          crypto: false,
          stream: false,
          path: false,
          os: false,
        },
      };
    }

    // Add react, react-dom, and react-is to dependencies instead of externals
    if (config.externals) {
      // Add these packages to dependencies section in package.json instead
      // rather than trying to modify webpack externals
    }

    return config;
  },
};

// const withBundleAnalyzer = bundleAnalyzer({
//   enabled: process.env.ANALYZE === 'true',
// })

// export default withBundleAnalyzer(nextConfig);

export default nextConfig;
