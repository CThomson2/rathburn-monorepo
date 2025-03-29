# Deployment Guide: Next.js App on EC2 with Nginx

## Prerequisites

- AWS EC2 instance running Amazon Linux 2023
- Domain name (e.g., rathburn.app) pointing to EC2 public IP
- Node.js 18.x installed
- PM2 installed globally (`npm install -g pm2`)
- Nginx installed
- Certbot installed for SSL certificates

## Security Group Configuration

EC2 Security Group should allow:

- HTTP (80) from anywhere (0.0.0.0/0)
- HTTPS (443) from anywhere (0.0.0.0/0)
- SSH (22) from your IP only

## SSL Certificate

> Certificate Name: rathburn.app
> Serial Number: 4d7275c9517bccfaba17d45321df3630929
> Key Type: ECDSA
> Domains: rathburn.app www.rathburn.app
> Expiry Date: 2025-06-04 00:19:59+00:00 (VALID: 67 days)
> Certificate Path: /etc/letsencrypt/live/rathburn.app/fullchain.pem
> Private Key Path: /etc/letsencrypt/live/rathburn.app/privkey.pem

## Nginx Setup

1. Install Nginx:

```bash
sudo dnf install nginx
```

2. Configure Nginx (`/etc/nginx/conf.d/rathburn.conf`):

```nginx
server {
    server_name rathburn.app www.rathburn.app;

    location / {
        proxy_pass http://172.31.43.105:3000;  # Use your EC2 private IP
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60;
        proxy_send_timeout 60;
        proxy_read_timeout 60;
    }

    # Security headers with better browser compatibility
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    # More permissive CSP for better browser compatibility
    add_header Content-Security-Policy "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval'; img-src 'self' https: data: blob:; font-src 'self' https: data:; connect-src 'self' https: wss:;" always;

    # HSTS (uncomment if you're sure about HTTPS)
    # add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/rathburn.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rathburn.app/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    listen 80;
    server_name rathburn.app www.rathburn.app;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    return 301 https://rathburn.app$request_uri;
}
```

3. SSL Certificate Setup:

```bash
sudo certbot --nginx -d rathburn.app -d www.rathburn.app
```

## Next.js App Configuration

1. `next.config.mjs`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  webpack: (config) => {
    config.cache = {
      type: "memory",
      maxGenerations: 1,
    };
    return config;
  },
};

export default nextConfig;
```

2. `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: "rathburn-online",
      script: "./.next/standalone/server.js",
      cwd: "/home/ec2-user/rathburn-online",
      args: "-p 3000",
      watch: false,
      instances: "1",
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        NEXT_PUBLIC_API_URL: "https://rathburn.app/api/",
        __NEXT_PRIVATE_STANDALONE_CONFIG: "true",
        NEXT_TELEMETRY_DISABLED: 1,
      },
      env_file: ".next/standalone/.env",
    },
  ],
};
```

## Deployment Process

1. Pull latest changes:

```bash
cd /home/ec2-user/rathburn-online
git pull origin main
```

2. Install dependencies and build:

```bash
npm install --omit=optional
npx prisma generate
npm run build
```

3. Copy necessary files to standalone:

```bash
mkdir -p .next/standalone/node_modules/sharp
cp -r node_modules/sharp/* .next/standalone/node_modules/sharp/
mkdir -p .next/standalone/.next/static
cp -r .next/static/* .next/standalone/.next/static/
cp .env .next/standalone/
[ -d "public" ] && cp -r public .next/standalone/
```

4. Restart the application:

```bash
pm2 stop rathburn-online
pm2 delete rathburn-online
pm2 start ecosystem.config.js
```

## Troubleshooting

1. Check Nginx status:

```bash
sudo systemctl status nginx
sudo nginx -t
```

2. Check application logs:

```bash
pm2 logs rathburn-online
```

3. Check Nginx logs:

```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

4. Verify application is running:

```bash
sudo netstat -tulpn | grep :3000
```

## Important Notes

- Always use the EC2 private IP (172.31.43.105) in Nginx config, not localhost
- Keep SSL certificates up to date (auto-renewal should be configured)
- Ensure all environment variables are properly set in `.env`
- The standalone output is required for production deployment
