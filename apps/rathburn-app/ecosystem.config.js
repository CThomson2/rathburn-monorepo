module.exports = {
  apps: [
    // Production configuration
    {
      name: "rathburn-app",
      script: "./.next/standalone/server.js",
      cwd: process.env.NODE_ENV === 'production' 
        ? "/home/ec2-user/rathburn-monorepo/apps/rathburn-app"
        : process.cwd(),
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
        MONOREPO_ROOT: "/home/ec2-user/rathburn-monorepo"
      },
      env_file: ".next/standalone/.env",
    },
    
    // Development configuration
    {
      name: "rathburn-dev",
      script: "./.next/standalone/server.js",
      cwd: process.cwd(),
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
        MONOREPO_ROOT: process.cwd().replace(/\/apps\/rathburn-app$/, '')
      },
      env_file: ".next/standalone/.env",
    }
  ],
};

// Production PM2 command:
// pm2 start ecosystem.config.js --only rathburn-app --env production

// Development PM2 command:
// pm2 start ecosystem.config.js --only rathburn-dev --env development

// Local development using Node directly:
// npm run build && npm run postbuild && npm run start
