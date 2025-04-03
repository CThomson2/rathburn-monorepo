# Rathburn App Standalone Deployment Guide

This guide outlines the process for building and deploying the Rathburn App in standalone mode, both with and without PM2.

## Prerequisites

- Node.js 18 or higher
- PNPM package manager
- PM2 (for production deployment)

## Build Process

### 1. Standard Build

The standard build is recommended for development:

```bash
# From monorepo root
pnpm build:rathburn

# OR from app directory
cd apps/rathburn-app
pnpm build
```

For development, run:
```bash
pnpm dev:rathburn
```

### 2. Standalone Build

Standalone mode creates a self-contained deployment package:

1. Enable standalone mode in `next.config.mjs`:
   ```js
   output: "standalone",
   ```

2. Build with standalone output:
   ```bash
   # From monorepo root
   pnpm build:rathburn:standalone

   # OR from app directory
   cd apps/rathburn-app
   pnpm build && pnpm postbuild
   ```

This creates a standalone directory at `.next/standalone` with all necessary files.

## Deployment Methods

### 1. Direct Node.js Execution

```bash
# From monorepo root
pnpm start:rathburn:standalone

# OR from app directory
cd apps/rathburn-app
node server.js
```

### 2. PM2 Deployment (Production)

For production environments, use PM2:

```bash
# From monorepo root
pnpm start:rathburn:pm2

# OR from app directory
cd apps/rathburn-app
pm2 start ecosystem.config.js --only rathburn-app --env production
```

For development with PM2:
```bash
pnpm start:rathburn:pm2
# OR
pm2 start ecosystem.config.js --only rathburn-dev --env development
```

## Known Issues and Fixes

### Missing Modules

The standalone build may require additional modules. The following are created automatically by our scripts:

1. **Missing `log` module**: 
   - Location: `.next/standalone/node_modules/next/dist/build/output/log.js`
   - Fixed by `start-standalone.js` and `setup-standalone.js`

2. **Missing `node-polyfill-crypto` module**:
   - Location: `.next/standalone/node-polyfill-crypto.js`
   - Fixed by `start-standalone.js` and `setup-standalone.js`

3. **Missing `config` module**:
   - Location: `.next/standalone/node_modules/next/dist/server/config.js`
   - Fixed by `start-standalone.js`

4. **Missing `constants` module**:
   - Location: `.next/standalone/node_modules/next/dist/lib/constants.js`
   - Fixed by `start-standalone.js`

### Environment Variables

Ensure these environment variables are set:

```
NODE_ENV=production (or development)
PORT=3000
HOST=0.0.0.0
NEXT_PUBLIC_API_URL=https://your-domain.com/api/
__NEXT_PRIVATE_STANDALONE_CONFIG=true
NEXT_TELEMETRY_DISABLED=1
MONOREPO_ROOT=/path/to/monorepo/root
```

PM2 ecosystem.config.js already includes these variables.

## Utility Scripts

- `prepare-standalone.js`: Enhances the standalone build
- `copy-node-modules.js`: Copies essential node modules
- `patch-next-modules.js`: Fixes module resolution issues
- `setup-standalone.js`: Complete standalone deployment setup
- `start-standalone.js`: Starts the standalone server with fixes

## Testing the Deployment

To verify the deployment is working:

1. Check the server is running: `curl http://localhost:3000`
2. Check API endpoints: `curl http://localhost:3000/api/dashboard/current-stock`
3. Verify database connection: `node scripts/check-db-connection.js`
4. Test Supabase connection: `node scripts/check-prisma-env.js`

## Best Practices

- For development: Use standard build without standalone mode
- For production testing: Use standalone mode with direct Node.js execution
- For production deployment: Use standalone mode with PM2
- Always build with the correct environment variables set