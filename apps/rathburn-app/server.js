#!/usr/bin/env node

/**
 * Entry point for running the standalone Next.js server
 * This script handles polyfill issues and provides a more reliable startup experience
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

// Set key environment variables
process.env.NODE_OPTIONS = process.env.NODE_OPTIONS || '--no-warnings';
process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = 'true';
process.env.NEXT_TELEMETRY_DISABLED = '1';
process.env.MONOREPO_ROOT = process.env.MONOREPO_ROOT || path.resolve(__dirname, '../..');
process.env.PORT = process.env.PORT || '3000';
process.env.HOST = process.env.HOST || '0.0.0.0';

// Path to standalone server.js
const STANDALONE_PATH = path.join(__dirname, '.next', 'standalone', 'server.js');

// Check if we have a standalone build
if (!fs.existsSync(STANDALONE_PATH)) {
  console.error('\x1b[31m%s\x1b[0m', 'Error: Standalone build not found.');
  console.log('Please run:');
  console.log('\x1b[36m%s\x1b[0m', '  pnpm build && pnpm postbuild');
  console.log('Before starting the server.');
  process.exit(1);
}

// Fix for missing modules
console.log('Checking for missing modules...');

// 1. Create polyfill file if needed
const polyfillPath = path.join(__dirname, '.next', 'standalone', 'node-polyfill-crypto.js');
if (!fs.existsSync(polyfillPath)) {
  console.log('Creating node-polyfill-crypto.js...');
  fs.writeFileSync(
    polyfillPath,
    '// This is a stub file to resolve the "Cannot find module \'./node-polyfill-crypto\'" error\n' +
    '// when running Next.js standalone server in Node.js >=18.\n\n' +
    '// No actual implementation needed as modern Node.js already has crypto built-in\n' +
    'module.exports = {};\n'
  );
}

// 2. Fix for missing log module
const outputDir = path.join(__dirname, '.next', 'standalone', 'node_modules', 'next', 'dist', 'build', 'output');
if (!fs.existsSync(outputDir)) {
  console.log('Creating missing output directory...');
  fs.mkdirSync(outputDir, { recursive: true });
}

const logPath = path.join(outputDir, 'log.js');
if (!fs.existsSync(logPath)) {
  console.log('Creating missing log.js module...');
  fs.writeFileSync(
    logPath,
    '"use strict";\n' +
    'Object.defineProperty(exports, "__esModule", { value: true });\n\n' +
    '// Simple stub implementation of Next.js log functions\n' +
    'exports.error = (...args) => console.error(...args);\n' +
    'exports.warn = (...args) => console.warn(...args);\n' +
    'exports.info = (...args) => console.info(...args);\n' +
    'exports.log = (...args) => console.log(...args);\n' +
    'exports.trace = (...args) => console.trace(...args);\n' +
    'exports.debug = (...args) => console.debug(...args);\n'
  );
}

// 3. Fix for missing config module
const serverDir = path.join(__dirname, '.next', 'standalone', 'node_modules', 'next', 'dist', 'server');
if (!fs.existsSync(path.join(serverDir, 'config.js'))) {
  console.log('Creating missing config module...');
  fs.writeFileSync(
    path.join(serverDir, 'config.js'),
    '"use strict";\n' +
    'Object.defineProperty(exports, "__esModule", { value: true });\n\n' +
    '// Basic stub for Next.js server config\n' +
    'exports.default = {\n' +
    '  compress: true,\n' +
    '  generateEtags: true,\n' +
    '  poweredByHeader: true,\n' +
    '  reactRoot: true,\n' +
    '  runtime: "nodejs",\n' +
    '};\n'
  );
}

// 4. Fix for missing lib/constants module
console.log('Creating missing constants module...');
const libDir = path.join(__dirname, '.next', 'standalone', 'node_modules', 'next', 'dist', 'lib');
if (!fs.existsSync(libDir)) {
  fs.mkdirSync(libDir, { recursive: true });
}

if (!fs.existsSync(path.join(libDir, 'constants.js'))) {
  fs.writeFileSync(
    path.join(libDir, 'constants.js'),
    '"use strict";\n' +
    'Object.defineProperty(exports, "__esModule", { value: true });\n\n' +
    '// Minimum stub for Next.js constants\n' +
    'exports.PHASE_DEVELOPMENT_SERVER = "phase-development-server";\n' +
    'exports.PHASE_PRODUCTION_BUILD = "phase-production-build";\n' +
    'exports.PHASE_PRODUCTION_SERVER = "phase-production-server";\n' +
    'exports.PHASE_EXPORT = "phase-export";\n' +
    'exports.PERMANENT_REDIRECT_STATUS = 308;\n' +
    'exports.TEMPORARY_REDIRECT_STATUS = 307;\n'
  );
}

// For PM2 compatibility
if (process.env.NODE_APP_INSTANCE) {
  console.log(`Starting as PM2 instance ${process.env.NODE_APP_INSTANCE}`);
}

console.log('\x1b[32m%s\x1b[0m', '🚀 Starting Rathburn App Server');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Port:', process.env.PORT);
console.log('URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/');

// Check essential dependencies
const requiredDependencies = ['sharp', 'next', 'react', 'react-dom'];
const standaloneNodeModulesDir = path.join(__dirname, '.next', 'standalone', 'node_modules');

for (const dep of requiredDependencies) {
  const depPath = path.join(standaloneNodeModulesDir, dep);
  if (!fs.existsSync(depPath)) {
    console.warn('\x1b[33m%s\x1b[0m', `Warning: ${dep} not found in standalone/node_modules`);
    
    // For sharp specifically, suggest installation
    if (dep === 'sharp') {
      console.log('For image optimization, sharp must be installed:');
      console.log('\x1b[36m%s\x1b[0m', '  pnpm add sharp');
      console.log('Then rebuild the standalone version');
    }
  }
}

// Start the server
try {
  // Use spawn instead of require to keep process separation
  const server = spawn('node', [STANDALONE_PATH], {
    stdio: 'inherit',
    env: process.env
  });
  
  server.on('error', (err) => {
    console.error('\x1b[31m%s\x1b[0m', 'Failed to start server:', err.message);
    process.exit(1);
  });
  
  // Handle graceful shutdown
  ['SIGINT', 'SIGTERM'].forEach(signal => {
    process.on(signal, () => {
      console.log(`\n${signal} received, shutting down...`);
      server.kill(signal);
      process.exit(0);
    });
  });
  
  server.on('exit', (code) => {
    if (code !== 0) {
      console.error('\x1b[31m%s\x1b[0m', `Server exited with code ${code}`);
      process.exit(code);
    }
  });
} catch (error) {
  console.error('\x1b[31m%s\x1b[0m', 'Failed to start server:', error.message);
  process.exit(1);
} 