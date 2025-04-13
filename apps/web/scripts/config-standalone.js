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

// Copy static assets
console.log("📁 Copying static assets...");
runCommand(
  `mkdir -p .next/standalone/.next/static`,
  "Failed to create static directory"
);
runCommand(
  `cp -r .next/static/* .next/standalone/.next/static/`,
  "Failed to copy static assets"
);

// Copy public assets
console.log("📁 Copying public assets...");
if (fs.existsSync("public")) {
  runCommand(`cp -r public .next/standalone/`, "Failed to copy public folder");
} else {
  console.log("ℹ️ No public folder found, skipping...");
}

// Copy environment variables if they exist
console.log("🔒 Copying environment variables...");
if (fs.existsSync(".env")) {
  runCommand(`cp .env .next/standalone/.env`, "Failed to copy .env file");
} else {
  console.log("ℹ️ No .env file found, skipping...");
}

// Copy fonts directory if it exists
console.log("🔤 Copying fonts...");
if (fs.existsSync("app/fonts")) {
  runCommand(
    `mkdir -p .next/standalone/app/fonts`,
    "Failed to create fonts directory"
  );
  runCommand(
    `cp -r app/fonts/* .next/standalone/app/fonts/`,
    "Failed to copy fonts"
  );
} else {
  console.log("ℹ️ No fonts directory found, skipping...");
}

console.log("✅ Standalone configuration completed successfully");
