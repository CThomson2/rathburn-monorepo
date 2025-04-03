#!/usr/bin/env node

/**
 * This script patches Next.js modules to fix the node-polyfill-crypto issue
 * in the standalone build.
 */

const fs = require("fs");
const path = require("path");

console.log("Patching Next.js modules for standalone build compatibility...");

// Paths to check for the Next.js dist/server directory
const possibleNextPaths = [
  // Standalone build path
  path.join(
    __dirname,
    "..",
    ".next",
    "standalone",
    "node_modules",
    "next",
    "dist",
    "server"
  ),
  // Local node_modules path
  path.join(__dirname, "..", "node_modules", "next", "dist", "server"),
  // pnpm path
  path.join(
    __dirname,
    "..",
    "node_modules",
    ".pnpm",
    "next@14.2.1_@babel+core@7.26.10_@opentelemetry+api@1.9.0_babel-plugin-macros@3.1.0_react-dom@_4saqf7usvzgj6j3dqoxpogiarm",
    "node_modules",
    "next",
    "dist",
    "server"
  ),
];

// Create the polyfill module content
const polyfillContent = `
// This is a stub file to resolve the "Cannot find module './node-polyfill-crypto'" error
// when running Next.js standalone server in Node.js >=18.

// No actual implementation needed as modern Node.js already has crypto built-in
module.exports = {};
`;

// Create the log module stub content
const logModuleContent = `
// This is a stub file to resolve the "Cannot find module '../build/output/log'" error
// when running Next.js standalone server

// Simple logger implementation
const logger = {
  warn: (...args) => console.warn('[next]', ...args),
  info: (...args) => console.info('[next]', ...args),
  error: (...args) => console.error('[next]', ...args),
  trace: (...args) => console.trace('[next]', ...args),
  debug: (...args) => console.debug('[next]', ...args),
  prefixes: {
    wait: '- ',
    error: '✖ ',
    warn: '⚠ ',
    ready: '✓ ',
    info: '● ',
    event: '✓ ',
    bootstrap: '● '
  },
  bootstrap: (...args) => console.log(...args)
};

module.exports = logger;
`;

// Create the config module stub content
const configModuleContent = `
// This is a stub file to resolve the "Cannot find module './config'" error
// when running Next.js standalone server

// Simple config implementation
module.exports = {
  // Default Next.js configuration
  nextConfig: {},
  // Add any other exported properties from the original config module
  getConfig: () => ({}),
  setConfig: () => ({}),
};
`;

// Patch the Next.js server modules by creating the missing polyfill file
let patchedCount = 0;

for (const nextPath of possibleNextPaths) {
  if (fs.existsSync(nextPath)) {
    console.log(`Found Next.js server directory at: ${nextPath}`);

    const polyfillPath = path.join(nextPath, "node-polyfill-crypto.js");

    // Create the polyfill file
    try {
      fs.writeFileSync(polyfillPath, polyfillContent);
      console.log(`✅ Created polyfill at: ${polyfillPath}`);
      patchedCount++;
    } catch (error) {
      console.error(
        `❌ Failed to create polyfill at ${polyfillPath}:`,
        error.message
      );
    }

    // Create the missing log module
    const buildDir = path.join(path.dirname(nextPath), "build");
    const outputDir = path.join(buildDir, "output");

    try {
      // Create directories if they don't exist
      fs.mkdirSync(outputDir, { recursive: true });

      const logPath = path.join(outputDir, "log.js");
      fs.writeFileSync(logPath, logModuleContent);
      console.log(`✅ Created log module at: ${logPath}`);
      patchedCount++;
    } catch (error) {
      console.error(`❌ Failed to create log module:`, error.message);
    }

    // Create the missing config module
    try {
      const configPath = path.join(nextPath, "config.js");
      fs.writeFileSync(configPath, configModuleContent);
      console.log(`✅ Created config module at: ${configPath}`);
      patchedCount++;
    } catch (error) {
      console.error(`❌ Failed to create config module:`, error.message);
    }
  }
}

// Also create the polyfill directly in the standalone directory
const standalonePolyfillPath = path.join(
  __dirname,
  "..",
  ".next",
  "standalone",
  "server",
  "node-polyfill-crypto.js"
);
try {
  // Ensure directory exists
  fs.mkdirSync(path.dirname(standalonePolyfillPath), { recursive: true });

  fs.writeFileSync(standalonePolyfillPath, polyfillContent);
  console.log(`✅ Created polyfill at: ${standalonePolyfillPath}`);
  patchedCount++;
} catch (error) {
  console.error(
    `❌ Failed to create polyfill at ${standalonePolyfillPath}:`,
    error.message
  );
}

// Also create in the root of standalone folder
const rootStandalonePolyfillPath = path.join(
  __dirname,
  "..",
  ".next",
  "standalone",
  "node-polyfill-crypto.js"
);
try {
  fs.writeFileSync(rootStandalonePolyfillPath, polyfillContent);
  console.log(`✅ Created polyfill at: ${rootStandalonePolyfillPath}`);
  patchedCount++;
} catch (error) {
  console.error(
    `❌ Failed to create polyfill at ${rootStandalonePolyfillPath}:`,
    error.message
  );
}

// Create the missing log module in standalone
const standaloneBuildOutputDir = path.join(
  __dirname,
  "..",
  ".next",
  "standalone",
  "node_modules",
  "next",
  "dist",
  "build",
  "output"
);
try {
  // Ensure directory exists
  fs.mkdirSync(standaloneBuildOutputDir, { recursive: true });

  const standaloneLogPath = path.join(standaloneBuildOutputDir, "log.js");
  fs.writeFileSync(standaloneLogPath, logModuleContent);
  console.log(`✅ Created log module at: ${standaloneLogPath}`);
  patchedCount++;
} catch (error) {
  console.error(`❌ Failed to create standalone log module:`, error.message);
}

// Create the missing config module in standalone
const standaloneConfigPath = path.join(
  __dirname,
  "..",
  ".next",
  "standalone",
  "node_modules",
  "next",
  "dist",
  "server",
  "config.js"
);
try {
  // Ensure directory exists
  fs.mkdirSync(path.dirname(standaloneConfigPath), { recursive: true });

  fs.writeFileSync(standaloneConfigPath, configModuleContent);
  console.log(`✅ Created config module at: ${standaloneConfigPath}`);
  patchedCount++;
} catch (error) {
  console.error(`❌ Failed to create standalone config module:`, error.message);
}

// Create a fixed server.js in the standalone directory
const serverJsPath = path.join(
  __dirname,
  "..",
  ".next",
  "standalone",
  "server.js"
);
if (fs.existsSync(serverJsPath)) {
  try {
    const serverJsContent = fs.readFileSync(serverJsPath, "utf8");
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

// Mock the missing log module
const path = require('path');
const logModulePath = path.join(__dirname, 'node_modules', 'next', 'dist', 'build', 'output', 'log.js');
if (!require.cache[logModulePath]) {
  try {
    require(logModulePath);
  } catch (e) {
    // If there's an error loading the module, create it on the fly
    const fs = require('fs');
    fs.mkdirSync(path.dirname(logModulePath), { recursive: true });
    fs.writeFileSync(logModulePath, \`
      // This is a stub file to resolve the "Cannot find module '../build/output/log'" error
      // when running Next.js standalone server
      
      // Simple logger implementation
      const logger = {
        warn: (...args) => console.warn('[next]', ...args),
        info: (...args) => console.info('[next]', ...args),
        error: (...args) => console.error('[next]', ...args),
        trace: (...args) => console.trace('[next]', ...args),
        debug: (...args) => console.debug('[next]', ...args),
        prefixes: {
          wait: '- ',
          error: '✖ ',
          warn: '⚠ ',
          ready: '✓ ',
          info: '● ',
          event: '✓ ',
          bootstrap: '● '
        },
        bootstrap: (...args) => console.log(...args)
      };
      
      module.exports = logger;
    \`);
  }
}

${serverJsContent}
`;

    fs.writeFileSync(serverJsPath, patchedServerJs);
    console.log(`✅ Patched server.js at: ${serverJsPath}`);
    patchedCount++;
  } catch (error) {
    console.error(
      `❌ Failed to patch server.js at ${serverJsPath}:`,
      error.message
    );
  }
}

if (patchedCount > 0) {
  console.log(`\n🎉 Successfully patched ${patchedCount} module(s).`);
  console.log("You can now start the standalone server with:");
  console.log("  node .next/standalone/server.js");
} else {
  console.error(
    "\n❌ No modules were patched. Standalone server might not work correctly."
  );
}
