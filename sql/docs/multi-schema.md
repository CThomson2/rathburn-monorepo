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
