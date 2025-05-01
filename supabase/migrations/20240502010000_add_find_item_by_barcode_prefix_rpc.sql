-- Migration: add_find_item_by_barcode_prefix_rpc
-- Description: Adds an RPC function to efficiently find materials or suppliers by the first 10 chars of their UUID.

-- Function to find material or supplier based on barcode prefix (first 10 chars of UUID)
CREATE OR REPLACE FUNCTION find_item_by_barcode_prefix(p_barcode_prefix TEXT)
RETURNS TABLE (
    item_type TEXT,
    item_id UUID
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_material_id UUID;
    v_supplier_id UUID;
BEGIN
    -- Ensure prefix is not empty and has the expected length (10)
    IF p_barcode_prefix IS NULL OR LENGTH(p_barcode_prefix) != 10 THEN
        -- Return empty if prefix is invalid
        RETURN;
    END IF;

    -- Try to find a material
    SELECT
        m.material_id
    INTO
        v_material_id
    FROM
        inventory.materials m
    WHERE
        m.material_id::text LIKE p_barcode_prefix || '%' -- Use LIKE with wildcard
    LIMIT 1;

    IF FOUND THEN
        item_type := 'material';
        item_id := v_material_id;
        RETURN NEXT;
        RETURN; -- Exit after finding a material
    END IF;

    -- If no material found, try to find a supplier
    SELECT
        s.supplier_id
    INTO
        v_supplier_id
    FROM
        inventory.suppliers s
    WHERE
        s.supplier_id::text LIKE p_barcode_prefix || '%' -- Use LIKE with wildcard
    LIMIT 1;

    IF FOUND THEN
        item_type := 'supplier';
        item_id := v_supplier_id;
        RETURN NEXT;
        RETURN; -- Exit after finding a supplier
    END IF;

    -- If nothing found, return empty
    RETURN;
END;
$$;

COMMENT ON FUNCTION find_item_by_barcode_prefix(TEXT) IS 'Searches materials and suppliers tables for an entry whose UUID (cast to text) starts with the given 10-char prefix. Returns the type (material/supplier) and ID if found.'; 