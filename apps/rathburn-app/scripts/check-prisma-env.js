// This script helps determine which environment variables Prisma will use

// Load environment variables the way Next.js would
if (process.env.NODE_ENV !== "production") {
  console.log(
    "Running in development mode - .env.local should take precedence"
  );
} else {
  console.log("Running in production mode");
}

// Mimic how Prisma loads environment variables
require("dotenv").config(); // loads .env
if (process.env.NODE_ENV !== "test") {
  require("dotenv").config({ path: ".env.local", override: true }); // loads and overrides with .env.local
}

// Extract the database details to confirm which file is being used
const dbHost = process.env.DB_HOST;
const databaseUrl = process.env.DATABASE_URL;

console.log("\n--- Environment Variables That Prisma Will Use ---");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("DB_HOST:", dbHost);
console.log("DATABASE_URL:", databaseUrl);

// Let's also check if the DATABASE_URL is using variables or has been expanded
if (databaseUrl && databaseUrl.includes("${")) {
  console.log("\n⚠️ WARNING: DATABASE_URL contains unexpanded variables!");

  // Let's manually expand the variables to see what Prisma would do
  const expandedUrl = databaseUrl
    .replace("${DB_USER}", process.env.DB_USER || "")
    .replace("${DB_PASSWORD}", process.env.DB_PASSWORD || "")
    .replace("${DB_HOST}", process.env.DB_HOST || "")
    .replace("${DB_PORT}", process.env.DB_PORT || "")
    .replace("${DB_NAME}", process.env.DB_NAME || "");

  console.log("Expanded DATABASE_URL (what Prisma would use):", expandedUrl);
}

// Show the origin of each variable
console.log("\n--- Variable Origin Detection ---");
// Let's see if DB_HOST matches .env or .env.local
if (dbHost === "db-production-1.cr888e0aspwm.eu-west-2.rds.amazonaws.com") {
  console.log("DB_HOST appears to be from .env (production)");
} else if (dbHost === "localhost") {
  console.log("DB_HOST appears to be from .env.local (development)");
} else {
  console.log("DB_HOST has an unexpected value:", dbHost);
}
