#!/usr/bin/env node

/**
 * This script patches Next.js modules to fix the node-polyfill-crypto issue
 * in the standalone build.
 */

const fs = require('fs');
const path = require('path');

console.log('Patching Next.js modules for standalone build compatibility...');

// Paths to check for the Next.js dist/server directory
const possibleNextPaths = [
  // Standalone build path
  path.join(__dirname, '..', '.next', 'standalone', 'node_modules', 'next', 'dist', 'server'),
  // Local node_modules path
  path.join(__dirname, '..', 'node_modules', 'next', 'dist', 'server'),
  // pnpm path
  path.join(__dirname, '..', 'node_modules', '.pnpm', 'next@14.2.1_@babel+core@7.26.10_@opentelemetry+api@1.9.0_babel-plugin-macros@3.1.0_react-dom@_4saqf7usvzgj6j3dqoxpogiarm', 'node_modules', 'next', 'dist', 'server')
];

// Create the polyfill module content
const polyfillContent = `
// This is a stub file to resolve the "Cannot find module './node-polyfill-crypto'" error
// when running Next.js standalone server in Node.js >=18.

// No actual implementation needed as modern Node.js already has crypto built-in
module.exports = {};
`;

// Patch the Next.js server modules by creating the missing polyfill file
let patchedCount = 0;

for (const nextPath of possibleNextPaths) {
  if (fs.existsSync(nextPath)) {
    console.log(`Found Next.js server directory at: ${nextPath}`);
    
    const polyfillPath = path.join(nextPath, 'node-polyfill-crypto.js');
    
    // Create the polyfill file
    try {
      fs.writeFileSync(polyfillPath, polyfillContent);
      console.log(`✅ Created polyfill at: ${polyfillPath}`);
      patchedCount++;
    } catch (error) {
      console.error(`❌ Failed to create polyfill at ${polyfillPath}:`, error.message);
    }
  }
}

// Also create the polyfill directly in the standalone directory
const standalonePolyfillPath = path.join(__dirname, '..', '.next', 'standalone', 'server', 'node-polyfill-crypto.js');
try {
  // Ensure directory exists
  fs.mkdirSync(path.dirname(standalonePolyfillPath), { recursive: true });
  
  fs.writeFileSync(standalonePolyfillPath, polyfillContent);
  console.log(`✅ Created polyfill at: ${standalonePolyfillPath}`);
  patchedCount++;
} catch (error) {
  console.error(`❌ Failed to create polyfill at ${standalonePolyfillPath}:`, error.message);
}

// Also create in the root of standalone folder
const rootStandalonePolyfillPath = path.join(__dirname, '..', '.next', 'standalone', 'node-polyfill-crypto.js');
try {
  fs.writeFileSync(rootStandalonePolyfillPath, polyfillContent);
  console.log(`✅ Created polyfill at: ${rootStandalonePolyfillPath}`);
  patchedCount++;
} catch (error) {
  console.error(`❌ Failed to create polyfill at ${rootStandalonePolyfillPath}:`, error.message);
}

// Create a fixed server.js in the standalone directory
const serverJsPath = path.join(__dirname, '..', '.next', 'standalone', 'server.js');
if (fs.existsSync(serverJsPath)) {
  try {
    const serverJsContent = fs.readFileSync(serverJsPath, 'utf8');
    const patchedServerJs = `
// Add the polyfill module to avoid "Cannot find module './node-polyfill-crypto'" error
if (!require.cache[require.resolve('./node-polyfill-crypto')]) {
  require.cache[require.resolve('./node-polyfill-crypto')] = {
    id: require.resolve('./node-polyfill-crypto'),
    filename: require.resolve('./node-polyfill-crypto'),
    loaded: true,
    exports: {}
  };
}

${serverJsContent}
`;
    
    fs.writeFileSync(serverJsPath, patchedServerJs);
    console.log(`✅ Patched server.js at: ${serverJsPath}`);
    patchedCount++;
  } catch (error) {
    console.error(`❌ Failed to patch server.js at ${serverJsPath}:`, error.message);
  }
}

if (patchedCount > 0) {
  console.log(`\n🎉 Successfully patched ${patchedCount} module(s).`);
  console.log('You can now start the standalone server with:');
  console.log('  node .next/standalone/server.js');
} else {
  console.error('\n❌ No modules were patched. Standalone server might not work correctly.');
} 