#!/bin/bash

# Drums Data Import Script
# This script automates the process of importing and processing drum inventory data

# Exit on any error
set -e

# Path settings
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
CSV_PATH="/Users/conrad/Documents/apps/data/repro-data.csv"
OUTPUT_DIR="${SCRIPT_DIR}"

# Check if CSV file exists
if [ ! -f "${CSV_PATH}" ]; then
  echo "Error: CSV file not found at ${CSV_PATH}"
  exit 1
fi

# Step 1: Generate SQL from CSV
echo "=== Step 1: Generating SQL from CSV ==="
echo "CSV file: ${CSV_PATH}"

# Check if csv-parse is installed
if ! npm list csv-parse > /dev/null 2>&1; then
  echo "Installing csv-parse package..."
  npm install csv-parse
fi

# Generate SQL
echo "Generating SQL..."
node "${SCRIPT_DIR}/generate_sql_from_csv.js"

# Step 2: Validate the generated SQL
echo ""
echo "=== Step 2: Validating generated SQL ==="
SQL_FILE="${OUTPUT_DIR}/import_drums_data.sql"

if [ ! -f "${SQL_FILE}" ]; then
  echo "Error: SQL file was not generated"
  exit 1
fi

# Count rows in SQL
ROW_COUNT=$(grep -c "')," "${SQL_FILE}" || true)
echo "Found ${ROW_COUNT} rows in the generated SQL file"

# Check for warnings
if grep -q "WARNING" "${SQL_FILE}"; then
  echo "WARNING: The SQL file contains warnings. Please review them:"
  grep -A 3 "WARNING" "${SQL_FILE}"
fi

# Step 3: Instructions for importing to Supabase
echo ""
echo "=== Step 3: Manual Supabase Import Instructions ==="
echo "To import the data into Supabase:"
echo "1. Open your Supabase dashboard"
echo "2. Navigate to the SQL Editor"
echo "3. Copy and paste the contents of ${SQL_FILE} into the editor"
echo "4. Run the SQL to insert all records into the public.drums table"
echo ""
echo "After importing, use process_drums_to_stock.sql to aggregate data:"
echo "1. First review unmapped material codes and add any missing ones to ref_materials"
echo "2. Then run the script to import data to the stock_repro table"
echo ""
echo "Import preparation completed successfully!"
echo "Generated files:"
echo "- Import SQL: ${SQL_FILE}"
echo "- Processing SQL: ${OUTPUT_DIR}/process_drums_to_stock.sql" 