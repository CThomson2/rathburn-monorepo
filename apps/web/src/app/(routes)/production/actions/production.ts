'use server';

import { executeServerDbOperation } from "@/lib/database";
import { SupabaseClient } from "@supabase/supabase-js";
import { Order, mapJobStatusToOrderStatus, getProgressFromStatus, getPriorityFromJob } from "@/features/production/types";

/**
 * Fetches all production jobs from the database
 * 
 * @returns {Promise<Order[]>} Array of production orders formatted for the UI
 * @description Retrieves all production jobs with their related operations and drum information,
 *              then transforms them into the Order format expected by the UI components
 */
export async function fetchProductionJobs(): Promise<Order[]> {
  try {
    return await executeServerDbOperation(async (supabase: SupabaseClient) => {
      // Fetch jobs using an RPC function that accesses the view
      const { data: jobs, error } = await supabase
      .schema('production')
      .from('jobs')
      // .rpc('get_production_jobs')
      .select(`
        job_id,
        item_id,
        input_batch_id,
        status,
        priority,
        planned_start,
        planned_end,
        created_at,
        updated_at,
        items:item_id (
          name,
          suppliers:supplier_id (
            name
          )
        ),
        operations!job_id (
          op_id,
          op_type,
          status,
          scheduled_start,
          started_at,
          ended_at,
          operation_drums!op_id (
            drum_id,
            drums!drum_id (
              serial_number,
              current_volume,
              current_location,
              locations!current_location (
                name
              )
            )
          )
        )
      `)
      // .select('*')
      .order('created_at', { ascending: false });
        
      // If the RPC function is not available, you need to create it first:
      // CREATE OR REPLACE FUNCTION get_production_jobs()
      // RETURNS SETOF ui.v_production_jobs
      // LANGUAGE sql
      // SECURITY DEFINER
      // AS $$
      //   SELECT * FROM ui.v_production_jobs ORDER BY created_at DESC;
      // $$;

      if (error) {
        // console.error('Error fetching production jobs:', error);
        return [];
      }

      // Transform the database data into the Order type expected by the UI
      return jobs.map((job: any) => {
        // Count the drums across all operations and ensure uniqueness
        const allDrums = job.operations?.flatMap((op: any) => op.operation_drums || []) || [];
        const uniqueDrumIds = new Set(allDrums.map((d: any) => d.drum_id));
        
        return {
          id: `ORD-${job.job_id.substring(0, 8)}`,
          itemName: job.item_name || 'Unknown Item',
          supplier: job.supplier_name || 'Unknown Supplier',
          quantity: job.drum_quantity || 0,
          scheduledDate: job.planned_start || job.created_at,
          status: mapJobStatusToOrderStatus(job.status),
          progress: getProgressFromStatus(job.status),
          priority: getPriorityFromJob(job),
          // Format drum information for UI display
          drums: allDrums.map((drumOp: any) => ({
            id: drumOp.drum_id,
            serial: drumOp.drums?.serial_number || 'Unknown',
            volume: drumOp.drums?.current_volume || 0,
            location: drumOp.drums?.locations?.name || 'Unknown Location'
          })),
          // Create task list from operations
          tasks: job.operations?.map((op: any) => ({
            name: `${op.op_type.charAt(0).toUpperCase() + op.op_type.slice(1)} operation`,
            completed: op.status === 'completed',
            assignedTo: '' // No assigned user in the current data model
          })) || [],
          // Generate timeline events from operation start/end timestamps
          timeline: job.operations
            ?.filter((op: any) => op.started_at || op.ended_at)
            .flatMap((op: any) => {
              const events = [];
              if (op.started_at) {
                events.push({
                  event: `${op.op_type} started`,
                  timestamp: op.started_at,
                  user: 'System'
                });
              }
              if (op.ended_at) {
                events.push({
                  event: `${op.op_type} completed`,
                  timestamp: op.ended_at,
                  user: 'System'
                });
              }
              return events;
            })
            .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) || []
        };
      });
    });
  } catch (error) {
    console.error('Unexpected error fetching jobs:', error);
    return [];
  }
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
  try {
    return await executeServerDbOperation(async (supabase: SupabaseClient) => {
      // Insert the new job record
      const { data, error } = await supabase
        .from('production.jobs')
        .insert({
          item_id: itemId,
          input_batch_id: batchId,
          planned_start: plannedStart.toISOString(),
          priority: priority,
          status: 'scheduled'
        })
        .select('job_id')
        .single();
      
      if (error) {
        console.error('Error creating production job:', error);
        return null;
      }

      // Create initial transport operation for this job
      if (data?.job_id) {
        await createInitialOperations(supabase, data.job_id);
        return data.job_id;
      }

      return null;
    });
  } catch (error) {
    console.error('Unexpected error creating job:', error);
    return null;
  }
}

/**
 * Creates the initial set of operations for a new job
 * 
 * @param {SupabaseClient} supabase - The Supabase client instance
 * @param {string} jobId - The ID of the job to create operations for
 * @returns {Promise<boolean>} Success status of the operation creation
 * @description Sets up the initial transport operation required for a new production job
 */
async function createInitialOperations(supabase: SupabaseClient, jobId: string): Promise<boolean> {
  try {
    // Create transport operation as the first step in the production process
    const { error } = await supabase
      .from('production.operations')
      .insert({
        job_id: jobId,
        op_type: 'transport',
        status: 'pending'
      });

    if (error) {
      console.error('Error creating initial operations:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error creating operations:', error);
    return false;
  }
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
  try {
    return await executeServerDbOperation(async (supabase: SupabaseClient) => {
      // Build update object with only the fields that need to be updated
      const updateData: any = {};
      
      if (updates.status) updateData.status = updates.status;
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.planned_start) updateData.planned_start = updates.planned_start.toISOString();
      
      const { error } = await supabase
        .from('production.jobs')
        .update(updateData)
        .eq('job_id', jobId);
      
      if (error) {
        console.error('Error updating production job:', error);
        return false;
      }

      return true;
    });
  } catch (error) {
    console.error('Unexpected error updating job:', error);
    return false;
  }
}

/**
 * Fetches available batches that can be used for new jobs
 * 
 * @returns {Promise<any[]>} Array of available batches with drum information
 * @description Retrieves batches that have drums in stock and can be used for production
 */
export async function fetchAvailableBatches() {
  try {
    return await executeServerDbOperation(async (supabase: SupabaseClient) => {
      // Only fetch batches that have at least one drum in stock
      const { data, error } = await supabase
        .from('ui.v_batches_with_drums')
        .select('*')
        .gt('drums_in_stock', 0);
      
      if (error) {
        console.error('Error fetching available batches:', error);
        return [];
      }

      return data;
    });
  } catch (error) {
    console.error('Unexpected error fetching batches:', error);
    return [];
  }
}

/**
 * Fetches all items for job creation
 * 
 * @returns {Promise<any[]>} Array of inventory items with supplier and material information
 * @description Retrieves all inventory items that can be used in production jobs
 */
export async function fetchItems() {
  try {
    return await executeServerDbOperation(async (supabase: SupabaseClient) => {
      // Fetch items with their related supplier and material information
      const { data, error } = await supabase
        .from('inventory.items')
        .select(`
          item_id,
          name,
          supplier:supplier_id (
            supplier_id,
            name
          ),
          material:material_id (
            material_id,
            name
          )
        `);
      
      if (error) {
        console.error('Error fetching items:', error);
        return [];
      }

      return data;
    });
  } catch (error) {
    console.error('Unexpected error fetching items:', error);
    return [];
  }
}