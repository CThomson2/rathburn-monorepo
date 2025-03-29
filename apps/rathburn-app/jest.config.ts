/** @type {import('jest').Config} */
const config: import("jest").Config = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
        isolatedModules: true,
      },
    ],
  },
  moduleNameMapper: {
    // Handle module aliases (if you're using them in tsconfig.json)
    "^@/(.*)$": "<rootDir>/$1",
  },
  // Ignore node_modules
  transformIgnorePatterns: ["/node_modules/"],
  // Optional: Set up coverage reporting
  collectCoverageFrom: [
    "**/*.{js,jsx,ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/.next/**",
    "!**/coverage/**",
  ],
};

export default config;
// export default {
//   ...config,
//   projects: [
//     {
//       displayName: "jsdom",
//       testEnvironment: "jsdom",
//       testMatch: ["**/__tests__/notifications.test.ts"],
//     },
//     {
//       displayName: "node",
//       testEnvironment: "node",
//       testMatch: [
//         "**/__tests__/**/*.test.ts",
//         "!**/__tests__/notifications.test.ts",
//       ],
//     },
//   ],
// };
