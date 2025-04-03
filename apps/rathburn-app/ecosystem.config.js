const path = require('path');

// Determine current working directory
const cwd = process.cwd();
const isRathburnAppDir = cwd.endsWith('rathburn-app');
const monorepoRoot = isRathburnAppDir 
  ? path.resolve(cwd, '../..')
  : path.resolve(cwd);
const appDir = isRathburnAppDir 
  ? cwd 
  : path.join(monorepoRoot, 'apps', 'rathburn-app');

// Production paths - use absolute paths on server
const PROD_MONOREPO_ROOT = process.env.PROD_MONOREPO_ROOT || '/home/ec2-user/rathburn-monorepo';
const PROD_APP_DIR = path.join(PROD_MONOREPO_ROOT, 'apps', 'rathburn-app');

module.exports = {
  apps: [
    // Production configuration
    {
      name: "rathburn-app",
      script: "./.next/standalone/server.js",
      cwd: process.env.NODE_ENV === 'production' ? PROD_APP_DIR : appDir,
      args: "-p 3000",
      watch: false,
      instances: "1",
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        NEXT_PUBLIC_API_URL: "https://rathburn.app/api/",
        HOST: "0.0.0.0", // Listen on all interfaces
        __NEXT_PRIVATE_STANDALONE_CONFIG: "true",
        NEXT_TELEMETRY_DISABLED: 1,
        MONOREPO_ROOT: process.env.NODE_ENV === 'production' ? PROD_MONOREPO_ROOT : monorepoRoot,
        NODE_OPTIONS: "--no-warnings" // Suppress warnings
      },
      env_file: ".next/standalone/.env",
      node_args: "--no-warnings", // Add node args to suppress warnings
      interpreter: process.env.NODE_ENV === 'production' ? "/usr/bin/node" : undefined,
    },
    
    // Development configuration
    {
      name: "rathburn-dev",
      script: "./.next/standalone/server.js",
      cwd: appDir, // Always use the computed app directory
      args: "-p 3000",
      watch: false,
      instances: "1",
      exec_mode: "fork",
      env: {
        NODE_ENV: "development",
        PORT: 3000,
        NEXT_PUBLIC_API_URL: "http://localhost:3000/api/",
        HOST: "0.0.0.0",
        __NEXT_PRIVATE_STANDALONE_CONFIG: "true",
        NEXT_TELEMETRY_DISABLED: 1,
        MONOREPO_ROOT: monorepoRoot,
        NODE_OPTIONS: "--no-warnings" // Suppress warnings
      },
      env_file: ".next/standalone/.env",
      node_args: "--no-warnings", // Add node args to suppress warnings
      interpreter_args: "--no-warnings", // More options to suppress warnings
    }
  ],
};

// Production PM2 command:
// pm2 start ecosystem.config.js --only rathburn-app --env production

// Development PM2 command:
// pm2 start ecosystem.config.js --only rathburn-dev --env development

// Local development using Node directly:
// npm run build && npm run postbuild && npm run start
