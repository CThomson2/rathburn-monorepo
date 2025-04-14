-- lib/migrations/barcode-schema.sql
-- Migration script for barcode scanning system

-- Create the logs.drum_scan table for storing barcode scan events
CREATE TABLE IF NOT EXISTS logs.drum_scan (
  id SERIAL PRIMARY KEY,
  scan_id TEXT UNIQUE NOT NULL,  -- The actual barcode value
  scanner_id TEXT,               -- Identifier for the scanner device
  scan_timestamp TIMESTAMPTZ DEFAULT NOW(), -- When the scan occurred
  scan_location TEXT,            -- Where the scan occurred
  scan_type TEXT,                -- Type of scan
  metadata JSONB,                -- Additional data as JSON
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on scan_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_logs.drum_scan_scan_id ON logs.drum_scan(scan_id);

-- Create index on scan_timestamp for time-based queries
CREATE INDEX IF NOT EXISTS idx_logs.drum_scan_timestamp ON logs.drum_scan(scan_timestamp);

-- Create index on scanner_id for filtering by device
CREATE INDEX IF NOT EXISTS idx_logs.drum_scan_scanner_id ON logs.drum_scan(scanner_id);

-- Create index on scan_type for filtering by scan type
CREATE INDEX IF NOT EXISTS idx_logs.drum_scan_type ON logs.drum_scan(scan_type);

-- Create index on scan_location for filtering by location
CREATE INDEX IF NOT EXISTS idx_logs.drum_scan_location ON logs.drum_scan(scan_location);

-- Optional: Create a view for common queries
CREATE OR REPLACE VIEW view_recent_scans AS
SELECT 
  id,
  scan_id,
  scanner_id,
  scan_timestamp,
  scan_location,
  scan_type,
  metadata,
  created_at
FROM logs.drum_scan
ORDER BY scan_timestamp DESC
LIMIT 100;

-- Optional: Add a function to handle scan insertion with additional logic
CREATE OR REPLACE FUNCTION insert_scan_with_validation()
RETURNS TRIGGER AS $$
BEGIN
  -- Additional validation could be added here
  -- For example, checking if the scan_id follows a specific format
  
  -- Example: Ensure scan_id is alphanumeric (simplified version)
  IF NEW.scan_id !~ '^[A-Za-z0-9]+$' THEN
    RAISE EXCEPTION 'scan_id must be alphanumeric';
  END IF;
  
  -- Example: Set default scanner_id if not provided
  IF NEW.scanner_id IS NULL THEN
    NEW.scanner_id := 'UNKNOWN';
  END IF;
  
  -- Ensure timestamp is set
  IF NEW.scan_timestamp IS NULL THEN
    NEW.scan_timestamp := NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run the validation function before insert
CREATE OR REPLACE TRIGGER trigger_validate_scan
BEFORE INSERT ON logs.drum_scan
FOR EACH ROW
EXECUTE FUNCTION insert_scan_with_validation();

-- Optional: Add a function to log scan changes
CREATE OR REPLACE FUNCTION log_scan_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Here you could insert a record into an audit table
  -- For this example, we'll just use a simple raise notice
  RAISE NOTICE 'Scan % has been modified', NEW.scan_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to log changes after update
CREATE OR REPLACE TRIGGER trigger_log_scan_changes
AFTER UPDATE ON logs.drum_scan
FOR EACH ROW
EXECUTE FUNCTION log_scan_changes();