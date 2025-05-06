-- Fix database ownership and permissions for stocktake_scans

-- 1. First, completely disable RLS for easier troubleshooting
ALTER TABLE stocktake_scans DISABLE ROW LEVEL SECURITY;

-- 2. Make sure the table is in the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE stocktake_scans;

-- 3. Grant explicit permissions to everyone to ensure access
GRANT ALL ON TABLE stocktake_scans TO authenticated;
GRANT ALL ON TABLE stocktake_scans TO anon;
GRANT ALL ON TABLE stocktake_scans TO service_role;
GRANT ALL ON TABLE stocktake_scans TO postgres;

-- 4. If view exists, grant permissions on it too
GRANT ALL ON TABLE stocktake_scan_details TO authenticated;
GRANT ALL ON TABLE stocktake_scan_details TO anon;
GRANT ALL ON TABLE stocktake_scan_details TO service_role;
GRANT ALL ON TABLE stocktake_scan_details TO postgres;

-- 5. To verify the table ownership
SELECT tableowner 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'stocktake_scans';

-- 6. For sequences related to this table
DO $$ 
DECLARE
    seq_name text;
BEGIN
    FOR seq_name IN 
        SELECT sequence_name
        FROM information_schema.sequences
        WHERE sequence_schema = 'public'
    LOOP
        EXECUTE format('GRANT ALL ON SEQUENCE %I TO authenticated, anon, service_role', seq_name);
    END LOOP;
END $$;

-- 7. Log table info for debugging
SELECT 
    relname AS table_name,
    relowner::regrole AS table_owner,
    relacl AS access_privileges
FROM 
    pg_class
WHERE 
    relname = 'stocktake_scans' AND relnamespace = 'public'::regnamespace;

-- 8. Make sure the user running the app has proper access
GRANT usage ON SCHEMA public TO service_role;
GRANT usage ON SCHEMA public TO authenticated;
GRANT usage ON SCHEMA public TO anon;

-- IMPORTANT: If you had migrations that created this table, some permissions may be reset when
-- you run migrations again. Consider adding these permission grants to your migration files. 