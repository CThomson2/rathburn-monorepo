// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Detect if we're running from monorepo root or app directory
const isMonorepoRoot =
  !fs.existsSync("next.config.js") && fs.existsSync("apps/web/next.config.js");
const appDir = isMonorepoRoot
  ? path.join(process.cwd(), "apps/web")
  : process.cwd();
const standalonePath = path.join(appDir, ".next/standalone");

console.log(
  `Running from ${isMonorepoRoot ? "monorepo root" : "app directory"}`
);
console.log(`App directory: ${appDir}`);
console.log(`Standalone path: ${standalonePath}`);

function runCommand(command, errorMessage) {
  try {
    console.log(`Executing: ${command}`);
    execSync(command, { stdio: "inherit", cwd: appDir });
  } catch (error) {
    console.error(`❌ ${errorMessage}`);
    console.error(error);
    process.exit(1);
  }
}

// Ensure standalone directories exist
console.log("📁 Creating standalone directories...");
runCommand(
  `mkdir -p .next/standalone/apps/web/.next/static .next/standalone/.next/static`,
  "Failed to create standalone directory structure"
);

// Ensure sharp is available for image processing in standalone
console.log("📦 Installing sharp for image processing...");
if (fs.existsSync(path.join(appDir, "node_modules/sharp"))) {
  runCommand(
    `mkdir -p .next/standalone/node_modules/sharp`,
    "Failed to create sharp directory"
  );
  runCommand(
    `cp -r node_modules/sharp/* .next/standalone/node_modules/sharp/`,
    "Failed to copy sharp module"
  );
} else {
  console.log("⚠️ Sharp module not found, skipping...");
}

// Check if static directory exists before trying to copy
console.log("📁 Copying static assets...");
if (fs.existsSync(path.join(appDir, ".next/static"))) {
  runCommand(
    `cp -r .next/static/* .next/standalone/apps/web/.next/static/`,
    "Failed to copy static assets"
  );
  runCommand(
    `cp -r .next/static/* .next/standalone/.next/static/`,
    "Failed to copy static assets to root"
  );
} else {
  console.log("⚠️ Static assets directory not found, skipping...");
  // This might happen during the first build with the new structure
  // Create an empty directory to prevent further errors
  runCommand(
    `mkdir -p .next/standalone/apps/web/.next/static`,
    "Failed to create static directory"
  );
}

// Copy public assets
console.log("📁 Copying public assets...");
if (fs.existsSync(path.join(appDir, "public"))) {
  runCommand(`cp -r public .next/standalone/`, "Failed to copy public folder");
} else {
  console.log("ℹ️ No public folder found, skipping...");
}

// Copy environment variables if they exist
console.log("🔒 Copying environment variables...");
if (fs.existsSync(path.join(appDir, ".env"))) {
  runCommand(
    `cp .env .next/standalone/apps/web/.env`,
    "Failed to copy .env file"
  );
  runCommand(
    `cp .env .next/standalone/.env`,
    "Failed to copy .env file to standalone root"
  );
} else {
  console.log("ℹ️ No .env file found, skipping...");
}

// Copy essential Next.js files for standalone server
console.log("📄 Copying essential Next.js files...");
const essentialFiles = [
  "BUILD_ID",
  "routes-manifest.json",
  "build-manifest.json",
  "prerender-manifest.json",
  "app-paths-manifest.json",
  "app-build-manifest.json",
  "react-loadable-manifest.json",
  "trace",
  "cache",
];

for (const file of essentialFiles) {
  const sourcePath = path.join(appDir, ".next", file);
  const targetPath1 = path.join(standalonePath, ".next", file);
  const targetPath2 = path.join(standalonePath, "apps", "web", ".next", file);

  if (fs.existsSync(sourcePath)) {
    console.log(`Copying ${file}...`);

    // Copy file or directory based on type
    try {
      const stats = fs.lstatSync(sourcePath);
      if (stats.isDirectory()) {
        // Create target directories
        if (!fs.existsSync(path.dirname(targetPath1))) {
          fs.mkdirSync(path.dirname(targetPath1), { recursive: true });
        }
        if (!fs.existsSync(path.dirname(targetPath2))) {
          fs.mkdirSync(path.dirname(targetPath2), { recursive: true });
        }

        // Create target subdirectories
        if (!fs.existsSync(targetPath1)) {
          fs.mkdirSync(targetPath1, { recursive: true });
        }
        if (!fs.existsSync(targetPath2)) {
          fs.mkdirSync(targetPath2, { recursive: true });
        }

        // Copy directory contents using executables that work on both Unix and Windows
        runCommand(
          `cp -r "${sourcePath}"/* "${targetPath1}"/`,
          `Failed to copy ${file} to standalone root`
        );
        runCommand(
          `cp -r "${sourcePath}"/* "${targetPath2}"/`,
          `Failed to copy ${file} to apps/web`
        );
      } else {
        // Create target directories
        if (!fs.existsSync(path.dirname(targetPath1))) {
          fs.mkdirSync(path.dirname(targetPath1), { recursive: true });
        }
        if (!fs.existsSync(path.dirname(targetPath2))) {
          fs.mkdirSync(path.dirname(targetPath2), { recursive: true });
        }

        // Copy individual file
        fs.copyFileSync(sourcePath, targetPath1);
        fs.copyFileSync(sourcePath, targetPath2);
      }
    } catch (err) {
      console.warn(
        `⚠️ Warning: Failed to copy ${file}: ${err.message}, skipping...`
      );
    }
  }
}

// Copy the server directory
if (fs.existsSync(path.join(appDir, ".next", "server"))) {
  console.log("Copying server directory...");

  // Ensure target directories exist
  fs.mkdirSync(path.join(standalonePath, ".next", "server"), {
    recursive: true,
  });
  fs.mkdirSync(path.join(standalonePath, "apps", "web", ".next", "server"), {
    recursive: true,
  });

  try {
    runCommand(
      `cp -r .next/server/* .next/standalone/.next/server/`,
      "Failed to copy server directory to standalone root"
    );
    runCommand(
      `cp -r .next/server/* .next/standalone/apps/web/.next/server/`,
      "Failed to copy server directory to apps/web"
    );
  } catch (err) {
    console.warn(
      `⚠️ Warning: Failed to copy server directory: ${err.message}, continuing...`
    );
  }
}

// Check for fonts in both the old and new locations
console.log("🔤 Copying fonts...");
const fontPaths = [
  "app/fonts", // Old path
  "src/app/fonts", // New path
  ".next/server/app/fonts", // Built fonts path
];

let fontsFound = false;
for (const fontPath of fontPaths) {
  if (fs.existsSync(path.join(appDir, fontPath))) {
    console.log(`Found fonts in ${fontPath}`);
    const targetDir = fontPath.includes("src")
      ? ".next/standalone/src/app/fonts"
      : fontPath.includes(".next")
        ? ".next/standalone/apps/web/.next/server/app/fonts"
        : ".next/standalone/app/fonts";

    runCommand(
      `mkdir -p ${targetDir}`,
      `Failed to create fonts directory at ${targetDir}`
    );
    runCommand(
      `cp -r ${fontPath}/* ${targetDir}/`,
      `Failed to copy fonts from ${fontPath}`
    );
    fontsFound = true;
  }
}

if (!fontsFound) {
  console.log("ℹ️ No fonts directory found in any location, skipping...");
}

// Check for Next.js generated server.js
console.log("🔍 Looking for Next.js generated server.js...");
const possibleServerPaths = [
  // Standard Next.js standalone output
  path.join(standalonePath, "server.js"),
  // Next.js 14+ sometimes puts it here
  path.join(standalonePath, "apps", "web", "server.js"),
  // Server index
  path.join(standalonePath, "server", "index.js"),
];

let serverFound = false;
let foundServerPath = null;
for (const serverPath of possibleServerPaths) {
  if (fs.existsSync(serverPath)) {
    console.log(`✓ Found server.js at: ${serverPath}`);
    foundServerPath = serverPath;
    serverFound = true;
    break;
  }
}

// Set up server.js in all required locations
console.log("🚀 Setting up server.js...");
runCommand(
  `mkdir -p .next/standalone/apps/web/.next/server`,
  "Failed to create server directory"
);

if (serverFound) {
  // Copy server.js to both root standalone and apps/web
  console.log(
    `Copying server from ${foundServerPath} to required locations...`
  );

  // Copy to the standalone root if not already there
  if (foundServerPath !== path.join(standalonePath, "server.js")) {
    fs.copyFileSync(foundServerPath, path.join(standalonePath, "server.js"));
    console.log("✅ Copied server.js to standalone root");
  }

  // Copy to apps/web directory
  fs.copyFileSync(
    foundServerPath,
    path.join(standalonePath, "apps", "web", "server.js")
  );
  console.log("✅ Copied server.js to apps/web directory");
} else {
  console.warn("⚠️ No Next.js server.js found! Using template instead...");

  // Use our fallback server template
  runCommand(
    `cp scripts/server-template.js .next/standalone/server.js`,
    "Failed to copy server template file"
  );

  // Also copy to the apps/web directory
  runCommand(
    `cp scripts/server-template.js .next/standalone/apps/web/server.js`,
    "Failed to copy server template to apps/web directory"
  );

  // Make it executable
  runCommand(
    `chmod +x .next/standalone/server.js .next/standalone/apps/web/server.js`,
    "Failed to make server.js executable"
  );

  console.log("✅ Server template implemented successfully");
}

// Create a minimal Next.js server handler if it doesn't exist
console.log("🔧 Setting up minimal server handler...");
const serverHandlerPath = path.join(
  standalonePath,
  "apps",
  "web",
  ".next",
  "server.js"
);
if (!fs.existsSync(serverHandlerPath)) {
  const minimalServerHandler = `
// Minimal Next.js server handler
module.exports = function(req, res) {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html");
  res.end(\`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Next.js App</title>
      <style>
        body { font-family: sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
        h1 { color: #0070f3; }
      </style>
    </head>
    <body>
      <h1>Next.js Standalone App</h1>
      <p>Your app is running in minimal mode. Features excluded from the build are not available.</p>
    </body>
    </html>
  \`);
};
module.exports.default = module.exports;
`;

  fs.writeFileSync(serverHandlerPath, minimalServerHandler);
  console.log(`✅ Created minimal server handler at ${serverHandlerPath}`);
} else {
  console.log("✓ Server handler already exists");
}

// Create a package.json file in the standalone directory if it doesn't exist
console.log("📦 Setting up standalone package.json...");
const standalonePackagePath = path.join(standalonePath, "package.json");
if (!fs.existsSync(standalonePackagePath)) {
  const packageJson = {
    name: "web-standalone",
    version: "1.0.0",
    private: true,
    scripts: {
      start: "NODE_ENV=production node server.js",
    },
    dependencies: {
      next: "14.2.24",
      react: "^19.0.0",
      "react-dom": "^19.0.0",
    },
  };

  fs.writeFileSync(
    standalonePackagePath,
    JSON.stringify(packageJson, null, 2),
    "utf8"
  );
  console.log("✅ Created standalone package.json");
} else {
  console.log("ℹ️ Standalone package.json already exists");
}

// Create a symlink from the app to node_modules for proper module resolution
console.log("🔗 Setting up app symlinks...");
try {
  fs.mkdirSync(path.join(standalonePath, "node_modules", "apps"), {
    recursive: true,
  });

  // Only create the symlink if it doesn't already exist
  const symlinkTarget = path.join(
    standalonePath,
    "node_modules",
    "apps",
    "web"
  );
  if (!fs.existsSync(symlinkTarget)) {
    fs.symlinkSync(
      path.join(standalonePath, "apps", "web"),
      symlinkTarget,
      "dir"
    );
    console.log("✅ Created symlink for apps/web in node_modules");
  } else {
    console.log("ℹ️ Symlink for apps/web already exists");
  }
} catch (error) {
  console.warn(
    "⚠️ Failed to create symlinks, but continuing...",
    error.message
  );
}

console.log("✅ Standalone configuration completed successfully");
