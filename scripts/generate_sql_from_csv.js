const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

// Path to the CSV file - the data is at /Users/conrad/Documents/apps/data/repro-data.csv
const csvPath = "/Users/conrad/Documents/apps/data/repro-data.csv";
const outputPath = path.join(__dirname, "./import_drums_data.sql");

// Read the CSV file
const csvContent = fs.readFileSync(csvPath, "utf8");

// Parse the CSV
const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
});

// Find the actual property names for our columns of interest
const firstRecord = records[0];
const recordKeys = Object.keys(firstRecord);

// Find the index of the property that starts with 'old_id'
const oldIdKey = recordKeys.find((key) => key.includes("old_id"));
const materialKey = recordKeys.find((key) => key.includes("material"));
const dateKey = recordKeys.find((key) => key.includes("date"));
const siteKey = recordKeys.find((key) => key.includes("site"));

console.log("Using column keys:");
console.log(`old_id -> ${oldIdKey}`);
console.log(`material -> ${materialKey}`);
console.log(`date -> ${dateKey}`);
console.log(`site -> ${siteKey}`);

// Data cleaning and stats
let stats = {
  totalRows: 0,
  emptyMaterial: 0,
  duplicateOldIds: 0,
  emptyOldIds: 0,
  emptySite: 0,
  missingDate: 0,
  uniqueMaterials: new Set(),
  uniqueMaterialCodes: new Set(),
};

// Track duplicates
const processedOldIds = {};
const duplicates = [];

// Process records for stats and cleaning
records.forEach((record) => {
  stats.totalRows++;

  // Track materials and codes
  if (!record[materialKey]) stats.emptyMaterial++;
  else stats.uniqueMaterials.add(record[materialKey].trim());

  // Generate material code
  const materialCode = record[materialKey]
    ? record[materialKey].slice(0, 3).toUpperCase()
    : "XXX";
  stats.uniqueMaterialCodes.add(materialCode);

  // Check if old_id is empty
  if (!record[oldIdKey] || record[oldIdKey].trim() === "") {
    stats.emptyOldIds++;
  } else {
    // Track duplicate old_ids
    const cleanId = record[oldIdKey].trim();
    if (processedOldIds[cleanId]) {
      processedOldIds[cleanId]++;
      if (processedOldIds[cleanId] === 2) {
        // Only count unique duplicates
        duplicates.push(cleanId);
        stats.duplicateOldIds++;
      }
    } else {
      processedOldIds[cleanId] = 1;
    }
  }

  // Count empty sites
  if (!record[siteKey]) stats.emptySite++;

  // Count missing dates
  if (!record[dateKey]) stats.missingDate++;
});

// Generate SQL statements
let sqlStatements = `-- Import data from repro-data.csv into public.drums table
-- This script handles the necessary transformations for the data
-- Generated on ${new Date().toISOString()}
-- Stats: 
--   Total Rows: ${stats.totalRows}
--   Unique Materials: ${stats.uniqueMaterials.size}
--   Unique Material Codes: ${stats.uniqueMaterialCodes.size}
--   Empty Material Fields: ${stats.emptyMaterial}
--   Empty old_id Values: ${stats.emptyOldIds}
--   Duplicate old_id Values: ${stats.duplicateOldIds}
--   Empty Site Fields: ${stats.emptySite}
--   Missing Date Fields: ${stats.missingDate}

-- Clean up any existing data (optional - uncomment if needed)
-- DELETE FROM public.drums;

-- Begin transaction
BEGIN;

-- Insert data with transformations
INSERT INTO public.drums (
  old_id,
  material,
  material_code,
  date_ordered,
  site,
  status
)
VALUES
`;

// Counter for generating unique IDs for empty old_id values
let emptyIdCounter = 1;

// Process each row
records.forEach((record, index) => {
  // Get old_id, use empty placeholder if needed
  let oldId =
    record[oldIdKey] && record[oldIdKey].trim()
      ? record[oldIdKey].trim()
      : `EMPTY_${emptyIdCounter++}`;

  // Get material, default to empty string if null
  const material = (record[materialKey] || "").trim();

  // Create material_code (first 3 chars uppercase or XXX)
  const materialCode = material ? material.slice(0, 3).toUpperCase() : "XXX";

  // Format date - ensure it's valid or set to NULL
  let dateOrdered = null;
  if (record[dateKey]) {
    const trimmedDate = record[dateKey].trim();
    // Only use date if it looks like a date
    if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(trimmedDate)) {
      dateOrdered = trimmedDate;
    }
  }

  // Site transformation (first 3 chars lowercase)
  const site = record[siteKey]
    ? record[siteKey].slice(0, 3).toLowerCase()
    : "new";

  // Fixed status
  const status = "R";

  // Add comma after each row except the last one
  const delimiter = index < records.length - 1 ? "," : "";

  // Format SQL row with proper escaping
  sqlStatements += `('${oldId.replace(/'/g, "''")}', '${material.replace(/'/g, "''")}', '${materialCode}', ${dateOrdered ? `'${dateOrdered}'` : "NULL"}, '${site}', '${status}')${delimiter}\n`;
});

// Close the SQL statement
sqlStatements += `;\n\n-- Commit transaction\nCOMMIT;\n\n`;

// Add detailed warnings
if (stats.emptyOldIds > 0) {
  sqlStatements += `-- WARNING: ${stats.emptyOldIds} rows had empty old_id values.\n`;
  sqlStatements += `-- These have been assigned placeholder values like 'EMPTY_1', 'EMPTY_2', etc.\n\n`;
}

if (duplicates.length > 0) {
  sqlStatements += `-- WARNING: The following old_id values appear multiple times in the data:\n`;
  sqlStatements += `-- ${duplicates.join(", ")}\n`;
  sqlStatements += `-- You may want to resolve these duplicates manually.\n\n`;
}

if (stats.emptySite > 0 || stats.emptyMaterial > 0 || stats.missingDate > 0) {
  sqlStatements += `-- NOTE: Some rows had missing values that were defaulted:\n`;
  if (stats.emptySite > 0)
    sqlStatements += `-- * ${stats.emptySite} rows had no site (defaulted to 'new')\n`;
  if (stats.emptyMaterial > 0)
    sqlStatements += `-- * ${stats.emptyMaterial} rows had no material (defaulted to 'Unknown')\n`;
  if (stats.missingDate > 0)
    sqlStatements += `-- * ${stats.missingDate} rows had no date (set to NULL)\n`;
}

// Write to output file
fs.writeFileSync(outputPath, sqlStatements);

console.log(`SQL file generated at ${outputPath}`);
console.log(`
Import Statistics:
  Total Rows: ${stats.totalRows}
  Unique Materials: ${stats.uniqueMaterials.size}
  Unique Material Codes: ${stats.uniqueMaterialCodes.size}
  Empty Material Fields: ${stats.emptyMaterial}
  Empty old_id Values: ${stats.emptyOldIds}
  Duplicate old_id Values: ${stats.duplicateOldIds}
  Empty Site Fields: ${stats.emptySite}
  Missing Date Fields: ${stats.missingDate}
`);

// If issues exist, print warnings
if (stats.emptyOldIds > 0 || duplicates.length > 0) {
  console.log(`WARNINGS:`);
  if (stats.emptyOldIds > 0) {
    console.log(
      `- Found ${stats.emptyOldIds} empty old_id values (assigned placeholder IDs)`
    );
  }
  if (duplicates.length > 0) {
    console.log(`- Found ${duplicates.length} duplicate old_id values!`);
    console.log(
      `  Duplicates: ${duplicates.slice(0, 10).join(", ")}${duplicates.length > 10 ? "..." : ""}`
    );
  }
}
