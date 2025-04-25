# Production Orders Management Implementation

This document outlines the steps to implement the production orders management system for the Rathburn inventory app.

## Files to Create/Update

1. **Create Production Services**:

   - Create `/src/features/production/services/production-service.ts`
   - Implement functions for fetching, creating and updating production jobs

2. **Create Job Modal Component**:

   - Create `/src/features/production/components/create-job-modal.tsx`
   - Create UI for adding new production jobs

3. **Update Production Index**:

   - Update `/src/features/production/index.ts`
   - Add exports for new components and services

4. **Update Main Page**:
   - Update `/src/app/(routes)/page.tsx`
   - Replace mock data with real Supabase data
   - Add modal for creating new jobs
   - Implement search, filtering, and sorting

## Data Flow

1. **Fetching Jobs**:

   - The `fetchProductionJobs()` function queries Supabase for production jobs
   - It joins related tables to get item details, supplier info, and assigned drums
   - The database data is transformed into the `Order` type expected by the UI

2. **Creating Jobs**:

   - The `createProductionJob()` function inserts a new record in the `production.jobs` table
   - It then calls `createInitialOperations()` to set up the first task (transport)
   - This establishes the foundation for the job workflow

3. **Updating Jobs**:
   - The `updateProductionJob()` function allows status, priority, and schedule updates
   - Changes are persisted to the database and reflected in the UI

## Database Tables Used

- `production.jobs`: Main job records
- `production.operations`: Individual operations/tasks for each job
- `production.operation_drums`: Links drums to operations
- `inventory.items`: Details about materials/products
- `inventory.batches`: Batches of materials
- `inventory.drums`: Individual drum containers

## Implementation Steps

1. Copy the service file content to `/src/features/production/services/production-service.ts`
2. Create the folder structure if it doesn't exist: `mkdir -p src/features/production/services`
3. Copy the modal component content to `/src/features/production/components/create-job-modal.tsx`
4. Update the index file to export the new components and services
5. Replace the page.tsx content with the updated version

## Testing

Once implemented, you should be able to:

1. View existing production jobs from the database
2. Create new production jobs with the "New Order" button
3. Search and filter jobs by various criteria
4. Sort jobs by date, priority, or status
5. View detailed information for each job by clicking on the cards

## Next Steps for Future Development

1. Implement drum scanning functionality in the app
2. Add operation status updates through the UI
3. Implement a detailed view for operations/tasks
4. Create a dashboard for production statistics
5. Add user assignment functionality to operations
