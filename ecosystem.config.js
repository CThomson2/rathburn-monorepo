module.exports = {
  apps: [
    {
      name: "rathburn-web",
      script: "./apps/web/.next/standalone/apps/web/server.js",
      cwd: "/home/ec2-user/rathburn-monorepo",
      instances: "1",
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOST: "0.0.0.0",
        __NEXT_PRIVATE_STANDALONE_CONFIG: "true",
        NEXT_TELEMETRY_DISABLED: 1,
      },
      env_file: "./apps/web/.next/standalone/apps/web/.env",
    },
    {
      name: "rathburn-mobile",
      script: "npx",
      args: "serve -s ./apps/mobile/dist -l 8080",
      cwd: "/home/ec2-user/rathburn-monorepo",
      instances: "1",
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
