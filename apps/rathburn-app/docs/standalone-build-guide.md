# Rathburn App Standalone Build and Run Guide

This is a comprehensive guide for building and running the Rathburn App in standalone mode in both development and production environments.

## Overview

The Rathburn App can be built and run in two primary modes:

1. **Standard Mode**: The default Next.js build mode, ideal for development.
2. **Standalone Mode**: A self-contained deployment package optimized for production.

This guide focuses on the standalone mode, which is required for production deployment and recommended for production-like testing.

## Quick Reference

### Build Process

```bash
# From monorepo root
pnpm build:rathburn:standalone

# OR from app directory
cd apps/rathburn-app
pnpm build && pnpm postbuild
```

### Run Process

```bash
# From monorepo root
pnpm start:rathburn  # using server.js wrapper (recommended)
# OR
pnpm start:rathburn:pm2  # with PM2 in development mode
# OR
pnpm start:rathburn:prod  # with PM2 in production mode

# From app directory
cd apps/rathburn-app
pnpm start  # using server.js wrapper (recommended)
# OR
pm2 start ecosystem.config.js --only rathburn-dev  # with PM2 in development mode
# OR
pm2 start ecosystem.config.js --only rathburn-app  # with PM2 in production mode
```

## Detailed Workflow

### 1. Standalone Build Process

The standalone build process consists of two main steps:

1. **Next.js Build**: Generates the standard Next.js build output with the `output: 'standalone'` option in `next.config.mjs`.
2. **Post-build Processing**: Enhances the standalone build with additional files and fixes.

#### Build Steps in Detail

1. Next.js build (`next build`):
   - Compiles and bundles the application
   - Creates the standalone output in `.next/standalone`
   - Includes minimal dependencies

2. Post-build scripts (`pnpm postbuild`):
   - `prepare-standalone.js`: Sets up directory structure and copies static files
   - `copy-node-modules.js`: Copies essential node modules like sharp
   - `patch-next-modules.js`: Creates polyfills and fixes module resolution issues

### 2. Runtime Environment

The standalone build is designed to run in any environment with Node.js 18+. It includes:

- A self-contained Next.js server (`server.js`)
- All required dependencies in the `.next/standalone/node_modules` directory
- Static assets in `.next/standalone/.next/static`
- Public files in `.next/standalone/public`

### 3. Runtime Scripts

Two main methods are provided to run the standalone build:

1. **Server Wrapper** (`server.js`):
   - Recommended for most cases
   - Handles environment setup and polyfill creation
   - Adds error handling and graceful shutdown

2. **PM2 Configuration** (`ecosystem.config.js`):
   - For production deployment and service management
   - Includes both development and production configurations
   - Handles environment variables and automatic restarts

## Path Resolution

The standalone server uses several path resolution mechanisms to ensure it works correctly:

1. **Working Directory Detection**:
   - The server wrapper automatically detects if it's running from the monorepo root or app directory
   - It sets up paths correctly regardless of the starting directory

2. **Environment Variables**:
   - `MONOREPO_ROOT`: Points to the monorepo root directory
   - `__NEXT_PRIVATE_STANDALONE_CONFIG`: Enables standalone mode features

3. **Module Resolution**:
   - Polyfills are created for module resolution (especially for the crypto module)
   - Missing Next.js internal modules are patched if needed

## Common Issues and Solutions

### 1. "ReferenceError: crypto is not defined"

This error occurs because Next.js attempts to use a Node.js polyfill for the crypto module, which is unnecessary in Node.js 18+.

**Solution**:
- The `patch-next-modules.js` and `server.js` scripts create a stub polyfill file
- Always use the server wrapper (`pnpm start` or `pnpm start:rathburn`)

### 2. Missing Modules

You might encounter errors about missing modules like `log.js` or various dependencies.

**Solution**:
- Ensure you've run the full standalone build: `pnpm build:rathburn:standalone`
- Manually run `pnpm setup-standalone` to create missing modules
- Check for required dependencies like sharp: `pnpm add sharp`

### 3. Path Resolution Issues

If the server can't find files or resolves paths incorrectly:

**Solution**:
- Always run from either the monorepo root or the app directory
- Use the server wrapper script instead of direct execution
- Ensure the `.next/standalone` directory exists and contains the expected files

## Production Deployment

For production deployment:

1. Build the standalone package:
   ```bash
   pnpm build:rathburn:standalone
   ```

2. Start with PM2:
   ```bash
   pnpm start:rathburn:prod
   # OR
   pm2 start ecosystem.config.js --only rathburn-app --env production
   ```

3. Set up PM2 to start on system boot:
   ```bash
   pm2 startup
   pm2 save
   ```

## Scripts Reference

| Script | Description |
|--------|-------------|
| `prepare-standalone.js` | Sets up the standalone directory structure and copies static files |
| `copy-node-modules.js` | Copies essential node modules to the standalone directory |
| `patch-next-modules.js` | Creates polyfills and fixes Next.js module issues |
| `setup-standalone.js` | Complete standalone setup (combination of all above) |
| `start-standalone.js` | Starts the standalone server with necessary fixes |
| `server.js` | Main server wrapper with comprehensive error handling |

## Configuration Files

| File | Description |
|------|-------------|
| `next.config.mjs` | Next.js configuration (must have `output: 'standalone'`) |
| `ecosystem.config.js` | PM2 configuration for both development and production |
| `package.json` | Contains build and run scripts |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | `development` |
| `PORT` | Server port | `3000` |
| `HOST` | Server host | `0.0.0.0` |
| `MONOREPO_ROOT` | Path to monorepo root | Auto-detected |
| `NEXT_PUBLIC_API_URL` | API URL for frontend | `http://localhost:3000/api/` |
| `__NEXT_PRIVATE_STANDALONE_CONFIG` | Enables standalone mode | `true` |