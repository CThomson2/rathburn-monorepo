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
  `mkdir -p .next/standalone/apps/web/.next/static`,
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
} else {
  console.log("ℹ️ No .env file found, skipping...");
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

// Copy the server.js file to the correct location
console.log("🚀 Setting up server.js...");
if (fs.existsSync(path.join(standalonePath, "server.js"))) {
  // Copy server.js from root standalone to apps/web directory if needed
  runCommand(
    `cp .next/standalone/server.js .next/standalone/apps/web/server.js`,
    "Failed to copy server.js file to apps/web directory"
  );
  console.log("✅ server.js copied to apps/web directory");
} else {
  console.warn("⚠️ server.js not found in standalone directory!");
  console.log("🔧 Using server template instead...");

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

// Create a package.json file in the standalone directory if it doesn't exist
console.log("📦 Setting up standalone package.json...");
const standalonePackagePath = path.join(standalonePath, "package.json");
if (!fs.existsSync(standalonePackagePath)) {
  const packageJson = {
    name: "web-standalone",
    version: "1.0.0",
    private: true,
    scripts: {
      start: "node server.js",
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

console.log("✅ Standalone configuration completed successfully");
