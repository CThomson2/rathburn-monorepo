require("dotenv").config();
if (process.env.NODE_ENV !== "test") {
  require("dotenv").config({ path: ".env.local", override: true });
}

console.log("Environment:", process.env.NODE_ENV);
console.log("Database host:", process.env.DB_HOST);

// Show expanded DATABASE_URL
const url = process.env.DATABASE_URL.replace("${DB_USER}", process.env.DB_USER)
  .replace("${DB_PASSWORD}", process.env.DB_PASSWORD)
  .replace("${DB_HOST}", process.env.DB_HOST)
  .replace("${DB_PORT}", process.env.DB_PORT)
  .replace("${DB_NAME}", process.env.DB_NAME);

console.log("Database URL:", url);
