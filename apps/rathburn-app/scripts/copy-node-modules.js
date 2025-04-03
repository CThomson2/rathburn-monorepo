#!/usr/bin/env node

/**
 * Script to copy essential node modules to the standalone folder
 * This handles the pnpm structure properly and ensures all needed modules are available
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const appDir = process.cwd();
const nextDir = path.join(appDir, ".next");
const standaloneDir = path.join(nextDir, "standalone");
const standaloneNodeModulesDir = path.join(standaloneDir, "node_modules");

console.log("Copying essential node modules to standalone folder...");

// Check if standalone directory exists
if (!fs.existsSync(standaloneDir)) {
  console.error(
    'Standalone directory not found. Make sure you build with "output: standalone" in next.config.js'
  );
  process.exit(1);
}

// Ensure node_modules directory exists
if (!fs.existsSync(standaloneNodeModulesDir)) {
  fs.mkdirSync(standaloneNodeModulesDir, { recursive: true });
}

// Critical dependencies that must be copied
const criticalDeps = [
  "sharp",
  "@supabase/supabase-js",
  "@supabase/ssr",
  "react",
  "react-dom",
  "react-is",
];

// Copy each critical dependency
criticalDeps.forEach((dep) => {
  console.log(`Checking ${dep}...`);

  const destDir = path.join(standaloneNodeModulesDir, dep);

  // Skip if already exists
  if (fs.existsSync(destDir)) {
    console.log(`✓ ${dep} already present`);
    return;
  }

  try {
    // Find the dep in node_modules
    const sourcePath = findDependencyInNodeModules(dep);

    if (!sourcePath) {
      console.warn(`⚠️ Could not find ${dep} in node_modules`);
      return;
    }

    console.log(`Found ${dep} at ${sourcePath}`);

    // Create destination directory structure
    const destParent = path.dirname(destDir);
    if (!fs.existsSync(destParent)) {
      fs.mkdirSync(destParent, { recursive: true });
    }

    // Check if the source is a symlink
    const isSymlink = fs.lstatSync(sourcePath).isSymbolicLink();

    if (isSymlink) {
      // For symlinks, create a matching symlink in the destination
      const linkTarget = fs.readlinkSync(sourcePath);
      fs.symlinkSync(linkTarget, destDir);
      console.log(`✓ Created symlink for ${dep} pointing to ${linkTarget}`);
    } else {
      // For regular directories, copy as before
      execSync(`cp -r "${sourcePath}" "${destParent}/"`, { stdio: "inherit" });
      console.log(`✓ Successfully copied ${dep}`);
    }
  } catch (error) {
    console.warn(`⚠️ Error handling ${dep}: ${error.message}`);
  }
});

// Special handling for node-polyfill-crypto
const polyfillPath = path.join(standaloneDir, "node-polyfill-crypto.js");
if (!fs.existsSync(polyfillPath)) {
  console.log("Creating node-polyfill-crypto.js...");
  fs.writeFileSync(
    polyfillPath,
    "// This is a stub file to resolve the \"Cannot find module './node-polyfill-crypto'\" error\n" +
      "// when running Next.js standalone server in Node.js >=18.\n\n" +
      "// No actual implementation needed as modern Node.js already has crypto built-in\n" +
      "module.exports = {};\n"
  );
  console.log("✓ Created node-polyfill-crypto.js");
}

// Create a README for the standalone directory
const readmePath = path.join(standaloneDir, "README.md");
if (!fs.existsSync(readmePath)) {
  console.log("Creating README.md for standalone deployment...");
  fs.writeFileSync(
    readmePath,
    "# Rathburn App - Standalone Deployment\n\n" +
      "This is a standalone deployment build of the Rathburn App.\n\n" +
      "## Running the server\n\n" +
      "```bash\n" +
      "node server.js\n" +
      "```\n\n" +
      "## Environment Variables\n\n" +
      "The following environment variables can be set:\n\n" +
      "- `PORT`: The port to listen on (default: 3000)\n" +
      "- `NODE_ENV`: The environment (development, production)\n" +
      "- `NEXT_PUBLIC_API_URL`: The URL for API calls\n\n" +
      "## Troubleshooting\n\n" +
      "If you encounter any issues, please check that all dependencies are properly installed.\n"
  );
  console.log("✓ Created README.md");
}

console.log("✅ Node modules copying complete!");

/**
 * Helper function to find a dependency in node_modules
 */
function findDependencyInNodeModules(dep) {
  // Direct path
  const directPath = path.join(appDir, "node_modules", dep);
  if (fs.existsSync(directPath)) {
    return directPath;
  }

  // Check in pnpm structure
  try {
    // For @scoped packages
    if (dep.startsWith("@")) {
      const [scope, name] = dep.split("/");
      const pnpmPath = path.join(appDir, "node_modules", scope);

      if (fs.existsSync(pnpmPath)) {
        return path.join(pnpmPath, name);
      }
    }

    // Try to find in .pnpm directory structure using a more targeted approach
    const pnpmDir = path.join(appDir, "node_modules", ".pnpm");
    if (fs.existsSync(pnpmDir)) {
      // First try direct search without recursion for better performance
      const deps = fs
        .readdirSync(pnpmDir)
        .filter(
          (folder) =>
            folder.startsWith(dep + "@") || folder.includes("+" + dep + "@")
        );

      if (deps.length > 0) {
        const newestDep = deps.sort().pop(); // Get the last one which might be the newest version
        const newestDepPath = path.join(
          pnpmDir,
          newestDep,
          "node_modules",
          dep
        );
        if (fs.existsSync(newestDepPath)) {
          return newestDepPath;
        }
      }

      // Fall back to find command if the direct approach doesn't work
      const nameToSearch = dep.replace("@", "").replace("/", "+");
      const cmd = `find "${pnpmDir}" -type d -name "${dep}" | grep -v "node_modules/${dep}/node_modules" | head -n 1`;

      try {
        const result = execSync(cmd).toString().trim();
        if (result && fs.existsSync(result)) {
          return result;
        }
      } catch (error) {
        // Ignore find errors
      }
    }
  } catch (error) {
    console.warn(
      `Error searching for ${dep} in pnpm structure:`,
      error.message
    );
  }

  return null;
}
