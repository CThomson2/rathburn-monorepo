#!/usr/bin/env node

/**
 * Script to check database connection
 * This helps verify if environment variables are properly loaded in standalone mode
 */

require("dotenv").config();
if (process.env.NODE_ENV !== "test") {
  try {
    require("dotenv").config({ path: ".env.local", override: true });
  } catch (error) {
    console.log("No .env.local file found, using only .env");
  }
}

console.log("Environment:", process.env.NODE_ENV);
console.log("Database host:", process.env.DB_HOST);
console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓ Defined" : "❌ Missing");
console.log("Supabase Anon Key:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✓ Defined" : "❌ Missing");

// Try to connect to Supabase
async function testSupabaseConnection() {
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error("❌ ERROR: Missing Supabase environment variables");
      return false;
    }
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    // Simple test query
    const { data, error } = await supabase.from('drums').select('*').limit(1);
    
    if (error) {
      console.error("❌ ERROR connecting to Supabase:", error.message);
      return false;
    }
    
    console.log("✅ Successfully connected to Supabase");
    console.log("Sample data:", data);
    return true;
  } catch (error) {
    console.error("❌ ERROR testing Supabase connection:", error.message);
    return false;
  }
}

// Check DATABASE_URL format
if (process.env.DATABASE_URL) {
  console.log("DATABASE_URL is defined");
  
  // Check if DATABASE_URL has variables that need replacing
  if (process.env.DATABASE_URL.includes("${")) {
    try {
      // Show expanded DATABASE_URL
      const url = process.env.DATABASE_URL
        .replace("${DB_USER}", process.env.DB_USER)
        .replace("${DB_PASSWORD}", process.env.DB_PASSWORD)
        .replace("${DB_HOST}", process.env.DB_HOST)
        .replace("${DB_PORT}", process.env.DB_PORT)
        .replace("${DB_NAME}", process.env.DB_NAME);
        
      console.log("Expanded DATABASE_URL:", url);
    } catch (error) {
      console.error("❌ Error expanding DATABASE_URL:", error.message);
    }
  } else {
    console.log("DATABASE_URL appears to be already expanded");
  }
} else {
  console.error("❌ DATABASE_URL is not defined");
}

// Run the test
testSupabaseConnection().then(success => {
  if (!success) {
    process.exit(1);
  }
});
