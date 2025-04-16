-- Create a trigger function to process drum scans
CREATE OR REPLACE FUNCTION process_drum_scan()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle different scan types with appropriate actions
    IF NEW.scan_type = 'intake' THEN
        -- Update stock_drum to show item is in inventory
        UPDATE stock_drum 
        SET status = 'in_stock', 
            location_id = (SELECT location_id FROM worker WHERE worker_id = NEW.worker_id),
            last_updated = NOW()
        WHERE drum_id = NEW.drum_id;
        
    ELSIF NEW.scan_type = 'transport' THEN
        -- Update location but maintain status
        UPDATE stock_drum 
        SET location_id = (SELECT location_id FROM worker WHERE worker_id = NEW.worker_id),
            last_updated = NOW()
        WHERE drum_id = NEW.drum_id;
        
    ELSIF NEW.scan_type = 'distillation_loading' THEN
        -- Update status to show drum is being processed
        UPDATE stock_drum 
        SET status = 'in_processing',
            processing_start = NOW(),
            last_updated = NOW()
        WHERE drum_id = NEW.drum_id;
        
    -- Add other scan types as needed
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_scan_insert
AFTER INSERT ON logs.drum_scan
FOR EACH ROW
EXECUTE FUNCTION process_drum_scan();

-- Create a view to show the current state of each drum
CREATE VIEW view_drum_current_state AS
SELECT 
    d.drum_id,
    d.material_id,
    d.batch_code,
    d.supplier_id,
    s.scan_type AS last_operation,
    s.scanned_at AS last_operation_time,
    s.worker_id AS last_worker,
    -- Additional fields as needed
FROM stock_drum d
JOIN (
    SELECT DISTINCT ON (drum_id) 
        drum_id, 
        scan_type, 
        scanned_at, 
        worker_id
    FROM logs.drum_scan
    ORDER BY drum_id, scanned_at DESC
) s ON d.drum_id = s.drum_id;

-- Create a view to show the summary of scan activity
CREATE VIEW view_scan_activity_summary AS
SELECT 
    DATE(scanned_at) AS scan_date,
    scan_type,
    COUNT(*) AS scan_count,
    COUNT(DISTINCT drum_id) AS unique_drums,
    COUNT(DISTINCT worker_id) AS unique_workers
FROM logs.drum_scan
GROUP BY scan_date, scan_type
ORDER BY scan_date DESC, scan_type;