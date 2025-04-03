#!/usr/bin/env node

/**
 * This script sets up a complete standalone Next.js deployment package
 * by copying all necessary modules and files.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const ROOT_DIR = path.resolve(__dirname, '..');
const STANDALONE_DIR = path.join(ROOT_DIR, '.next', 'standalone');
const DEPS_TO_COPY = [
  '@supabase/supabase-js',
  '@supabase/ssr',
  'react',
  'react-dom',
  'sharp',
  'next'
];

console.log('🔧 Setting up standalone Next.js deployment package');

// Verify standalone directory exists
if (!fs.existsSync(STANDALONE_DIR)) {
  console.error('❌ Standalone directory not found at:', STANDALONE_DIR);
  console.log('Please run `pnpm build` first to generate the standalone output.');
  process.exit(1);
}

// Function to copy a dependency and its dependencies
function copyDependency(dep) {
  const srcDir = path.join(ROOT_DIR, 'node_modules', dep);
  const destDir = path.join(STANDALONE_DIR, 'node_modules', dep);
  
  if (!fs.existsSync(srcDir)) {
    console.warn(`⚠️ Source dependency not found: ${dep}`);
    return false;
  }
  
  // Create destination directory
  fs.mkdirSync(path.dirname(destDir), { recursive: true });
  
  try {
    // On Unix systems, use cp -R for recursive copy
    execSync(`cp -R "${srcDir}" "${path.dirname(destDir)}"`);
    console.log(`✅ Copied dependency: ${dep}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to copy ${dep}:`, error.message);
    return false;
  }
}

// Setup the Next.js build directory structure
console.log('\n1. Setting up directory structure...');

// Create the Next.js output directories if they don't exist
const staticDir = path.join(STANDALONE_DIR, '.next', 'static');
fs.mkdirSync(staticDir, { recursive: true });

// Copy static assets from .next/static to standalone/.next/static
try {
  execSync(`cp -R "${path.join(ROOT_DIR, '.next', 'static')}"/* "${staticDir}"`);
  console.log('✅ Copied static assets');
} catch (error) {
  console.warn('⚠️ Failed to copy static assets:', error.message);
}

// Copy public directory
const publicSrc = path.join(ROOT_DIR, 'public');
const publicDest = path.join(STANDALONE_DIR, 'public');
if (fs.existsSync(publicSrc) && fs.readdirSync(publicSrc).length > 0) {
  fs.mkdirSync(publicDest, { recursive: true });
  try {
    execSync(`cp -R "${publicSrc}"/* "${publicDest}"`);
    console.log('✅ Copied public directory');
  } catch (error) {
    console.warn('⚠️ Failed to copy public directory:', error.message);
  }
}

// Copy environment files
console.log('\n2. Copying environment files...');
['production', 'development', ''].forEach(env => {
  const envFile = path.join(ROOT_DIR, `.env${env ? '.' + env : ''}`);
  if (fs.existsSync(envFile)) {
    fs.copyFileSync(envFile, path.join(STANDALONE_DIR, path.basename(envFile)));
    console.log(`✅ Copied ${path.basename(envFile)}`);
  }
});

// Create necessary modules and patches
console.log('\n3. Creating polyfill and patches...');

// Create node-polyfill-crypto.js in required locations
const createPolyfill = (targetDir) => {
  const polyfillContent = '// This is a stub file to resolve the "Cannot find module \'./node-polyfill-crypto\'" error\n' +
    '// when running Next.js standalone server in Node.js >=18.\n\n' +
    '// No actual implementation needed as modern Node.js already has crypto built-in\n' +
    'module.exports = {};\n';
  
  fs.writeFileSync(targetDir, polyfillContent);
  console.log(`✅ Created polyfill at: ${targetDir}`);
};

// Create the polyfill in multiple locations to ensure it's found
createPolyfill(path.join(STANDALONE_DIR, 'node-polyfill-crypto.js'));

// Copy required node modules
console.log('\n4. Copying required node modules...');
let copiedCount = 0;

// Copy the required node modules
DEPS_TO_COPY.forEach(dep => {
  if (copyDependency(dep)) {
    copiedCount++;
  }
});

// Fix the Next.js build output log module issue
console.log('\n5. Fixing Next.js output/log module issue...');

// Define the missing modules
const missingDirs = [
  // Missing log module path
  path.join(STANDALONE_DIR, 'node_modules', 'next', 'dist', 'build', 'output'),
  
  // Another common missing module path
  path.join(STANDALONE_DIR, 'node_modules', 'next', 'dist', 'compiled', '@vercel', 'nft'),
];

// Create missing directories
missingDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Create a basic log.js module
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

// Write the log module
const outputDir = path.join(STANDALONE_DIR, 'node_modules', 'next', 'dist', 'build', 'output');
fs.writeFileSync(path.join(outputDir, 'log.js'), logContent);
console.log('✅ Created log.js module');

// Create a README.md with deployment instructions
console.log('\n6. Creating deployment guide...');
const readmeContent = `# Next.js Standalone Deployment

This is a standalone Next.js application built for production deployment.

## Running the application

To start the server, run:

\`\`\`
node server.js
\`\`\`

## Environment variables

The following environment variables can be configured:

- \`PORT\`: The port to run the server on (default: 3000)
- \`HOSTNAME\`: The hostname to bind to (default: 0.0.0.0)
- \`NODE_ENV\`: The environment to run in (should be "production")

## Deployment options

This standalone build is optimized for production deployment and can be:

1. Run directly with Node.js
2. Containerized with Docker
3. Deployed to any Node.js hosting platform
`;

fs.writeFileSync(path.join(STANDALONE_DIR, 'README.md'), readmeContent);
console.log('✅ Created README.md with deployment instructions');

// Summary
console.log('\n🎉 Standalone setup complete!');
console.log(`Copied ${copiedCount} dependencies to the standalone directory.`);
console.log('\nTo start the standalone server:');
console.log('  cd .next/standalone && node server.js');
console.log('\nTo test locally:');
console.log('  pnpm start:standalone'); 