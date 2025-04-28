# Production Schedule Actions

```typescript
/**
 * Fetches all production jobs from the database
 *
 * @returns {Promise<Order[]>} Array of production orders formatted for the UI
 * @description Retrieves all production jobs with their related operations and drum information,
 *              then transforms them into the Order format expected by the UI components
 */
export async function fetchProductionJobs(): Promise<Order[]> {
  // ...
}

/**
 * Creates a new production job
 *
 * @param {string} itemId - The ID of the item to be produced
 * @param {string} batchId - The ID of the input batch to use
 * @param {Date} plannedStart - The planned start date for the job
 * @param {number} priority - The priority level (1-10, default: 5)
 * @returns {Promise<string|null>} The ID of the created job or null if creation failed
 * @description Creates a new production job record and initializes the required operations
 */
export async function createProductionJob(
  itemId: string,
  batchId: string,
  plannedStart: Date,
  priority: number = 5
): Promise<string | null> {
  // ...
}

/**
 * Creates the initial set of operations for a new job
 *
 * @param {SupabaseClient} supabase - The Supabase client instance
 * @param {string} jobId - The ID of the job to create operations for
 * @returns {Promise<boolean>} Success status of the operation creation
 * @description Sets up the initial transport operation required for a new production job
 */
async function createInitialOperations(
  supabase: SupabaseClient,
  jobId: string
): Promise<boolean> {
  // ...
}

/**
 * Updates an existing production job
 *
 * @param {string} jobId - The ID of the job to update
 * @param {Object} updates - The fields to update
 * @param {string} [updates.status] - New job status
 * @param {number} [updates.priority] - New priority level
 * @param {Date} [updates.planned_start] - New planned start date
 * @returns {Promise<boolean>} Success status of the update operation
 * @description Updates specified fields of an existing production job
 */
export async function updateProductionJob(
  jobId: string,
  updates: {
    status?: string;
    priority?: number;
    planned_start?: Date;
  }
): Promise<boolean> {
  // ...
}

/**
 * Fetches available batches that can be used for new jobs
 *
 * @returns {Promise<any[]>} Array of available batches with drum information
 * @description Retrieves batches that have drums in stock and can be used for production
 */
export async function fetchAvailableBatches() {
  // ...
}

/**
 * Fetches all items for job creation
 *
 * @returns {Promise<any[]>} Array of inventory items with supplier and material information
 * @description Retrieves all inventory items that can be used in production jobs
 */
export async function fetchItems() {
  // ...
}

/**
 * Fetches distillation schedules for the next 14 days from ui.v_distillation_schedule
 *
 * @returns {Promise<DistillationScheduleDay[]>} Array of distillation schedules grouped by day
 */
export async function fetchDistillationSchedule14Days(): Promise<
  DistillationScheduleDay[]
> {
  // ...
}
```
