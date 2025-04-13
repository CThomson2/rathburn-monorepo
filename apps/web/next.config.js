/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    optimizePackageImports: ["@/components", "@/lib"],
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  webpack: (config) => {
    config.resolve.fallback = {
      crypto: require.resolve("crypto-browserify"),
    };
    return config;
  },
};
module.exports = nextConfig;
// const nextConfig = {
//   webpack: async (config, { isServer }) => {
//     if (!isServer) {
//       // Import crypto-browserify using dynamic import
//       const cryptoPath = await import("crypto-browserify")
//         .then((module) => (module.default ? module.default : module))
//         .catch(() => {
//           console.warn(
//             "Failed to load crypto-browserify, falling back to path"
//           );
//           return require.resolve("crypto-browserify");
//         });

//       config.resolve.fallback = {
//         ...config.resolve.fallback,
//         crypto: cryptoPath,
//       };
//     }
//     return config;
//   },
// };

// export default nextConfig;
