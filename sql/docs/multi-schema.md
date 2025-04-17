# Supabase Schema Reorganization Strategy

## Current Challenge

Based on the exploration of your Supabase project, we can see that all tables are currently in the `public` schema, which is causing context limit issues with Cursor IDE. This document provides recommendations for reorganizing your database schema to improve maintainability and resolve these context limitations.

## Proposed Schema Structure

Below is a recommended schema organization that separates tables based on domain functionality, access patterns, and natural groupings:

### 1. `public` Schema

Keep only core business entities that represent the central data model here:

- Primary inventory tables
- Key user-related tables
- Core business domain tables

This schema should contain the minimum tables needed to understand the core business model.

### 2. `inventory` Schema

Tables specifically related to inventory management:

- Inventory tracking
- Stock levels
- Drum management
- Material definitions
- Chemical classifications

### 3. `orders` Schema

Tables related to order processing:

- Purchase orders
- Order details
- Order history
- Supplier information
- Order status tracking

### 4. `auth_ext` Schema

Extended authentication and authorization information (beyond what's in Supabase's built-in `auth` schema):

- User profiles
- Role definitions
- Permissions
- User settings
- User activity logs

### 5. `analytics` Schema

Tables for reporting and analytics:

- Materialized views
- Aggregation tables
- Historical data for reporting
- Dashboard data sources

### 6. `logs` Schema

Audit logs and system tracking:

- Operation logs
- Change history
- Audit trails
- System events

### 7. `archive` Schema

Obsolete or historical data that's rarely accessed:

- Deprecated tables
- Historical data kept for compliance
- Legacy structures

### 8. `config` Schema

Configuration and reference data:

- System settings
- Reference tables
- Lookup values
- Configuration parameters

## Migration Strategy

### 1. Schema Creation

```sql
-- Create new schemas
CREATE SCHEMA IF NOT EXISTS inventory;
CREATE SCHEMA IF NOT EXISTS orders;
CREATE SCHEMA IF NOT EXISTS auth_ext;
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS logs;
CREATE SCHEMA IF NOT EXISTS archive;
CREATE SCHEMA IF NOT EXISTS config;
```

### 2. Table Migration Approach

For each table to be moved:

1. Create the table in the new schema with the same structure
2. Copy data from the old table to the new table
3. Create any necessary indexes and constraints
4. Verify data integrity
5. Update dependencies (views, functions, etc.)
6. Drop the original table or rename it with a prefix like `obsolete_`

| table_name                      | row_count |
| ------------------------------- | --------- |
| stock_drum                      | 4771      |
| stock_history                   | 2640      |
| raw_stock_history               | 2640      |
| order_detail                    | 302       |
| product_prices                  | 279       |
| stock_order                     | 188       |
| stock_new                       | 170       |
| ref_materials                   | 95        |
| stock_repro                     | 64        |
| ref_suppliers                   | 45        |
| ref_stills                      | 15        |
| ref_labs                        | 4         |
| distillation_schedule           | 1         |
| distillation_schedule_items     | 0         |
| distillation_pending_assignment | 0         |
| ref_supplier_material           | 0         |
| distillation_record             | 0         |
| notification                    | 0         |
| active_context                  | 0         |
| worker_passcodes                | 0         |
| stock_activity                  | 0         |
| order_detail_stock_activity     | 0         |
| stock_drum_new                  | 0         |

Example migration script pattern:

```sql
-- Create table in new schema
CREATE TABLE inventory.drum (
  -- Same structure as public.drum
) INHERITS (public.drum);

-- Copy data
INSERT INTO inventory.drum
SELECT * FROM public.drum;

-- Create indexes and constraints
CREATE INDEX idx_drum_id ON inventory.drum(id);
ALTER TABLE inventory.drum ADD PRIMARY KEY (id);

-- Set up foreign keys
ALTER TABLE inventory.drum
  ADD CONSTRAINT fk_drum_material
  FOREIGN KEY (material_id)
  REFERENCES inventory.material(id);

-- Verify row count matches
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM public.drum) != (SELECT COUNT(*) FROM inventory.drum) THEN
    RAISE EXCEPTION 'Data count mismatch';
  END IF;
END $$;

-- Rename original table
ALTER TABLE public.drum RENAME TO obsolete_drum;
```

### 3. View and Function Updates

For each view and function:

1. Create a new version in the appropriate schema
2. Update references to point to new table locations
3. Test the new view/function
4. Replace references to the old view/function

### 4. Access Control Updates

Update RLS policies to reflect the new schema organization:

```sql
-- Example policy update
CREATE POLICY "Users can view their own data"
ON auth_ext.user_profiles
FOR SELECT
USING (auth.uid() = user_id);
```

### 5. Application Code Updates

Update your application code to reference the new schema locations:

```typescript
// Before
const { data, error } = await supabase
  .from("drum")
  .select("*")
  .eq("id", drumId);

// After
const { data, error } = await supabase
  .from("inventory.drum")
  .select("*")
  .eq("id", drumId);
```

## Recommended Table Assignments

Based on the partial schema information available, here's a recommended assignment of tables to schemas:

### `public` Schema (Core Business)

- `user_profiles`
- `user_roles`
- `materials` (if this is a core master list)
- `suppliers`
- Other essential business tables

### `inventory` Schema

- `drum`
- `drum_details`
- `chemical_inventory`
- `material_storage`
- `drum_location`
- `material_type`
- `inventory_adjustment`

### `orders` Schema

- `purchase_order`
- `purchase_order_line`
- `order_status`
- `delivery`
- `shipment`

### `auth_ext` Schema

- `worker_passcodes`
- `auth_activity_log`
- `user_queries`

### `logs` Schema

- `inventory_log`
- `operation_log`
- `system_events`
- `notification`

### `analytics` Schema

- Views that aggregate data for reports
- Denormalized tables for faster reporting

### `archive` Schema

- Obsolete tables or historical data

### `config` Schema

- System settings
- Reference data tables

## Database Views for Backward Compatibility

To minimize immediate application changes, create views in the public schema that point to the new table locations:

```sql
-- Create views in public schema for backward compatibility
CREATE OR REPLACE VIEW public.drum AS
  SELECT * FROM inventory.drum;

CREATE OR REPLACE VIEW public.purchase_order AS
  SELECT * FROM orders.purchase_order;
```

This allows you to gradually update application code while maintaining existing functionality.

## Considerations for RLS Policies

When moving tables to new schemas, remember that:

1. RLS policies don't automatically transfer - they need to be recreated
2. Default privileges may need to be updated
3. Cross-schema references might require additional permissions

Example of recreating policies:

```sql
-- Add RLS to table in new schema
ALTER TABLE inventory.drum ENABLE ROW LEVEL SECURITY;

-- Recreate policies
CREATE POLICY "Users can view all drums"
ON inventory.drum FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert drums they own"
ON inventory.drum FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());
```

## Schema Access Control

Set up appropriate permissions for each schema:

```sql
-- Grant usage on schemas
GRANT USAGE ON SCHEMA inventory TO authenticated;
GRANT USAGE ON SCHEMA orders TO authenticated;
GRANT USAGE ON SCHEMA auth_ext TO authenticated;

-- Grant specific privileges on tables
GRANT SELECT ON ALL TABLES IN SCHEMA inventory TO authenticated;
GRANT INSERT, UPDATE, DELETE ON inventory.drum TO authenticated;
```

## Implementation Phases

### Phase 1: Preparation

1. Create new schemas
2. Identify table dependencies and create migration order
3. Create test database backup
4. Develop and test migration scripts

### Phase 2: Core Infrastructure

1. Migrate reference and configuration tables
2. Migrate auth extension tables
3. Update related functions and procedures

### Phase 3: Business Domain Tables

1. Migrate inventory tables
2. Migrate order tables
3. Create compatibility views

### Phase 4: Analytics and Logs

1. Migrate or recreate analytics views
2. Move log tables
3. Set up archive schema for obsolete data

### Phase 5: Verification and Cleanup

1. Verify all functionality
2. Update application code
3. Remove compatibility views when no longer needed
4. Document new schema structure

## Performance Considerations

1. **Index Changes**: Review and optimize indexes after migration
2. **Vacuum and Analyze**: Run after migrations to update statistics
3. **Connection Pooling**: Update settings if needed for new schema structure
4. **Permissions**: Ensure permissions are properly set for efficiency

## Documentation and Monitoring

1. Create schema diagrams showing the new organization
2. Document table purposes and relationships
3. Set up monitoring to identify any performance issues
4. Document migration process for future reference

## Recommended Next Steps

1. **Analyze Current Schema**: Get a complete understanding of all tables and their relationships
2. **Classify Tables**: Assign each table to its appropriate schema
3. **Identify Dependencies**: Map dependencies between tables, views, and functions
4. **Develop Migration Plan**: Create detailed migration scripts
5. **Test in Development**: Perform migration in development environment
6. **Update Application**: Update application code to use new schema references
7. **Migrate Production**: Execute migration plan in production environment

```json
[
  {
    "schema_name": "public",
    "function_name": "add_to_repro_drum",
    "function_definition": "CREATE OR REPLACE FUNCTION public.add_to_repro_drum(distillation_id integer, repro_material character varying, volume_to_add integer)\n RETURNS void\n LANGUAGE plpgsql\nAS $function$\nDECLARE\n    target_drum_id INTEGER;\n    remaining_capacity INTEGER;\nBEGIN\n    -- Find a suitable drum of the given material type with enough capacity\n    SELECT repro_drum_id, (capacity - current_volume) AS remaining_capacity\n    INTO target_drum_id, remaining_capacity\n    FROM repro_drums rd\n    WHERE rd.material_type = repro_material\n      AND rd.capacity - rd.current_volume >= volume_to_add\n      AND rd.status = 'partial'  -- Ensure we only add to drums that are available for more material\n    ORDER BY rd.current_volume ASC  -- Prioritize the drum with the least amount of material\n    LIMIT 1;\n\n    -- If no suitable drum is found, raise an exception or handle as needed\n    IF target_drum_id IS NULL THEN\n        RAISE EXCEPTION 'No available repro drum with enough capacity for material type % and volume %', repro_material, volume_to_add;\n    END IF;\n\n    -- Update the selected drum's current volume\n    UPDATE repro_drums\n    SET current_volume = current_volume + volume_to_add,\n        updated_at = CURRENT_TIMESTAMP\n    WHERE repro_drum_id = target_drum_id;\n\n    -- Record this addition in the repro_additions table\n    INSERT INTO repro_additions (\n        repro_drum_id, \n        distillation_id, \n        date_added,\n        volume_added, \n        volume_in_drum\n    )\n    SELECT \n        target_drum_id,\n        distillation_id,\n        CURRENT_DATE,\n        volume_to_add,\n        current_volume\n    FROM repro_drums\n    WHERE repro_drum_id = target_drum_id;\nEND;\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "date_add",
    "function_definition": "CREATE OR REPLACE FUNCTION public.date_add(arg1 timestamp with time zone, arg2 interval)\n RETURNS timestamp with time zone\n LANGUAGE sql\nAS $function$\nselect arg1+arg2\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "delete_expired_notifications",
    "function_definition": "CREATE OR REPLACE FUNCTION public.delete_expired_notifications()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$BEGIN\n    DELETE FROM notifications WHERE expires_at IS NOT NULL AND expires_at < NOW();\n    RETURN NULL; -- This ensures the function doesn't return anything\nEND;$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "enforce_stock_id_constraint",
    "function_definition": "CREATE OR REPLACE FUNCTION public.enforce_stock_id_constraint()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$BEGIN\n    IF NEW.drum_type = 'new' THEN\n        -- Ensure stock_id exists in stock_new\n        IF NOT EXISTS (SELECT 1 FROM stock_new WHERE id = NEW.stock_id) THEN\n            RAISE EXCEPTION 'Invalid stock_id: % does not exist in stock_new', NEW.stock_id;\n        END IF;\n    ELSIF NEW.drum_type = 'repro' THEN\n        -- Ensure stock_id exists in stock_repro\n        IF NOT EXISTS (SELECT 1 FROM stock_repro WHERE stock_id = NEW.stock_id) THEN\n            RAISE EXCEPTION 'Invalid stock_id: % does not exist in stock_repro', NEW.stock_id;\n        END IF;\n    END IF;\n    RETURN NEW;\nEND;$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "generate_stock_drums",
    "function_definition": "CREATE OR REPLACE FUNCTION public.generate_stock_drums()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$BEGIN\n    INSERT INTO inventory.stock_drum (drum_type, order_detail_id, status, created_at, updated_at)\n    SELECT 'new', NEW.detail_id, 'en_route', NOW(), NOW()\n    FROM generate_series(1, NEW.drum_quantity); -- Generate N rows per quantity ordered\n\n    RETURN NEW;\nEND;$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "handle_empty_drums",
    "function_definition": "CREATE OR REPLACE FUNCTION public.handle_empty_drums()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$BEGIN\n    -- If the drum has reached 0 volume, update its status\n    IF NEW.remaining_volume = 0 THEN\n        -- Mark drum as 'empty' so it can be removed or reused\n        UPDATE inventory.stock_drum\n        SET status = 'empty'\n        WHERE drum_id = NEW.drum_id;\n\n        -- Log the event in a table for tracking purposes\n        INSERT INTO drum_decommission_log (drum_id, decommissioned_at, worker_id)\n        VALUES (NEW.drum_id, NOW(), NEW.worker_id);\n        \n        -- Optionally: Notify staff\n        INSERT INTO notifications (message, created_at)\n        VALUES (format('Drum ID %s is now empty and should be decommissioned.', NEW.drum_id), NOW());\n\n    END IF;\n    RETURN NEW;\nEND;$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "handle_new_user",
    "function_definition": "CREATE OR REPLACE FUNCTION public.handle_new_user()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nbegin\n  insert into public.profiles (id, full_name, avatar_url, email)\n  values (\n    new.id,                                              -- Use the new auth user's ID\n    new.raw_user_meta_data->>'full_name',               -- Extract from metadata JSON\n    new.raw_user_meta_data->>'avatar_url',              -- Extract from metadata JSON\n    new.raw_user_meta_data->>'email'                    -- Extract from metadata JSON\n    );\n  return new;\nend;\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "insert_stock_new",
    "function_definition": "CREATE OR REPLACE FUNCTION public.insert_stock_new()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$DECLARE existing_stock_id INT;\nBEGIN\n    -- Check if stock_new already has the material+supplier combination\n    SELECT stock_id INTO existing_stock_id\n    FROM stock_new\n    WHERE material_id = NEW.material_id\n    AND supplier_id = (SELECT supplier_id FROM stock_order WHERE order_id = NEW.order_id)\n    LIMIT 1;\n\n    -- If stock exists, update quantity\n    IF existing_stock_id IS NOT NULL THEN\n        UPDATE stock_new\n        SET quantity = quantity + NEW.drum_quantity, updated_at = NOW()\n        WHERE stock_id = existing_stock_id;\n    ELSE\n        -- If stock does not exist, create a new row\n        INSERT INTO stock_new (material_id, supplier_id, quantity, location, batch_code, created_at, updated_at, detail_id)\n        VALUES (\n            NEW.material_id,\n            (SELECT supplier_id FROM stock_order WHERE order_id = NEW.order_id),\n            NEW.drum_quantity,\n            NULL,  -- Default location for new stock\n            NULL, -- Batch code is recorded later\n            NOW(), NOW(), -- Timestamps\n            NEW.detail_id -- Link to stock_order_details\n        );\n    END IF;\n\n    RETURN NEW;\nEND;$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "mass_to_volume",
    "function_definition": "CREATE OR REPLACE FUNCTION public.mass_to_volume(material_id integer, weight numeric)\n RETURNS numeric\n LANGUAGE plpgsql\n IMMUTABLE\nAS $function$\nDECLARE\n    density NUMERIC;\nBEGIN\n    SELECT density INTO density FROM public.raw_materials rm WHERE rm.material_id = material_id;\n    RETURN weight / density;\nEXCEPTION\n    WHEN NO_DATA_FOUND THEN\n        -- RAISE EXCEPTION 'Material not found';\n        RETURN 200;\nEND;\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "update_material_code",
    "function_definition": "CREATE OR REPLACE FUNCTION public.update_material_code()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n    -- Update the material_code for all records in stock_history that match the new material_name\n    UPDATE public.stock_history\n    SET material_code = ref_materials.code\n    FROM ref_materials\n    WHERE ref_materials.value = NEW.material_name\n      AND stock_history.material_name = NEW.material_name;\n\n    RETURN NEW;\nEND;\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "update_modified_column",
    "function_definition": "CREATE OR REPLACE FUNCTION public.update_modified_column()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n    NEW.updated_at = CURRENT_TIMESTAMP;\n    RETURN NEW;\nEND;\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "update_stock_drums_status",
    "function_definition": "CREATE OR REPLACE FUNCTION public.update_stock_drums_status()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$BEGIN\n  UPDATE inventory.stock_drum\n  SET status = 'in_stock',\n    updated_at = NOW()\n  WHERE order_detail_id = NEW.detail_id;\n\n  RETURN NEW;\nEND;$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "update_stock_new_on_arrival",
    "function_definition": "CREATE OR REPLACE FUNCTION public.update_stock_new_on_arrival()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$DECLARE\n    existing_stock_id INT;\nBEGIN\n    -- Find if stock batch already exists\n    SELECT stock_id INTO existing_stock_id\n    FROM stock_new\n    WHERE material_id = (SELECT material_id FROM order_detail WHERE detail_id = NEW.detail_id)\n\t    AND batch_code = (SELECT batch_code FROM order_detail WHERE detail_id = NEW.detail_id)\n\t    AND supplier_id = (SELECT supplier_id FROM stock_order WHERE order_id = \n                        (SELECT order_id FROM order_detail WHERE detail_id = NEW.detail_id))\n    LIMIT 1;\n\n    -- If stock exists, update quantity\n    IF existing_stock_id IS NOT NULL THEN\n        UPDATE stock_new\n        SET quantity = quantity + 1, updated_at = NOW()\n        WHERE stock_id = existing_stock_id;\n    ELSE\n        -- If stock does not exist, create a new batch\n        INSERT INTO stock_new (material_id, supplier_id, quantity, batch_code, location, created_at, updated_at)\n        VALUES (\n            (SELECT material_id FROM order_detail WHERE detail_id = NEW.detail_id),\n            (SELECT supplier_id FROM stock_order WHERE order_id = \n                    (SELECT order_id FROM order_detail WHERE detail_id = NEW.detail_id)),\n            1,\n            (SELECT batch_code FROM order_detail WHERE detail_id = NEW.detail_id),\n\t\t\t 'New Site', NOW(), NOW()\n        );\n    END IF;\n\n    -- Update drum status to 'in stock'\n    UPDATE inventory.stock_drum\n    SET updated_at = NOW()\n    WHERE drum_id = NEW.drum_id;\n\n    RETURN NEW;\nEND;$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "update_timestamp",
    "function_definition": "CREATE OR REPLACE FUNCTION public.update_timestamp()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n    NEW.updated_at = CURRENT_TIMESTAMP;\n    RETURN NEW;\nEND;\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "update_updated_at",
    "function_definition": "CREATE OR REPLACE FUNCTION public.update_updated_at()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n    NEW.updated_at := NOW();  -- Set updated_at to the current timestamp\n    RETURN NEW;  -- Return the modified row\nEND;\n$function$\n"
  }
]
```
