# Rathburn Monorepo Deployment Guide

## Repository Structure

```
rathburn-ops-monorepo/
├── apps/
│   ├── web/             # Main Next.js web app (rathburn.app)
│   └── mobile/          # Vite-based mobile app (mobile.rathburn.app)
├── packages/            # Shared packages
├── .github/
│   └── workflows/       # CI/CD workflows
└── production/          # Production configuration files
    ├── ecosystem.config.js
    └── nginx/
```

## Configuration Scoping

### Root Level (Monorepo)

- `package.json`: Workspace definitions and root-level dev dependencies
- `turbo.json`: Pipeline definitions and build configurations
- `pnpm-workspace.yaml`: Workspace package definitions
- `.gitignore`: Root-level ignores
- `.eslintrc.js`: Base ESLint config
- `tsconfig.json`: Base TypeScript config

### App Level (apps/web)

- `package.json`: App-specific dependencies and scripts
- `next.config.js`: Next.js configuration with crypto polyfill
- `.env`: App-specific environment variables
- `tsconfig.json`: App-specific TypeScript config extending root
- `.eslintrc.js`: App-specific ESLint config extending root

## Build Process

### 1. Local Development

```bash
# From root directory
pnpm install        # Install all dependencies
pnpm dev           # Start all apps in dev mode
pnpm dev --filter web  # Start only web app
```

### 2. Production Build

```bash
# From root directory
pnpm build --filter web  # Build only web app
```

The build process:

1. Turborepo executes the build pipeline
2. Next.js creates a standalone build
3. Crypto polyfill is automatically included
4. Static assets are copied to standalone directory

### 3. Production Deployment

#### A. Manual Deployment

```bash
# On EC2 instance
cd /home/ec2-user/rathburn-monorepo
git pull origin main
pnpm install
pnpm build --filter web
pm2 restart ecosystem.config.js
```

#### B. GitHub Actions Deployment (Automated)

The workflow in `.github/workflows/deploy.yml` handles:

1. Building the application
2. SSH into EC2
3. Deploying to production
4. Managing PM2 processes

## Server Configuration

### PM2 Configuration

Location: `/home/ec2-user/rathburn-monorepo/production/ecosystem.config.js`

```javascript
module.exports = {
  apps: [
    {
      name: "rathburn-web",
      script: "./apps/web/.next/standalone/server.js",
      cwd: "/home/ec2-user/rathburn-monorepo",
      instances: "1",
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOST: "0.0.0.0",
        __NEXT_PRIVATE_STANDALONE_CONFIG: "true",
      },
      env_file: "./apps/web/.next/standalone/.env",
    },
  ],
};
```

### Nginx Configuration

Location: `/etc/nginx/conf.d/rathburn.conf`

```nginx
server {
    server_name rathburn.app www.rathburn.app;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/rathburn.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rathburn.app/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    listen 80;
    server_name rathburn.app www.rathburn.app;
    return 301 https://rathburn.app$request_uri;
}
```

## Troubleshooting

### Common Issues

1. **Crypto Error in Production**

   - Ensure `next.config.js` includes the crypto polyfill
   - Verify standalone build includes node_modules
   - Check server.js includes crypto global

```js
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: require.resolve("crypto-browserify"),
      };
    }
    return config;
  },
};

// server.js
if (!globalThis.crypto) {
  const { webcrypto } = require("crypto");
  globalThis.crypto = webcrypto;
}
require("./dist/server");
```

2. **Build Cache Issues**

   - Clear Turborepo cache: `pnpm turbo clean`
   - Clear Next.js cache: `pnpm --filter web clean`

3. **PM2 Process Not Starting**
   - Check logs: `pm2 logs rathburn-web`
   - Verify paths in ecosystem.config.js
   - Ensure environment variables are present

### Health Checks

1. **Verify Build**

```bash
ls -la apps/web/.next/standalone  # Should contain server.js and node_modules
```

2. **Check Services**

```bash
pm2 status  # Check PM2 processes
sudo systemctl status nginx  # Check Nginx
```

3. **Monitor Logs**

```bash
pm2 logs rathburn-web
sudo tail -f /var/log/nginx/error.log
```
