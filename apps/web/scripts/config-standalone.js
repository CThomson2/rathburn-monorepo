// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require("fs");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { execSync } = require("child_process");

function runCommand(command, errorMessage) {
  try {
    execSync(command, { stdio: "inherit" });
  } catch (error) {
    console.error(`❌ ${errorMessage}`);
    console.error(error);
    process.exit(1);
  }
}

// Ensure sharp is available for image processing in standalone
console.log("📦 Installing sharp for image processing...");
runCommand("pnpm install --save-optional sharp", "Failed to install sharp");
runCommand(
  `mkdir -p .next/standalone/node_modules/sharp`,
  "Failed to create sharp directory"
);
runCommand(
  `cp -r node_modules/sharp/* .next/standalone/node_modules/sharp/`,
  "Failed to copy sharp module"
);

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
