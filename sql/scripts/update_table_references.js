const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Load mapping file
const tableMapping = JSON.parse(
  fs.readFileSync("./table_schema_mapping.json", "utf8")
);

// Function to process a file
function processFile(filePath) {
  console.log(`Processing file: ${filePath}`);
  let content = fs.readFileSync(filePath, "utf8");
  let modified = false;

  // Replace table references in .from() calls
  Object.entries(tableMapping).forEach(([oldTable, newTable]) => {
    // Pattern matches .from("table_name") or .from('table_name')
    const pattern = new RegExp(`\\.from\\(['"](${oldTable})['"]\\)`, "g");

    if (pattern.test(content)) {
      content = content.replace(pattern, `.from("${newTable}")`);
      modified = true;
      console.log(`  Updated reference: ${oldTable} -> ${newTable}`);
    }
  });

  // Save changes if the file was modified
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`  Saved changes to ${filePath}`);
  } else {
    console.log(`  No changes needed in ${filePath}`);
  }
}

// Find files containing .from( patterns
const findCmd =
  'find apps -type f -name "*.ts" -o -name "*.tsx" | xargs grep -l "from("';
const files = execSync(findCmd, { encoding: "utf8" }).trim().split("\n");

console.log(`Found ${files.length} files with potential table references`);

// Process each file
files.forEach(processFile);

console.log("Finished updating table references in code files.");

// Now handle function definitions in SQL
console.log("\nTo update function definitions in SQL:");
console.log("1. Run these SQL commands to get existing function definitions:");

console.log(`
-- For each function you need to update, run:
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'function_name' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'schema_name');

-- After getting the function definition, modify all table references using your schema_mapping
-- and then use CREATE OR REPLACE FUNCTION to update it.
`);

console.log(
  "2. Then update each function with the schema-prefixed table names using:"
);
console.log(`
-- Example:
CREATE OR REPLACE FUNCTION schema_name.function_name(...) 
RETURNS ... 
LANGUAGE ... 
AS $function$
-- Updated function body with schema-prefixed table names
$function$;
`);
