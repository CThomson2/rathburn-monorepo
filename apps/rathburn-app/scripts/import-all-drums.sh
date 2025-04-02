#!/bin/bash

# Define the path to the .env file
ENV_FILE="apps/rathburn-app/.env"

echo "Attempting to load environment variables from: $ENV_FILE"

# Check if the .env file exists
if [ -f "$ENV_FILE" ]; then
  echo "Found .env file, loading variables..."
  # Export variables from .env file
  set -a
  source "$ENV_FILE"
  set +a
  echo "Environment variables loaded."
else
  echo "Warning: .env file not found at $ENV_FILE"
fi

# Debug: Print environment variables (redacted for security)
echo "NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL:0:20}..."
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY exists: $([ ! -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ] && echo "Yes" || echo "No")"
echo "NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY exists: $([ ! -z "$NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY" ] && echo "Yes" || echo "No")"

# Check if environment variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
  echo "Error: Supabase environment variables are not set."
  echo "Please make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are available."
  exit 1
fi

CSV_FILE="apps/rathburn-app/src/app/(routes)/stock-count/combined.csv"

# Check if the CSV file exists and print the first five lines to verify content
echo "Checking CSV file content..."
if [ -f "$CSV_FILE" ]; then
  echo "First 5 lines of the CSV file:"
  head -n 5 "$CSV_FILE"
else
  echo "CSV file not found, will check again later"
fi

# Check if the CSV file exists
if [ ! -f "$CSV_FILE" ]; then
  echo "Error: CSV file not found at $CSV_FILE"
  exit 1
fi

echo "Starting import of drums data to Supabase..."
echo "Using Supabase URL: $NEXT_PUBLIC_SUPABASE_URL"

# Initialize counter for successful inserts
successful_inserts=0

# Skip the header line and process each row
tail -n +2 "$CSV_FILE" | while IFS=, read -r oldId material qty supplier batchCode dateOrdered site int clerk dateProcessed; do
  # Skip if dateProcessed is not empty
  if [ ! -z "$dateProcessed" ]; then
    continue
  fi

  # Trim whitespace from all fields
  oldId=$(echo "$oldId" | xargs)
  material=$(echo "$material" | xargs)
  batchCode=$(echo "$batchCode" | xargs)
  supplier=$(echo "$supplier" | xargs)
  dateOrdered=$(echo "$dateOrdered" | xargs)
  site=$(echo "$site" | xargs)

  # Skip if oldId is empty (required field)
  if [ -z "$oldId" ]; then
    echo "Skipping row: oldId is empty"
    continue
  fi

  # Handle empty values - convert to null for JSON
  if [ -z "$batchCode" ]; then
    batchCode="null"
  else
    batchCode="\"$batchCode\""
  fi

  if [ -z "$supplier" ]; then
    supplier="null"
  else
    supplier="\"$supplier\""
  fi

  if [ -z "$site" ]; then
    site="null"
  else
    site="\"$site\""
  fi

  if [ -z "$dateOrdered" ]; then
    dateOrdered="null"
  else
    dateOrdered="\"$dateOrdered\""
  fi

  if [ -z "$material" ]; then
    material="null"
  else
    material="\"$material\""
  fi

  # Create JSON payload
  JSON_DATA="{\"oldId\":\"$oldId\",\"material\":$material,\"batchCode\":$batchCode,\"supplier\":$supplier,\"site\":$site,\"dateOrdered\":$dateOrdered}"

  echo "Inserting drum with oldId: $oldId"

  # Send data to Supabase
  response=$(curl -s -w "%{http_code}" -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/drums" \
    -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
    -H "Authorization: Bearer $NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=minimal" \
    -d "$JSON_DATA")

  # Check if insert was successful (HTTP 201 Created)
  if [ "${response: -3}" = "201" ]; then
    successful_inserts=$((successful_inserts + 1))
    echo "Successfully inserted drum with oldId: $oldId"
  else
    echo "Failed to insert drum with oldId: $oldId"
    echo "Response: $response"
  fi

  # Add a small delay to avoid overwhelming the API
  sleep 0.2
done

echo "Import completed! Successfully inserted $successful_inserts drums."