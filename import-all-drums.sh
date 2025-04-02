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

echo "Checking CSV file content..."
if [ -f "$CSV_FILE" ]; then
  echo "First 5 lines of the CSV file:"
  head -n 5 "$CSV_FILE"
  echo "Total number of lines in CSV:"
  wc -l "$CSV_FILE"
else
  echo "Error: CSV file not found at $CSV_FILE"
  exit 1
fi

echo "Starting import of drums data to Supabase..."
echo "Using Supabase URL: $NEXT_PUBLIC_SUPABASE_URL"

# Initialize counters
total_rows=0
skipped_processed=0
skipped_empty_id=0
successful_inserts=0
failed_inserts=0

# Skip the header line and process each row
tail -n +2 "$CSV_FILE" | while IFS=, read -r oldId material qty supplier batchCode dateOrdered site int clerk dateProcessed; do
  total_rows=$((total_rows + 1))
  
  echo "Processing row: oldId=$oldId, material=$material, dateProcessed=$dateProcessed"
  
  # Skip if dateProcessed is not empty
  if [ ! -z "$dateProcessed" ]; then
    echo "Skipping: dateProcessed is not empty"
    skipped_processed=$((skipped_processed + 1))
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
    echo "Skipping: oldId is empty"
    skipped_empty_id=$((skipped_empty_id + 1))
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
  JSON_DATA="{\"old_id\":\"$oldId\",\"material\":$material,\"batch_code\":$batchCode,\"supplier\":$supplier,\"site\":$site,\"date_ordered\":$dateOrdered}"
  
  echo "Sending JSON payload: $JSON_DATA"

  # Send data to Supabase
  response=$(curl -s -w "\\n%{http_code}" -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/drums" \
    -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
    -H "Authorization: Bearer $NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=minimal" \
    -d "$JSON_DATA")

  # Split response into body and status code more reliably
  http_code=$(echo "$response" | tail -n1)
  response_body=$(echo "$response" | sed '$d')

  # Check if insert was successful (HTTP 201 Created or 200 OK)
  if [ "$http_code" = "201" ] || [ "$http_code" = "200" ]; then
    successful_inserts=$((successful_inserts + 1))
    echo "Successfully inserted drum with oldId: $oldId"
  else
    failed_inserts=$((failed_inserts + 1))
    echo "Failed to insert drum with oldId: $oldId"
    echo "Status code: $http_code"
    [ ! -z "$response_body" ] && echo "Response body: $response_body"
  fi

  # Add a small delay to avoid overwhelming the API
  sleep 0.2
done

echo "Import completed!"
echo "Total rows processed: $total_rows"
echo "Skipped (already processed): $skipped_processed"
echo "Skipped (empty ID): $skipped_empty_id"
echo "Successfully inserted: $successful_inserts"
echo "Failed inserts: $failed_inserts"