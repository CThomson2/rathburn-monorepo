# Prisma to Supabase Migration Progress

This document tracks the progress of migrating from Prisma ORM to the Supabase client.

## Completed

1. **Database Access Layer**
   - Created a simplified database.ts with Supabase-only helpers
   - Implemented core CRUD operations: selectFromTable, insertIntoTable, updateTable, deleteFromTable
   - Added advanced operations: countTable, executeRawQuery, getPaginatedData, getById

2. **Model Conversions**
   - Orders module
     - Updated crud.ts to use new DAL methods
     - Updated queries.ts to use Supabase client

3. **API Routes**
   - Updated main API routes for orders:
     - /api/orders - GET, POST, PUT, DELETE handlers
     - /api/orders/next-po-number - GET handler
     - /api/materials/suggestions - GET handler
     - /api/suppliers/suggestions - GET handler

## In Progress

1. **Additional API Routes**
   - Need to update remaining API routes
   - Consider consolidating duplicate API route logic

2. **Model Conversions**
   - Need to convert remaining models (materials, drums, etc.)
   - Need to update types to match Supabase schema

## Remaining Tasks

1. **Components and Pages**
   - Update forms and UI components to work with the new schema
   - Fix type references in components

2. **Testing**
   - Test core functionality after migration
   - Create test cases for key workflows

3. **Cleanup**
   - Remove Prisma dependencies
   - Update documentation

## Migration Tips

When converting code that uses `withDatabase()`:

1. For simple queries, use the appropriate helper:
   ```typescript
   // Before
   const orders = await withDatabase(db => db.orders.findMany());
   
   // After
   const orders = await selectFromTable('stock_order');
   ```

2. For complex queries, use executeDbOperation:
   ```typescript
   // Before
   const order = await withDatabase(db => 
     db.orders.findUnique({
       where: { id },
       include: { deliveries: true }
     })
   );
   
   // After
   const order = await executeDbOperation(async (client) => {
     const { data, error } = await client
       .from('stock_order')
       .select('*, deliveries(*)')
       .eq('id', id)
       .maybeSingle();
     
     if (error) throw error;
     return data;
   });
   ```

3. For working with multiple tables in a sequence:
   ```typescript
   await executeDbOperation(async (client) => {
     // First operation
     const { data: order, error: orderError } = await client
       .from('stock_order')
       .insert({ /* order data */ })
       .select()
       .single();
       
     if (orderError) throw orderError;
     
     // Second operation using results from first
     const { data: details, error: detailsError } = await client
       .from('order_detail')
       .insert({ 
         order_id: order.order_id,
         /* other detail data */ 
       })
       .select();
       
     if (detailsError) throw detailsError;
     
     return { order, details };
   });
   ```

## Common Schema Mapping

| Prisma Table    | Supabase Table     | Notes                                     |
|-----------------|--------------------|-----------------------------------------|
| orders          | stock_order        | Updated field names in Supabase schema    |
| order_details   | order_detail       | One-to-many relationship with stock_order |
| drums           | stock_drum         | Renamed to be more specific               |
| materials       | raw_materials      | Updated schema with additional fields     |
| suppliers       | ref_suppliers      | Reference table                           |

## Next Steps

1. Complete migration of remaining API routes
2. Update model types to match Supabase schema
3. Update components that rely on the old schema
4. Add comprehensive tests for critical paths
5. Remove all Prisma dependencies
6. Update documentation for future developers