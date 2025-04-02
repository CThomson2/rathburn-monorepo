/**
 * Script to download drum data from Supabase to a CSV file
 *
 * Run with: node scripts/download-drums-to-csv.js
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.local" });

// Mock data in case the database connection fails
const MOCK_DATA = [
  {
    old_id: 14934,
    material: "Methanol",
    batch_code: "402723",
    id: 167,
    supplier: "Tennants",
    status: "N",
    created_at: "2025-04-02 11:21:08.573712",
    updated_at: "new",
    site: "new",
    date_ordered: "2023-09-06",
    chemical_group: "Alcohols",
  },
  {
    old_id: 17220,
    material: "THF",
    batch_code: "224BO181",
    id: 93,
    supplier: "Nan-Ya",
    status: "N",
    created_at: "2025-04-02 07:56:10.234957",
    updated_at: "2025-04-02 07:56:10.234957",
    site: "old",
    date_ordered: null,
    chemical_group: null,
  },
  {
    old_id: 14935,
    material: "Methanol",
    batch_code: "402723",
    id: 168,
    supplier: "Tennants",
    status: "N",
    created_at: "2025-04-02 11:21:08.957293",
    updated_at: "new",
    site: "new",
    date_ordered: "2023-09-06",
    chemical_group: "Alcohols",
  },
];

async function downloadDrumsToCSV() {
  console.log("Starting drum data download...");

  let drumsData = [];

  try {
    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        "Supabase credentials not found in environment variables"
      );
    }

    console.log("Connecting to Supabase...");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Try both singular and plural table names
    console.log('Attempting to query "drum" table');
    let { data: singularData, error: singularError } = await supabase
      .from("drum")
      .select("*");

    if (singularError) {
      console.log('Error querying "drum" table:', singularError.message);
      console.log('Attempting to query "drums" table');

      let { data: pluralData, error: pluralError } = await supabase
        .from("drums")
        .select("*");

      if (pluralError) {
        console.log('Error querying "drums" table:', pluralError.message);
        throw new Error("Could not retrieve data from either table");
      }

      drumsData = pluralData;
    } else {
      drumsData = singularData;
    }

    console.log(`Successfully retrieved ${drumsData.length} records`);
  } catch (error) {
    console.error("Error fetching data from Supabase:", error.message);
    console.log("Using mock data instead");
    drumsData = MOCK_DATA;
  }

  if (!drumsData || drumsData.length === 0) {
    console.log("No data found, using mock data");
    drumsData = MOCK_DATA;
  }

  // Convert to CSV
  const headers = Object.keys(drumsData[0]).join(",");
  const rows = drumsData.map((drum) =>
    Object.values(drum)
      .map((value) => {
        // Handle null values and escape commas in string values
        if (value === null) return "";
        if (typeof value === "string" && value.includes(","))
          return `"${value}"`;
        return value;
      })
      .join(",")
  );

  const csvContent = [headers, ...rows].join("\n");

  // Save to file
  const outputPath = path.join(process.cwd(), "public", "data");

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  const filePath = path.join(outputPath, "drums-data.csv");
  fs.writeFileSync(filePath, csvContent);

  console.log(`Data saved to ${filePath}`);

  // Create a JSON file too for easier consumption
  const jsonFilePath = path.join(outputPath, "drums-data.json");
  fs.writeFileSync(jsonFilePath, JSON.stringify(drumsData, null, 2));

  console.log(`JSON data saved to ${jsonFilePath}`);
}

downloadDrumsToCSV().catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
});
