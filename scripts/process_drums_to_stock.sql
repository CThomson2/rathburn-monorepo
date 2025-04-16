-- Process data from drums table to stock_repro table
-- This script aggregates drums data and inserts into stock_repro

-- Begin transaction
BEGIN;

-- First create a temporary table to map any unmapped material codes
-- This allows manual inspection and correction before final insert
CREATE TEMP TABLE material_code_mapping AS
WITH drum_codes AS (
  SELECT DISTINCT material_code
  FROM public.drums
  WHERE status = 'R'
),
ref_codes AS (
  SELECT DISTINCT code
  FROM public.ref_materials
)
SELECT 
  d.material_code,
  (SELECT code FROM public.ref_materials WHERE code = d.material_code) AS matched_code,
  (d.material_code NOT IN (SELECT code FROM public.ref_materials)) AS needs_mapping
FROM drum_codes d;

-- Display unmapped codes for review
SELECT 
  material_code,
  matched_code,
  needs_mapping
FROM material_code_mapping
ORDER BY needs_mapping DESC, material_code;

-- Group drums by material_code and site (location), and count quantity
INSERT INTO public.stock_repro (
  location,
  material_code,
  quantity,
  notes
)
SELECT 
  d.site as location,
  d.material_code,
  COUNT(*) as quantity,
  'Imported from legacy system on ' || NOW()::date as notes
FROM 
  public.drums d
INNER JOIN
  -- Only include material codes that exist in ref_materials
  public.ref_materials rm ON d.material_code = rm.code
WHERE
  d.status = 'R'  -- Only process Repro drums
GROUP BY 
  d.site, d.material_code;

-- Report on how many drums could not be processed due to missing material code mappings
SELECT
  d.material_code,
  COUNT(*) as drum_count
FROM
  public.drums d
LEFT JOIN
  public.ref_materials rm ON d.material_code = rm.code
WHERE
  d.status = 'R' AND
  rm.code IS NULL
GROUP BY
  d.material_code
ORDER BY
  drum_count DESC;

-- Commit transaction
COMMIT;

-- Status report of what was inserted
SELECT 
  sr.location, 
  sr.material_code,
  rm.value as material_name, 
  sr.quantity,
  sr.created_at
FROM 
  public.stock_repro sr
LEFT JOIN 
  public.ref_materials rm ON sr.material_code = rm.code
WHERE 
  sr.created_at >= NOW() - INTERVAL '1 hour'
ORDER BY 
  sr.location, sr.material_code; 