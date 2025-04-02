#!/usr/bin/env node

/**
 * Helper script to run the standalone build with proper monorepo configuration
 * This script ensures all the necessary environment variables are set properly
 * for running the standalone build in a monorepo structure.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get the monorepo root (parent of the apps directory)
const appDir = process.cwd();
const monorepoRoot = path.resolve(appDir, '../..');

// Ensure we're in the rathburn-app directory
if (!appDir.endsWith('rathburn-app')) {
  console.error('This script must be run from the rathburn-app directory');
  process.exit(1);
}

// Check if .next/standalone/server.js exists
const serverPath = path.join(appDir, '.next', 'standalone', 'server.js');
if (!fs.existsSync(serverPath)) {
  console.error('Standalone build not found. Run "npm run build && npm run postbuild" first.');
  process.exit(1);
}

// Copy the node-polyfill-crypto.js file to the standalone directory
const polyfillSource = path.join(appDir, 'node-polyfill-crypto.js');
const polyfillDest = path.join(appDir, '.next', 'standalone', 'node-polyfill-crypto.js');
if (fs.existsSync(polyfillSource)) {
  console.log('Copying node-polyfill-crypto.js to standalone directory...');
  fs.copyFileSync(polyfillSource, polyfillDest);
}

// Set environment variables for the standalone server
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.PORT = process.env.PORT || 3000;
process.env.NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/';
process.env.HOST = process.env.HOST || '0.0.0.0';
process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = 'true';
process.env.NEXT_TELEMETRY_DISABLED = 1;
process.env.MONOREPO_ROOT = monorepoRoot;

console.log('Starting standalone server with the following configuration:');
console.log(`- App directory: ${appDir}`);
console.log(`- Monorepo root: ${monorepoRoot}`);
console.log(`- Environment: ${process.env.NODE_ENV}`);
console.log(`- Port: ${process.env.PORT}`);
console.log(`- API URL: ${process.env.NEXT_PUBLIC_API_URL}`);

// Execute the standalone server
try {
  console.log('Starting standalone server...');
  execSync(`node ${serverPath}`, { stdio: 'inherit' });
} catch (error) {
  console.error('Failed to start standalone server:', error.message);
  process.exit(1);
}