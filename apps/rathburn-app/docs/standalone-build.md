<think>Let's analyze the package.json files to understand how to build and start the rathburn-app using both standard Next.js and standalone configurations.

From the root monorepo's package.json:
```json
{
  "scripts": {
    "dev:rathburn": "pnpm dev --filter rathburn-app",
    "start:rathburn": "pnpm start --filter rathburn-app",
    "build:rathburn": "MONOREPO_ROOT=$(pwd) pnpm build --filter rathburn-app",
    "build:rathburn:standalone": "pnpm build:rathburn && pnpm postbuild --filter rathburn-app",
    "start:rathburn:standalone": "cd apps/rathburn-app && node scripts/start-standalone.js",
    "start:rathburn:pm2": "cd apps/rathburn-app && pm2 start ecosystem.config.js --only rathburn-dev",
  }
}
```

From the rathburn-app's package.json:
```json
{
  "scripts": {
    "dev": "next dev",
    "clean": "rm -rf .next/cache",
    "build": "npx prisma generate && npm run clean && next build",
    "start": "node server.js",
    "start:standalone": "node .next/standalone/server.js",
    "start:next": "next start",
    "postbuild": "node scripts/prepare-standalone.js && node scripts/copy-node-modules.js && node scripts/patch-next-modules.js",
    "setup-standalone": "node scripts/setup-standalone.js",
    "copy-modules": "node scripts/copy-node-modules.js",
  }
}
```

Key files that would need to be modified:
1. next.config.mjs - From previous discussions, I know this contains the `output: "standalone"` setting.

Now let's create a markdown document explaining both approaches:</think># Rathburn App Build & Start Guide

This guide explains how to build and run the Rathburn application using both standard Next.js configuration and standalone output mode.

## Prerequisites

Ensure you have Node.js and PNPM installed. The project is set up as a monorepo using PNPM workspaces.

## A. Standard Next.js Configuration

### Build Process

1. Modify `next.config.mjs` in `apps/rathburn-app` to remove or comment out the standalone output:
   ```js
   // Change from
   output: "standalone",
   
   // To
   // output: "standalone",
   ```

2. Run build from the root of the monorepo:
   ```bash
   pnpm build:rathburn
   ```
   
   Or directly in the app directory:
   ```bash
   cd apps/rathburn-app
   pnpm build
   ```

### Start the App

From the monorepo root:
```bash
pnpm start:rathburn
```

Or using the direct Next.js start command:
```bash
cd apps/rathburn-app
pnpm start:next
```

## B. Standalone Output Configuration

### Build Process

1. Ensure `next.config.mjs` in `apps/rathburn-app` has standalone output enabled:
   ```js
   output: "standalone",
   ```

2. Run the standalone build from the monorepo root:
   ```bash
   pnpm build:rathburn:standalone
   ```
   
   Or directly:
   ```bash
   cd apps/rathburn-app
   pnpm build && pnpm postbuild
   ```

### Start the App

From the monorepo root:
```bash
pnpm start:rathburn:standalone
```

Or directly:
```bash
cd apps/rathburn-app
pnpm start:standalone
```

Alternatively, using the custom server wrapper:
```bash
cd apps/rathburn-app
pnpm start
```

For production with PM2:
```bash
pnpm start:rathburn:pm2
```

## Files to Modify When Switching Modes

1. **next.config.mjs**
   - Toggle the `output: "standalone"` line

2. **ecosystem.config.js** (for PM2)
   - May need adjustments when switching configurations

3. **package.json** scripts
   - No changes needed as both modes have dedicated scripts

## Additional Utility Scripts

- `pnpm setup-standalone`: Prepares a complete standalone deployment package
- `pnpm copy-modules`: Copies essential node modules to standalone folder
- `pnpm patch-next-modules.js`: Fixes module resolution issues in standalone mode

## Notes

- Standard configuration is simpler for development but may not match production behavior
- Standalone mode creates a self-contained deployment package optimized for production environments
- For the most production-like local testing, use standalone mode with `pnpm start` or `pnpm start:standalone`
