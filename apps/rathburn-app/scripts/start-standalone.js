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

// Fix common issues with standalone build
console.log('Checking for missing modules...');

// 1. Fix for missing log module
const outputDir = path.join(appDir, '.next', 'standalone', 'node_modules', 'next', 'dist', 'build', 'output');
if (!fs.existsSync(outputDir)) {
  console.log('Creating missing output directory...');
  fs.mkdirSync(outputDir, { recursive: true });
}

const logPath = path.join(outputDir, 'log.js');
if (!fs.existsSync(logPath)) {
  console.log('Creating missing log.js module...');
  const logContent = `
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

// Simple stub implementation of Next.js log functions
exports.error = (...args) => console.error(...args);
exports.warn = (...args) => console.warn(...args);
exports.info = (...args) => console.info(...args);
exports.log = (...args) => console.log(...args);
exports.trace = (...args) => console.trace(...args);
exports.debug = (...args) => console.debug(...args);
`;
  fs.writeFileSync(logPath, logContent);
}

// 2. Fix for node-polyfill-crypto
console.log('Copying node-polyfill-crypto.js to standalone directory...');
const polyfillContent = `
// This is a stub file to resolve the "Cannot find module './node-polyfill-crypto'" error
// when running Next.js standalone server in Node.js >=18.

// No actual implementation needed as modern Node.js already has crypto built-in
module.exports = {};
`;

const nextServerDir = path.join(appDir, '.next', 'standalone', 'node_modules', 'next', 'dist', 'server');
if (!fs.existsSync(nextServerDir)) {
  fs.mkdirSync(nextServerDir, { recursive: true });
}
fs.writeFileSync(path.join(nextServerDir, 'node-polyfill-crypto.js'), polyfillContent);
fs.writeFileSync(path.join(appDir, '.next', 'standalone', 'node-polyfill-crypto.js'), polyfillContent);

// 3. Fix for missing config module
console.log('Creating missing config module...');
const configDir = path.join(appDir, '.next', 'standalone', 'node_modules', 'next', 'dist', 'server');
const configContent = `
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

// Basic stub for Next.js server config
exports.default = {
  compress: true,
  generateEtags: true,
  poweredByHeader: true,
  reactRoot: true,
  runtime: 'nodejs',
};
`;
fs.writeFileSync(path.join(configDir, 'config.js'), configContent);

// 4. Fix for missing lib/constants module
console.log('Creating missing constants module...');
const libDir = path.join(appDir, '.next', 'standalone', 'node_modules', 'next', 'dist', 'lib');
if (!fs.existsSync(libDir)) {
  fs.mkdirSync(libDir, { recursive: true });
}

const constantsContent = `
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

// Minimum stub for Next.js constants
exports.PHASE_DEVELOPMENT_SERVER = "phase-development-server";
exports.PHASE_PRODUCTION_BUILD = "phase-production-build";
exports.PHASE_PRODUCTION_SERVER = "phase-production-server";
exports.PHASE_EXPORT = "phase-export";
exports.PERMANENT_REDIRECT_STATUS = 308;
exports.TEMPORARY_REDIRECT_STATUS = 307;
`;
fs.writeFileSync(path.join(libDir, 'constants.js'), constantsContent);

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