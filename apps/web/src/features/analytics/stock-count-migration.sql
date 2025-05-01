-- Stock take sessions table
CREATE TABLE stocktake_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'in_progress',
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    created_by UUID NOT NULL,
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Stock take scans table
CREATE TABLE stocktake_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stocktake_session_id UUID REFERENCES stocktake_sessions(id),
    material_id UUID REFERENCES inventory.materials(id),
    material_code VARCHAR(50) NOT NULL,
    material_name VARCHAR(255) NOT NULL,
    drum_id VARCHAR(100) NOT NULL,
    scanned_at TIMESTAMPTZ NOT NULL,
    device_id VARCHAR(255),
    user_id VARCHAR(100) NOT NULL,
    sequence_number INTEGER,
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for frequently queried fields
CREATE INDEX idx_stocktake_scans_session ON stocktake_scans(stocktake_session_id);
CREATE INDEX idx_stocktake_scans_material ON stocktake_scans(material_id);
CREATE INDEX idx_stocktake_scans_drum ON stocktake_scans(drum_id);
CREATE INDEX idx_stocktake_scans_scanned_at ON stocktake_scans(scanned_at);

-- Materialized view for real-time counts
CREATE MATERIALIZED VIEW IF NOT EXISTS stocktake_material_counts AS
SELECT 
    ss.id as session_id,
    ss.name as session_name,
    ss.status as session_status,
    m.id as material_id,
    m.code as material_code,
    m.name as material_name,
    COUNT(s.id) as scan_count,
    MIN(s.scanned_at) as first_scan,
    MAX(s.scanned_at) as last_scan,
    CASE 
        WHEN COUNT(s.id) = 0 THEN 'not_started'
        WHEN COUNT(s.id) > 0 AND ss.status = 'in_progress' THEN 'in_progress'
        WHEN ss.status = 'completed' THEN 'completed'
        ELSE 'unknown'
    END as material_status
FROM stocktake_sessions ss
CROSS JOIN inventory.materials m
LEFT JOIN stocktake_scans s ON s.stocktake_session_id = ss.id AND s.material_id = m.id
GROUP BY ss.id, ss.name, ss.status, m.id, m.code, m.name;

-- Refresh function for the materialized view
CREATE OR REPLACE FUNCTION refresh_stocktake_material_counts()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY stocktake_material_counts;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-refresh the materialized view
CREATE TRIGGER refresh_stocktake_counts
AFTER INSERT OR UPDATE OR DELETE ON stocktake_scans
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_stocktake_material_counts();

-- Function to get current stocktake statistics
CREATE OR REPLACE FUNCTION get_stocktake_stats(session_id UUID)
RETURNS TABLE (
    total_scans BIGINT,
    materials_with_scans BIGINT,
    total_materials BIGINT,
    completion_percentage NUMERIC,
    scan_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM stocktake_scans WHERE stocktake_session_id = session_id) as total_scans,
        (SELECT COUNT(DISTINCT material_id) FROM stocktake_scans WHERE stocktake_session_id = session_id) as materials_with_scans,
        (SELECT COUNT(*) FROM inventory.materials) as total_materials,
        ROUND(
            (SELECT COUNT(DISTINCT material_id)::NUMERIC FROM stocktake_scans WHERE stocktake_session_id = session_id) /
            NULLIF((SELECT COUNT(*)::NUMERIC FROM inventory.materials), 0) * 100,
            2
        ) as completion_percentage,
        COALESCE(
            (SELECT COUNT(*) FROM stocktake_scans WHERE stocktake_session_id = session_id) /
            NULLIF(EXTRACT(EPOCH FROM (NOW() - (SELECT started_at FROM stocktake_sessions WHERE id = session_id)))/3600, 0),
            0
        ) as scan_rate;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE stocktake_sessions IS 'Stores individual stock take sessions with metadata';
COMMENT ON TABLE stocktake_scans IS 'Records each individual drum scan during a stock take';
COMMENT ON MATERIALIZED VIEW stocktake_material_counts IS 'Real-time updated view of scan counts per material';
COMMENT ON FUNCTION get_stocktake_stats IS 'Returns comprehensive statistics for a stock take session';

-- Example insertion statements
-- INSERT INTO stocktake_sessions (name, created_by) 
-- VALUES ('Initial Inventory Scan 2024', '00000000-0000-0000-0000-000000000000');

-- Example to refresh the materialized view
-- REFRESH MATERIALIZED VIEW CONCURRENTLY stocktake_material_counts;