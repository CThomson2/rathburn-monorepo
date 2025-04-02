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

CSV_FILE="apps/rathburn-app/src/app/(routes)/stock-count/data.csv"

# Check if the CSV file exists
if [ ! -f "$CSV_FILE" ]; then
  echo "Error: CSV file not found at $CSV_FILE"
  exit 1
fi

echo "Starting import of drums data to Supabase..."
echo "Using Supabase URL: $NEXT_PUBLIC_SUPABASE_URL"

# Skip the header line and process each row
tail -n +2 "$CSV_FILE" | while IFS=, read -r oldId material batchCode supplier status; do
  # Trim whitespace
  oldId=$(echo "$oldId" | xargs)
  material=$(echo "$material" | xargs)
  batchCode=$(echo "$batchCode" | xargs)
  supplier=$(echo "$supplier" | xargs)
  status=$(echo "$status" | xargs)
  
  # Handle empty values
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
  
  # Create JSON payload
  JSON_DATA="{\"oldId\":\"$oldId\",\"material\":\"$material\",\"batchCode\":$batchCode,\"supplier\":$supplier,\"status\":\"$status\"}"
  
  # Send data to Supabase
  echo "Inserting drum with oldId: $oldId, material: $material"
  
  curl -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/drums" \
    -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
    -H "Authorization: Bearer $NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=minimal" \
    -d "$JSON_DATA"
    
  # Add a small delay to avoid overwhelming the API
  sleep 0.2
done

echo "Import completed!" 