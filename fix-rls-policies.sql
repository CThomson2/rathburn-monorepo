-- Fix RLS policies for stocktake_scans and stocktake_scan_details

-- 1. First, make sure the table is in the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE stocktake_scans;

-- 2. Revise the RLS policies for stocktake_scans to ensure proper access
-- Drop conflicting policies if they exist (using IF EXISTS)
DROP POLICY IF EXISTS "Allow anonymous read access to stocktake scans" ON stocktake_scans;
DROP POLICY IF EXISTS "Enable read access for all users" ON stocktake_scans;
DROP POLICY IF EXISTS "Allow authenticated and anon users to insert into stocktake_scans" ON stocktake_scans;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON stocktake_scans;

-- Create clear, consistent policies
-- SELECT policy for authenticated users
CREATE POLICY "Allow authenticated users to select scans" 
ON stocktake_scans FOR SELECT 
TO authenticated 
USING (true);

-- SELECT policy for public/anon access
CREATE POLICY "Allow public read access to stocktake scans" 
ON stocktake_scans FOR SELECT 
TO anon 
USING (true);

-- INSERT policy for authenticated users
CREATE POLICY "Allow authenticated users to insert scans" 
ON stocktake_scans FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 3. Set up policies for the stocktake_scan_details view
-- Give view access to authenticated users
GRANT SELECT ON public.stocktake_scan_details TO authenticated;
GRANT SELECT ON public.stocktake_scan_details TO anon;

-- 4. Ensure REALTIME is properly set up for both the table and view
COMMENT ON TABLE stocktake_scans IS 'Records individual barcode scan events. Enabled for realtime.';

-- 5. Reset RLS settings to ensure correct application
ALTER TABLE stocktake_scans DISABLE ROW LEVEL SECURITY;
ALTER TABLE stocktake_scans ENABLE ROW LEVEL SECURITY; 