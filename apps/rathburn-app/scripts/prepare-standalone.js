#!/usr/bin/env node

/**
 * This script prepares the standalone build for deployment
 * It enhances the Next.js-generated standalone build with additional
 * files and configurations needed for deployment.
 */

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

console.log("Preparing standalone build for deployment...");

// Paths
const appDir = process.cwd();
const nextDir = path.join(appDir, ".next");
const standaloneDir = path.join(nextDir, "standalone");
const staticDir = path.join(standaloneDir, ".next", "static");
const publicDir = path.join(standaloneDir, "public");

// Check if standalone directory exists
if (!fs.existsSync(standaloneDir)) {
  console.error(
    'Standalone directory not found. Make sure to build with "output: standalone" in next.config.js'
  );
  process.exit(1);
}

// Check if server.js exists
if (!fs.existsSync(path.join(standaloneDir, "server.js"))) {
  console.error(
    "server.js not found in standalone directory. Build may have failed."
  );
  process.exit(1);
}

console.log("Next.js standalone build found. Enhancing for deployment...");

// Ensure .next/static directory exists in standalone
if (!fs.existsSync(staticDir)) {
  console.log("Creating directory: " + staticDir);
  fs.mkdirSync(staticDir, { recursive: true });
}

// Copy static files
const originalStaticDir = path.join(nextDir, "static");
if (fs.existsSync(originalStaticDir)) {
  console.log("Copying static files...");
  execSync(`cp -r ${originalStaticDir}/* ${staticDir}`);
}

// Copy public directory
const originalPublicDir = path.join(appDir, "public");
if (fs.existsSync(originalPublicDir)) {
  console.log("Copying public directory...");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  execSync(`cp -r ${originalPublicDir}/* ${publicDir}`);
}

// Copy environment files
console.log("Copying environment files...");
const envFiles = [
  ".env",
  ".env.local",
  ".env.production",
  ".env.production.local",
];
envFiles.forEach((file) => {
  const sourcePath = path.join(appDir, file);
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, path.join(standaloneDir, file));
  }
});

// Check if critical modules exist in standalone build
console.log("Checking for required dependencies...");
const criticalModules = [
  "sharp",
  "next",
  "react",
  "react-dom",
  "@supabase/supabase-js",
  "@supabase/ssr",
  "react-is",
];
const standaloneNodeModules = path.join(standaloneDir, "node_modules");

// Create a map to track which modules need to be copied
const modulesToCopy = new Map();

criticalModules.forEach((module) => {
  const modulePath = path.join(standaloneNodeModules, module);
  if (!fs.existsSync(modulePath)) {
    console.warn(`⚠️ Warning: ${module} not found in standalone build`);
    modulesToCopy.set(module, true);
  } else {
    console.log(`✓ ${module} is linked`);
  }
});

// Try to add missing modules directly
for (const [module, _] of modulesToCopy) {
  console.log(`Manually adding ${module}...`);
  try {
    // First check if module exists in node_modules
    const sourcePath = path.join(appDir, "node_modules", module);
    if (fs.existsSync(sourcePath)) {
      // Create target directory if it doesn't exist
      const targetPath = path.join(standaloneNodeModules, module);
      const targetDir = path.dirname(targetPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // Copy the module
      execSync(`cp -r "${sourcePath}" "${targetDir}/"`);
      console.log(`✓ Successfully copied ${module}`);
    } else {
      // Try to find in pnpm structure
      try {
        // Using find command to locate the module in pnpm structure
        const cmd = `find ${appDir}/node_modules/.pnpm -name "${module}" -type d | grep -v "node_modules/${module}/node_modules"`;
        const result = execSync(cmd).toString().trim().split("\n")[0];

        if (result && fs.existsSync(result)) {
          const targetPath = path.join(standaloneNodeModules, module);
          const targetDir = path.dirname(targetPath);
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
          }

          execSync(`cp -r "${result}" "${targetDir}/"`);
          console.log(`✓ Successfully copied ${module} from pnpm structure`);
        } else {
          throw new Error(`Module not found in pnpm structure`);
        }
      } catch (err) {
        console.error(`⚠️ Error adding ${module}: ${err.message}`);
      }
    }
  } catch (error) {
    console.error(`⚠️ Error adding ${module}: ${error.message}`);
  }
}

console.log("Standalone build preparation complete!");
console.log(
  `Standalone server is ready at: ${path.join(standaloneDir, "server.js")}`
);
console.log("You can start the server with: node .next/standalone/server.js");
