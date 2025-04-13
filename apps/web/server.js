// Polyfill crypto for standalone mode
if (!globalThis.crypto) {
  const { webcrypto } = require('crypto');
  globalThis.crypto = webcrypto;
}

// Import path for static file serving
const path = require('path');

// Set the standalone build directory
process.env.NODE_ENV = 'production';
process.chdir(__dirname);

// Start the server
require('./.next/standalone/server.js');