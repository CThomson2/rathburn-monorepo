// Load .env first
console.log("--- Loading .env first ---");
require("dotenv").config({ path: ".env" });
console.log("DB_HOST (.env):", process.env.DB_HOST);
console.log("DATABASE_URL (.env):", process.env.DATABASE_URL);

// Then load .env.local to see if it overrides
console.log("\n--- Then loading .env.local ---");
require("dotenv").config({ path: ".env.local" });
console.log("DB_HOST (.env.local override):", process.env.DB_HOST);
console.log("DATABASE_URL (.env.local override):", process.env.DATABASE_URL);

console.log("\n--- Environment ---");
console.log("NODE_ENV:", process.env.NODE_ENV);
