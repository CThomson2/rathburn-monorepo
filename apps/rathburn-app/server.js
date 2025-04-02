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

// Create polyfill file if needed
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