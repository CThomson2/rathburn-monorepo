# Supabase CRUD Utility

A comprehensive utility for interacting with Supabase tables with full TypeScript support. This utility provides a clean and consistent API for common database operations while ensuring type safety throughout your application.

## Features

- **Type-safe CRUD operations** - All database operations are fully typed
- **Complex queries** - Support for joins, filtering, sorting, and pagination
- **RPC function calls** - Easy way to call Supabase RPC functions
- **Batch operations** - Update or delete multiple records with a single operation
- **Comprehensive error handling** - Consistent error handling pattern
- **Clean API** - Intuitive method names and parameters

## Basic Usage

```typescript
import { createCRUD } from '@/utils/crud';

// Create a typed CRUD instance for a specific table
const materialsCrud = createCRUD('raw_materials', 'material_id');

// Fetch all records
const { data: allMaterials, error } = await materialsCrud.fetchAll();

// Fetch a single record by ID
const { data: singleMaterial, error } = await materialsCrud.fetchById(1);

// Create a new record
const { data: newMaterial, error } = await materialsCrud.create({
  material_name: 'New Material',
  cas_number: '123-45-6',
  drum_volume: 200,
  material_code: 'NEW-001'
});

// Update a record
const { data: updatedMaterial, error } = await materialsCrud.update(1, {
  material_name: 'Updated Material'
});

// Delete a record
const { data, error } = await materialsCrud.delete(1);
```

## Advanced Queries

The `select` method provides a flexible way to build complex queries:

```typescript
const { data, error } = await ordersCrud.select({
  // Specify columns to select
  columns: ['order_id', 'po_number', 'date_ordered'],
  
  // Join related tables
  joins: {
    // Simple join
    order_detail: ['detail_id', 'material_name', 'drum_quantity'],
    
    // Join with more options
    ref_suppliers: {
      foreignTable: 'ref_suppliers', 
      columns: ['supplier_name', 'addr_1', 'city']
    }
  },
  
  // Apply filters
  filters: [
    { column: 'date_ordered', operator: 'gte', value: '2023-01-01' },
    { column: 'status', operator: 'in', value: ['active', 'pending'] }
  ],
  
  // Sort results
  orderBy: [
    { column: 'date_ordered', ascending: false },
    { column: 'po_number' }
  ],
  
  // Pagination
  limit: 10,
  offset: 0,
  
  // Return a single result
  single: false
});
```

## Filtering Operations

Filters support all Supabase filter operators:

- `eq` - Equal to
- `neq` - Not equal to
- `gt` - Greater than
- `gte` - Greater than or equal to
- `lt` - Less than
- `lte` - Less than or equal to
- `like` - SQL LIKE pattern matching
- `ilike` - Case-insensitive LIKE pattern matching
- `is` - Matches for NULL or true/false values
- `in` - In a list of values
- `cs` - Contains (for JSON/arrays)
- `cd` - Contained by (for JSON/arrays)

## Batch Operations

Update or delete multiple records with a single operation:

```typescript
// Update multiple records
const { data, error } = await drumsCrud.updateMany(
  { status: 'inactive' },
  [
    { column: 'last_activity', operator: 'lt', value: '2023-01-01' },
    { column: 'status', operator: 'neq', value: 'decommissioned' }
  ]
);

// Delete multiple records
const { error } = await drumsCrud.deleteMany([
  { column: 'status', operator: 'eq', value: 'decommissioned' },
  { column: 'fill_level', operator: 'eq', value: 0 }
]);
```

## RPC Function Calls

Call Supabase RPC functions with proper typing:

```typescript
// Call an RPC function with parameters
const { data, error } = await crud.rpc<number>('calculate_volume', {
  material_id: 1,
  weight: 100
});
```

## Error Handling

All methods follow a consistent error handling pattern:

```typescript
const { data, error } = await materialsCrud.create({
  material_name: 'New Material',
  cas_number: '123-45-6'
});

if (error) {
  console.error('Error creating material:', error);
  // Handle the error
  return;
}

// Success path
console.log('Created material:', data);
```

## Testing

The utility includes comprehensive tests. Run them with:

```
pnpm run test
```

Integration tests with a real database can be enabled by setting the `ENABLE_INTEGRATION_TESTS` environment variable.