/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,

  // Simplified webpack config to ensure proper path resolution
  webpack: (config) => {
    config.cache = {
      type: "memory",
      maxGenerations: 1,
    };
    return config;
  },
};

export default nextConfig;
