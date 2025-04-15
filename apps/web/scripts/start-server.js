#!/usr/bin/env node

/**
 * Script to start the Next.js server from the correct location
 *
 * This script checks multiple possible locations for the server.js file
 * and runs the first one it finds.
 */

const fs = require("fs");
const path = require("path");
const { execSync, spawn } = require("child_process");

const appDir = process.cwd();
console.log(`Starting server from ${appDir}`);

// Possible locations for server.js in order of preference
const possibleServerPaths = [
  // Standard standalone location
  path.join(appDir, ".next/standalone/server.js"),
  // Turborepo structure with app directory
  path.join(appDir, ".next/standalone/apps/web/server.js"),
  // Other possible locations
  path.join(appDir, "server.js"),
  path.join(appDir, ".next/server.js"),
];

// Find the first server.js that exists
let serverPath = null;
for (const p of possibleServerPaths) {
  if (fs.existsSync(p)) {
    serverPath = p;
    console.log(`✓ Found server.js at: ${p}`);
    break;
  }
}

if (!serverPath) {
  console.error(
    "❌ Could not find server.js in any of the expected locations:"
  );
  possibleServerPaths.forEach((p) => console.log(`  - ${p}`));
  process.exit(1);
}

// Get the directory containing server.js
const serverDir = path.dirname(serverPath);

// Log environment info
console.log(`NODE_ENV: ${process.env.NODE_ENV || "not set"}`);
console.log(`PORT: ${process.env.PORT || "3000 (default)"}`);

// Run the server from its directory
console.log(`Starting server from ${serverDir}`);
try {
  // Instead of running from standalone, let's use the alternate start script
  // This is more reliable across Next.js versions in Turborepo
  console.log("Using standalone-specific start method...");

  // Set the NODE_ENV to production if not set
  const env = {
    ...process.env,
    PORT: process.env.PORT || "3000",
    NODE_ENV: process.env.NODE_ENV || "production",
  };

  // Run the start:standalone script directly
  // This is safer than trying to fix all the file paths manually
  const startCommand = "pnpm run start:standalone";
  console.log(`Executing: ${startCommand}`);

  // Execute the command directly
  execSync(startCommand, {
    stdio: "inherit",
    env,
    cwd: appDir,
  });
} catch (error) {
  console.error("Error starting server:", error);
  process.exit(1);
}
