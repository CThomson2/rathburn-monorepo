-- Script to update database function definitions with new schema-prefixed table names
-- For each function that needs updating, this template shows the pattern

-- 1. Example for updating add_to_repro_drum function
-- First, get the current function definition
-- SELECT pg_get_functiondef(oid) 
-- FROM pg_proc 
-- WHERE proname = 'add_to_repro_drum' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Then create the updated function with schema-prefixed table references
CREATE OR REPLACE FUNCTION inventory.add_to_repro_drum(distillation_id integer, repro_material character varying, volume_to_add integer)
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
    target_drum_id INTEGER;
    remaining_capacity INTEGER;
BEGIN
    -- Find a suitable drum of the given material type with enough capacity
    SELECT repro_drum_id, (capacity - current_volume) AS remaining_capacity
    INTO target_drum_id, remaining_capacity
    FROM inventory.repro_drums rd
    WHERE rd.material_type = repro_material
      AND rd.capacity - rd.current_volume >= volume_to_add
      AND rd.status = 'partial'  -- Ensure we only add to drums that are available for more material
    ORDER BY rd.current_volume ASC  -- Prioritize the drum with the least amount of material
    LIMIT 1;

    -- If no suitable drum is found, raise an exception or handle as needed
    IF target_drum_id IS NULL THEN
        RAISE EXCEPTION 'No available repro drum with enough capacity for material type % and volume %', repro_material, volume_to_add;
    END IF;

    -- Update the selected drum's current volume
    UPDATE inventory.repro_drums
    SET current_volume = current_volume + volume_to_add,
        updated_at = CURRENT_TIMESTAMP
    WHERE repro_drum_id = target_drum_id;

    -- Record this addition in the repro_additions table
    INSERT INTO inventory.repro_additions (
        repro_drum_id, 
        distillation_id, 
        date_added,
        volume_added, 
        volume_in_drum
    )
    SELECT 
        target_drum_id,
        distillation_id,
        CURRENT_DATE,
        volume_to_add,
        current_volume
    FROM inventory.repro_drums
    WHERE repro_drum_id = target_drum_id;
END;
$function$;

-- 2. Example for updating delete_expired_notifications function
CREATE OR REPLACE FUNCTION logs.delete_expired_notifications()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    DELETE FROM logs.notifications WHERE expires_at IS NOT NULL AND expires_at < NOW();
    RETURN NULL; -- This ensures the function doesn't return anything
END;
$function$;

-- 3. Example for updating mass_to_volume function
CREATE OR REPLACE FUNCTION inventory.mass_to_volume(material_id integer, weight numeric)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
AS $function$
DECLARE
    density NUMERIC;
BEGIN
    SELECT density INTO density FROM stock_control.raw_materials rm WHERE rm.material_id = material_id;
    RETURN weight / density;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        -- RAISE EXCEPTION 'Material not found';
        RETURN 200;
END;
$function$;

-- Continue with the rest of your functions following this pattern
-- For each function:
-- 1. Get its definition
-- 2. Update table references to include appropriate schemas
-- 3. Create or replace the function in its new schema location

-- Drop old functions after successfully creating the new ones (optional)
-- DROP FUNCTION IF EXISTS public.add_to_repro_drum(integer, character varying, integer);
-- DROP FUNCTION IF EXISTS public.delete_expired_notifications();
-- DROP FUNCTION IF EXISTS public.mass_to_volume(integer, numeric); 