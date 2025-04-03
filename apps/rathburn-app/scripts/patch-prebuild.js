#!/usr/bin/env node

/**
 * Pre-build script that sets up polyfills and patches for the build process
 * This addresses the "ReferenceError: crypto is not defined" error during build
 */

console.log("🔧 Setting up build environment patches...");

// Create a crypto patch file that will be required before next runs
const fs = require("fs");
const path = require("path");

// Create a crypto shim if it doesn't exist already
const shimPath = path.join(__dirname, "..", "crypto-shim.js");
console.log("Creating crypto shim at", shimPath);
fs.writeFileSync(
  shimPath,
  `
// This shim is loaded before Next.js to ensure crypto is available globally
if (typeof globalThis.crypto === 'undefined') {
  const crypto = require('crypto');
  
  // Define crypto polyfill for Node.js
  globalThis.crypto = {
    getRandomValues: function(buffer) {
      return crypto.randomFillSync(buffer);
    }
  };
  
  // Add webcrypto.subtle if available
  if (crypto.webcrypto && crypto.webcrypto.subtle) {
    globalThis.crypto.subtle = crypto.webcrypto.subtle;
  }
  
  console.log('✅ Injected crypto polyfill into global context');
}
`
);
console.log("✅ Crypto shim created");

// Modify NODE_OPTIONS to include the shim
const nodeOptions = process.env.NODE_OPTIONS || "";
if (!nodeOptions.includes(shimPath)) {
  process.env.NODE_OPTIONS = `${nodeOptions} --require "${shimPath}"`.trim();
  console.log(`✅ NODE_OPTIONS set to: ${process.env.NODE_OPTIONS}`);
}

// Also create a patched version of Next.js encryption-utils.js if needed
// This is a direct fix for the file that throws the crypto error
try {
  // Look for the encryption-utils.js file in node_modules
  const possiblePaths = [
    path.join(
      __dirname,
      "..",
      "node_modules",
      "next",
      "dist",
      "server",
      "app-render",
      "encryption-utils.js"
    ),
    path.join(
      __dirname,
      "..",
      "node_modules",
      ".pnpm",
      "next@14.2.1_@babel+core@7.26.10_@opentelemetry+api@1.9.0_babel-plugin-macros@3.1.0_react-dom@_4saqf7usvzgj6j3dqoxpogiarm",
      "node_modules",
      "next",
      "dist",
      "server",
      "app-render",
      "encryption-utils.js"
    ),
  ];

  let encryptionUtilsPath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      encryptionUtilsPath = p;
      break;
    }
  }

  if (encryptionUtilsPath) {
    console.log(`Found encryption-utils.js at: ${encryptionUtilsPath}`);

    // Read the file
    const content = fs.readFileSync(encryptionUtilsPath, "utf8");

    // Check if it contains multiple crypto declarations - this indicates the file has been patched multiple times
    if (
      content.match(/const crypto = global\.crypto \|\| require\('crypto'\);/g)
        ?.length > 1
    ) {
      // Fix multiple declarations by replacing with a single one
      const fixedContent = content.replace(
        /\/\/ Patch for ReferenceError[\s\S]*?const crypto = global\.crypto \|\| require\('crypto'\);(\s*\n)+/g,
        ""
      );
      const singlePatchedContent = `
// Patch for ReferenceError: crypto is not defined
const crypto = global.crypto || require('crypto');

${fixedContent}`;

      fs.writeFileSync(encryptionUtilsPath, singlePatchedContent);
      console.log(
        `✅ Fixed multiple crypto declarations in encryption-utils.js`
      );
    }
    // Check if it needs patching (contains reference to crypto without polyfill)
    else if (
      !content.includes("const crypto = global.crypto || require('crypto')")
    ) {
      // Add crypto polyfill
      const patchedContent = `
// Patch for ReferenceError: crypto is not defined
const crypto = global.crypto || require('crypto');

${content}`;

      fs.writeFileSync(encryptionUtilsPath, patchedContent);
      console.log(`✅ Patched encryption-utils.js to include crypto polyfill`);
    } else {
      console.log("encryption-utils.js already properly patched");
    }
  } else {
    console.log("Could not find encryption-utils.js to patch");
  }
} catch (error) {
  console.warn("Failed to patch encryption-utils.js:", error.message);
}

console.log("✅ Build environment patched successfully");
console.log("You can now run the build command");
