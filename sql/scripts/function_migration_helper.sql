-- Function Migration Helper Script

-- 1. List all functions in the 'public' schema that need to be migrated
SELECT 
    p.proname AS function_name,
    pg_get_function_identity_arguments(p.oid) AS function_args,
    n.nspname AS schema_name,
    CASE 
        WHEN p.proname LIKE '%stock%' OR p.proname LIKE '%inventory%' OR p.proname LIKE '%drum%' THEN 'inventory'
        WHEN p.proname LIKE '%notification%' OR p.proname LIKE '%log%' THEN 'logs' 
        WHEN p.proname LIKE '%user%' OR p.proname LIKE '%auth%' THEN 'auth_ext'
        WHEN p.proname LIKE '%order%' OR p.proname LIKE '%supplier%' THEN 'orders'
        WHEN p.proname LIKE '%distillation%' OR p.proname LIKE '%production%' THEN 'production'
        ELSE 'public'
    END AS suggested_schema
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname NOT IN ('trg_timestamp')  -- Skip standard utility functions that should stay in public
ORDER BY function_name;

-- 2. Generate command to get function definition for each function
SELECT 
    'SELECT ''-- Function: ' || p.proname || E'\''; SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = ''' 
    || p.proname || ''' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = ''' 
    || n.nspname || ''');' AS get_function_cmd
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname NOT IN ('trg_timestamp')
ORDER BY p.proname;

-- 3. Generate drop function commands for after migration
SELECT 
    'DROP FUNCTION IF EXISTS ' || n.nspname || '.' || p.proname || '(' 
    || pg_get_function_identity_arguments(p.oid) || ');' AS drop_function_cmd
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname NOT IN ('trg_timestamp')
ORDER BY p.proname;

-- 4. Helper table for schema mapping of common table names
SELECT 'Creating temp table with table name mappings...' AS info;

-- Create temporary table with mappings
CREATE TEMP TABLE table_schema_mapping (
    old_table TEXT,
    new_table TEXT
);

-- Insert mappings 
INSERT INTO table_schema_mapping VALUES
('drums', 'stock_control.drums'),
('stock_drum', 'inventory.stock_drum'),
('stock_new', 'inventory.stock_new'),
('stock_repro', 'inventory.stock_repro'),
('stock_history', 'public.stock_history'),
('stock_order', 'public.stock_order'),
('order_detail', 'public.order_detail'),
('notification', 'logs.notification'),
('notifications', 'logs.notifications'),
('distillation_schedule', 'production.distillation_schedule'),
('distillation_pending_assignment', 'inventory.distillation_pending_assignment'),
('user_profiles', 'auth_ext.user_profiles'),
('worker_passcodes', 'auth_ext.worker_passcodes'),
('active_context', 'production.active_context'),
('ref_materials', 'public.ref_materials'),
('ref_suppliers', 'public.ref_suppliers'),
('ref_supplier_material', 'public.ref_supplier_material'),
('ref_labs', 'config.ref_labs'),
('ref_stills', 'config.ref_stills'),
('repro_drums', 'inventory.repro_drums'),
('repro_additions', 'inventory.repro_additions'),
('product_prices', 'config.product_prices');

-- Select the mapping table
SELECT * FROM table_schema_mapping ORDER BY old_table;

-- 5. Instructions for manual migration
SELECT 
E'-- Migration process:\n' ||
E'-- 1. For each function, get its definition using the generated command\n' ||
E'-- 2. Replace table references using the mapping table\n' ||
E'-- 3. Create the function in the new schema\n' ||
E'-- 4. Test the function to ensure it works correctly\n' ||
E'-- 5. Drop the old function using the generated drop command\n' ||
E'-- \n' ||
E'-- Example workflow:\n' ||
E'-- ```\n' ||
E'-- -- Get function definition\n' ||
E'-- SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = \'add_to_repro_drum\' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = \'public\');\n' ||
E'-- \n' ||
E'-- -- Create updated function in new schema with table references updated\n' ||
E'-- CREATE OR REPLACE FUNCTION inventory.add_to_repro_drum(...) ... \n' ||
E'-- \n' ||
E'-- -- Test the function works\n' ||
E'-- SELECT inventory.add_to_repro_drum(...);\n' ||
E'-- \n' ||
E'-- -- Drop old function\n' ||
E'-- DROP FUNCTION IF EXISTS public.add_to_repro_drum(...);\n' ||
E'-- ```' AS instructions; 