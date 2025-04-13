/* ecosystem.config.js
This file is used to start the production server for a previous version of the NextJS app.
This version functions without error, and runs with HTTPS, hosted on EC2 instance, with a custom domain `https://rathburn.app`.
pm2 is used to start the server.

This config is here for reference, and to provide a starting point for the new config.

Importantly, the configuration below is used for a simpler repository structure, which did not use a monorepo structure.
The new configuration will need to be written to work with this turborepo project, 
    while still running the single app, `rathburn-web`, within the `apps/web` application directory.

On the Linux server, the new monrepo app in this codebase will be located at `/home/ec2-user/rathburn-monorepo/`.
*/
module.exports = {
  apps: [
    {
      name: "rathburn-online",
      script: "./.next/standalone/server.js",
      cwd:
        process.env.NODE_ENV === "production"
          ? "/home/ec2-user/rathburn-online"
          : "/Users/conrad/Documents/apps/rb-dashboard",
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
      },
      env_file: ".next/standalone/.env",
    },
  ],
};
