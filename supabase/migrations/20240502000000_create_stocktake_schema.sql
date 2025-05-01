-- Migration: create_stocktake_schema
-- Description: Sets up tables, views, functions, and triggers for the stocktake feature.

-- 1. Create stocktake_sessions table in public schema
CREATE TABLE public.stocktake_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.stocktake_sessions IS 'Stores individual stock take sessions with metadata and status.';
COMMENT ON COLUMN public.stocktake_sessions.created_by IS 'User who initiated the stocktake session.';

-- Enable RLS for stocktake_sessions
ALTER TABLE public.stocktake_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for stocktake_sessions (Example: Users can manage their own sessions)
CREATE POLICY "Allow users to manage their own sessions" ON public.stocktake_sessions
    FOR ALL
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Allow authenticated users read access" ON public.stocktake_sessions
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- 2. Create stocktake_scans table in logs schema
CREATE TABLE logs.stocktake_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stocktake_session_id UUID NOT NULL REFERENCES public.stocktake_sessions(id) ON DELETE CASCADE,
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    device_id UUID REFERENCES logs.devices(device_id), -- Assuming logs.devices table exists
    raw_barcode TEXT NOT NULL,
    barcode_type VARCHAR(50) NOT NULL CHECK (barcode_type IN ('material', 'supplier', 'unknown', 'error')),
    material_id UUID REFERENCES inventory.materials(material_id), -- Assuming inventory.materials table exists
    supplier_id UUID REFERENCES inventory.suppliers(supplier_id), -- Assuming inventory.suppliers table exists
    status VARCHAR(50) NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'error', 'ignored')),
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now() -- Redundant with scanned_at, but useful for tracking record creation
);

COMMENT ON TABLE logs.stocktake_scans IS 'Records each individual barcode scan event during a stocktake session.';
COMMENT ON COLUMN logs.stocktake_scans.device_id IS 'Identifier for the device performing the scan.';
COMMENT ON COLUMN logs.stocktake_scans.barcode_type IS 'Type of item identified by the barcode (material, supplier, or unknown/error).';
COMMENT ON COLUMN logs.stocktake_scans.material_id IS 'FK to the identified material, if applicable.';
COMMENT ON COLUMN logs.stocktake_scans.supplier_id IS 'FK to the identified supplier, if applicable.';

-- Enable RLS for stocktake_scans
ALTER TABLE logs.stocktake_scans ENABLE ROW LEVEL SECURITY;

-- Policies for stocktake_scans (Example: Users can insert scans and view scans from their sessions)
CREATE POLICY "Allow users to insert their own scans" ON logs.stocktake_scans
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to view scans from their sessions" ON logs.stocktake_scans
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.stocktake_sessions s
        WHERE s.id = logs.stocktake_scans.stocktake_session_id AND s.created_by = auth.uid()
    ));

-- Add Indexes for performance
CREATE INDEX idx_stocktake_scans_session ON logs.stocktake_scans(stocktake_session_id);
CREATE INDEX idx_stocktake_scans_material ON logs.stocktake_scans(material_id);
CREATE INDEX idx_stocktake_scans_supplier ON logs.stocktake_scans(supplier_id);
CREATE INDEX idx_stocktake_scans_scanned_at ON logs.stocktake_scans(scanned_at);
CREATE INDEX idx_stocktake_scans_user ON logs.stocktake_scans(user_id);

-- 3. Create Materialized View for real-time counts
CREATE MATERIALIZED VIEW public.stocktake_material_counts AS
SELECT
    ss.id as session_id,
    ss.name as session_name,
    ss.status as session_status,
    m.material_id as material_id, -- Changed from id to material_id
    m.code as material_code,
    m.name as material_name,
    COUNT(s.id) FILTER (WHERE s.status = 'success' AND s.barcode_type = 'material') as scan_count, -- Only count successful material scans
    MIN(s.scanned_at) FILTER (WHERE s.status = 'success' AND s.barcode_type = 'material') as first_scan,
    MAX(s.scanned_at) FILTER (WHERE s.status = 'success' AND s.barcode_type = 'material') as last_scan,
    CASE
        WHEN COUNT(s.id) FILTER (WHERE s.status = 'success' AND s.barcode_type = 'material') = 0 THEN 'not_started'
        WHEN ss.status = 'completed' THEN 'completed'
        WHEN COUNT(s.id) FILTER (WHERE s.status = 'success' AND s.barcode_type = 'material') > 0 THEN 'in_progress'
        ELSE 'unknown' -- Should not happen if session status is handled
    END as material_status
FROM public.stocktake_sessions ss
CROSS JOIN inventory.materials m -- Assuming inventory.materials exists
LEFT JOIN logs.stocktake_scans s ON s.stocktake_session_id = ss.id AND s.material_id = m.material_id
GROUP BY ss.id, ss.name, ss.status, m.material_id, m.code, m.name;

-- Add a UNIQUE INDEX required for CONCURRENT refreshes
CREATE UNIQUE INDEX stocktake_material_counts_unique_idx 
ON public.stocktake_material_counts (session_id, material_id);

COMMENT ON MATERIALIZED VIEW public.stocktake_material_counts IS 'Real-time updated view of successful material scan counts per session.';

-- 4. Create Refresh Function for the Materialized View
CREATE OR REPLACE FUNCTION public.refresh_stocktake_material_counts()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Consider adding logging here in the future if needed
    -- RAISE LOG 'Refreshing stocktake_material_counts view';
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.stocktake_material_counts;
    RETURN NULL; -- Result is ignored since this is an AFTER trigger
END;
$$;

COMMENT ON FUNCTION public.refresh_stocktake_material_counts() IS 'Refreshes the stocktake_material_counts materialized view. SECURITY DEFINER.';

-- 5. Create Trigger to auto-refresh the Materialized View
CREATE TRIGGER refresh_stocktake_counts_trigger
AFTER INSERT OR UPDATE OR DELETE ON logs.stocktake_scans
FOR EACH STATEMENT -- Refresh once per statement, not per row
EXECUTE FUNCTION public.refresh_stocktake_material_counts();

COMMENT ON TRIGGER refresh_stocktake_counts_trigger ON logs.stocktake_scans IS 'Automatically refreshes the stocktake material counts view after scans are modified.';

-- Note: The `get_stocktake_stats` function from the previous migration is omitted for now,
-- as stats can be derived from the materialized view or direct queries. It can be added later if needed.

-- Note: The previous `public.stock_count` table and `increment_stock_count` function are considered
-- deprecated for this workflow and are not modified or used by this migration. 


supabase migration repair --status reverted 20250422230846;
supabase migration repair --status reverted 20250424084729;
supabase migration repair --status reverted 20250424084748;
supabase migration repair --status reverted 20250424084802;
supabase migration repair --status reverted 20250424113741;
supabase migration repair --status reverted 20250424113751;
supabase migration repair --status reverted 20250424114208;
supabase migration repair --status reverted 20250425082408;
supabase migration repair --status reverted 20250427085840;
supabase migration repair --status reverted 20250428062422;
supabase migration repair --status reverted 20250430070846;
supabase migration repair --status reverted 20250430070859;
supabase migration repair --status reverted 20250430070912;
supabase migration repair --status reverted 20250430070924;
supabase migration repair --status reverted 20250430070944;
supabase migration repair --status reverted 20250430071243;
supabase migration repair --status reverted 20250430102357;
supabase migration repair --status reverted 20250501074119;
supabase migration repair --status reverted 20250501074335;
supabase migration repair --status applied 20240502000000;