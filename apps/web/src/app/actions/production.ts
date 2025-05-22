"use server";

import { executeServerDbOperation } from "@/lib/database";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  Order as ProductionJobOrderType,
  mapJobStatusToOrderStatus,
  getProgressFromStatus,
  getPriorityFromJob,
  JobStatus,
  OperationStatus,
  ProductionJobData,
} from "@/features/production/types";

/***************************
 * READ ACTIONS
 ***************************/

/**
 * Returns a list of upcoming / recent production jobs.
 * Joins helper tables to give the UI meaningful strings.
 */
export async function fetchProductionJobs(): Promise<ProductionJobOrderType[]> {
  return executeServerDbOperation(async (supabase: SupabaseClient) => {
    const { data: viewData, error } = await supabase
      .schema("production")
      .from("v_operation_schedule")
      .select("*"); // Select all columns from the view
    // The view already has an ORDER BY o.scheduled_start
    // If you need to order by job's created_at, you can add it here,
    // but ensure 'job_created_at' is selected from the view.
    // .order("job_created_at", { ascending: false });

    if (error || !viewData) {
      console.error("[fetchProductionJobs]", error);
      return [];
    }

    // Map the data from the view to your ProductionJobOrderType
    // Adjust field names based on your view's aliases
    return viewData.map((job: any) => ({
      id: job.job_id,
      jobName: job.job_name ?? job.job_id.slice(0, 8),
      itemName: job.item_name ?? "Unknown Item", // From view
      supplier: job.supplier_name ?? "Unknown Supplier", // From view
      // Quantity might need recalculation if based on operation_drums,
      // or you can add a COUNT/SUM to your view for this.
      // For now, let's see if the view provides enough.
      // This original quantity logic might not directly map if the view has one row per drum in an operation.
      // The view as written will have one row per (job, op, drum) combination if using INNER JOIN on operation_drums,
      // or one row per (job, op) if using LEFT JOIN and no drums are associated yet.
      // Let's assume for now we want one entry per job_id, and the view might return multiple if a job has multiple ops/drums.
      // This part might need refinement based on how ProductionPreviewProps expects the data.
      // For an MVP, if the view is one row per scheduled operation, quantity might be based on dd.raw_volume / 200.
      quantity: job.raw_volume ? job.raw_volume / 200 : 0, // Example: using raw_volume from distillation_details
      scheduledDate: job.scheduled_start ?? job.job_created_at, // From view (scheduled_start from operations)
      status: mapJobStatusToOrderStatus(job.job_status), // From view
      progress: getProgressFromStatus(job.job_status), // Based on job_status
      priority: job.priority, // From view
      drums: job.drum_id
        ? [
            {
              // Simplified: if a drum_id exists in the row
              id: job.drum_id,
              serial: job.drum_serial_number ?? "N/A",
              volume: job.volume_transferred ?? job.drum_current_volume ?? 0,
              location: "N/A", // Location not in current view, might need to add
            },
          ]
        : [],
      tasks: [
        {
          // Simplified: represents the main distillation operation
          name: job.op_type.replace("_", " ") ?? "Distillation",
          completed: job.op_status === "completed",
          assignedTo: "", // Not in view
          details: job.still_code
            ? `Still: ${job.still_code}, Raw Vol: ${job.raw_volume}L, Max Cap: ${job.still_max_capacity * 200}L`
            : "Details unavailable",
          // Add more task details from view if needed (started_at, ended_at for this op)
          status: job.op_status as OperationStatus,
          started_at: job.started_at,
          ended_at: job.ended_at,
        },
      ],
      timeline: [], // Timeline construction might need to be re-evaluated based on view structure
      // or fetched separately if too complex from this flattened view row.
      // For simplicity, leaving it empty as the view focuses on current schedule.
    }));
  });
}

/** Fetches details for a single production job */
export async function fetchProductionJobById(
  jobId: string
): Promise<ProductionJobOrderType | null> {
  if (!jobId) return null;

  return executeServerDbOperation(async (supabase: SupabaseClient) => {
    const { data: jobData, error } = await supabase
      // .schema("production") // Querying from public schema now
      .from("v_production_job_details") // Use the new view
      .select(
        `*
        `
      )
      .eq("job_id", jobId);
      // .single(); // The view might return multiple rows if a job has multiple operations/drums. We need to aggregate.

    if (error || !jobData || jobData.length === 0) {
      console.error(`[fetchProductionJobById: ${jobId}]`, error);
      return null;
    }

    // Aggregate data since the view can return multiple rows per job_id
    // (due to joins with operations, operation_drums)
    const aggregatedJob: ProductionJobOrderType = {
      id: jobData[0].job_id,
      jobName: jobData[0].job_name ?? `${jobData[0].item_name} - (${jobData[0].batch_code})`,
      itemName: jobData[0].item_name ?? "Unknown Item",
      supplier: jobData[0].supplier_name ?? "Unknown Supplier",
      quantity: 0,
      scheduledDate: jobData[0].job_planned_start ?? jobData[0].job_created_at,
      status: mapJobStatusToOrderStatus(jobData[0].job_status as JobStatus),
      progress: getProgressFromStatus(jobData[0].job_status as JobStatus),
      priority: getPriorityFromJob({ priority: jobData[0].job_priority } as any),
      drums: [],
      tasks: [],
      timeline: [],
    };

    const operationMap = new Map<string, any>();
    const drumMap = new Map<string, any>();

    for (const row of jobData) {
      if (row.operation_drum_id && !drumMap.has(row.drum_serial_number)) {
        drumMap.set(row.drum_serial_number, {
          id: row.drum_serial_number,
          serial: row.drum_serial_number ?? 'N/A',
          volume: row.operation_drum_volume_transferred ?? row.drum_current_volume ?? 0,
          location: 'N/A',
        });
      }

      if (row.op_id && !operationMap.has(row.op_id)) {
        let taskDetails = "";
        if (row.op_type === 'distillation' && row.still_code) {
          taskDetails = `Still: ${row.still_code}, Raw Vol: ${row.distillation_raw_volume}L, Max Cap: ${row.still_max_capacity ? row.still_max_capacity * 200 : 'N/A'}L`;
        }
        operationMap.set(row.op_id, {
          op_id: row.op_id,
          name: row.op_type ? row.op_type.replace("_", " ") : 'Operation',
          completed: row.operation_status === "completed",
          details: taskDetails || undefined,
          status: row.operation_status as OperationStatus,
          started_at: row.operation_started_at,
          ended_at: row.operation_ended_at,
        });
      }
    }

    aggregatedJob.drums = Array.from(drumMap.values());
    aggregatedJob.tasks = Array.from(operationMap.values());
    
    // Calculate total quantity from drums
    aggregatedJob.quantity = aggregatedJob.drums.reduce((acc, drum) => acc + (drum.volume || 0), 0) / 200;

    // Construct timeline from unique operations
    const timelineEvents: any[] = [];
    aggregatedJob.tasks.forEach(op => {
      if (op.started_at) {
        timelineEvents.push({
          event: `${op.name} started`,
          timestamp: op.started_at,
          user: "system", // Or derive if user info is available
        });
      }
      if (op.ended_at) {
        timelineEvents.push({
          event: `${op.name} completed`,
          timestamp: op.ended_at,
          user: "system",
        });
      }
    });
    aggregatedJob.timeline = timelineEvents.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return aggregatedJob as ProductionJobOrderType;
  });
}

/** Fetch all operational stills for dropdown */
export async function fetchStills(): Promise<
  Array<{ still_id: number; code: string; max_capacity: number }>
> {
  return executeServerDbOperation(async (supabase) => {
    const { data, error } = await supabase
      .schema("production")
      .from("stills")
      .select("still_id, code, max_capacity")
      .eq("is_operational", true)
      .order("code");

    if (error) {
      console.error("[fetchStills]", error);
      return [];
    }
    return data as Array<{
      still_id: number;
      code: string;
      max_capacity: number;
    }>;
  });
}

/**
 * Returns batches containing the requested item with drums currently in stock.
 */
export async function fetchAvailableBatchesByMaterial(materialId: string): Promise<
  Array<{
    batch_id: string;
    batch_code: string | null;
    drums_in_stock: number;
    supplier_name: string | null;
  }>
> {
  console.log("[fetchAvailableBatchesByItem] Starting with materialId:", materialId);
  if (!materialId) {
    console.log("[fetchAvailableBatchesByItem] No materialId provided, returning empty array");
    return [];
  }
  
  return executeServerDbOperation(async (supabase) => {
    console.log("[fetchAvailableBatchesByItem] Executing database query for materialId:", materialId);
    
    // The original query used a view `v_batches_with_drums`.
    // Since the view definition isn't readily available, and we need supplier_name,
    // we'll construct a query joining batches, purchase_orders, and suppliers.
    // The `drums_in_stock` logic from the original view is assumed to be handled
    // by a field in `batches` or needs to be derived. For now, we'll assume
    // a placeholder or a field that might exist on `batches` for `drums_in_stock`.
    // This might need adjustment if `v_batches_with_drums` had complex aggregation.

    const { data: itemData, error: itemError } = await supabase
      .schema("inventory")
      .from("items")
      .select("item_id, name")
      .eq("material_id", materialId);

    if (itemError) {
      console.error("[fetchAvailableBatchesByItem: itemError]", itemError);
      return [];
    }

    console.log("[fetchAvailableBatchesByItem] Item count:", itemData?.length, "Item data:", itemData);

    // First, let's get batches for the item and their associated POs.
    const { data: batchData, error: batchError } = await supabase
      .from("v_batches_with_drums")
      .select("batch_id, batch_code, drums_in_stock, supplier_name")
      .in("item_id", itemData?.map((item: any) => item.item_id) || [])
      .gt("drums_in_stock", 0); // Assuming qty_drums represents drums_in_stock

    if (batchError) {
      console.error("[fetchAvailableBatchesByItem: batchError]", batchError);
      return [];
    }

    console.log("[fetchAvailableBatchesByItem] Query results:", batchData);
    console.log("[fetchAvailableBatchesByItem] Number of batches found:", batchData?.length || 0);

    return batchData as Array<{
      batch_id: string;
      batch_code: string | null;
      drums_in_stock: number;
      supplier_name: string | null;
    }>;

    // TODO: The `drums_in_stock` logic needs to be clarified.
    // The original view `v_batches_with_drums` likely calculated this.
    // For now, we'll use `qty_drums` from the `batches` table as a placeholder.
    // This will need to be replaced with the correct logic for `drums_in_stock`.
    // A common way is to count related records in a `drums` table, grouped by batch_id.
    // For instance, if you have a `drums` table with `batch_id` and `status = 'in_stock'`,
    // you would need a subquery or a separate query to count these.
  });
}

/***************************
 * WRITE ACTIONS
 ***************************/

/**
 * Parse formData sent from ProductionForm (client component)
 */
// function parseProductionFormData(formData: FormData): ProductionFormData | null { // OLD, remove or adapt if still needed elsewhere
// ... (old parsing logic) ...
// }

/**
 * Server action – creates a new distillation job via the DB function.
 */
export async function createProductionJob(jobData: ProductionJobData): Promise<{
  success: boolean;
  jobId?: string;
  message?: string;
}> {
  console.log("[createProductionJob] Starting job creation with data:", jobData);
  // const parsed = parseProductionFormData(formData); // No longer parsing FormData here
  // if (!parsed) { // Validation can be done directly on jobData if needed
  //   console.log("[createProductionJob] Failed to parse form data");
  //   return { success: false, message: "Missing or invalid form fields" };
  // }

  const { batchId, plannedDate, stillId, rawVolume, priority, jobName, jobStatus, createdBy } = jobData;
  console.log("[createProductionJob] Parsed data for RPC:", { batchId, plannedDate, stillId, rawVolume, priority, jobName, jobStatus });

  return executeServerDbOperation(async (supabase) => {
    console.log("[createProductionJob] Calling database function create_distillation_job");
    const { data, error } = await supabase
      .schema("production")
      .rpc("create_production_job", {
        p_user_id: createdBy,
        p_batch_id: batchId,
        p_planned_start: plannedDate,
        p_still_id: stillId,
        p_raw_volume: rawVolume,
        p_priority: priority ?? 10,
        p_job_name: jobName, // ADDED - I will add this to the SQL function later
        p_job_status: jobStatus, // ADDED - I will add this to the SQL function later
      });

    if (error) {
      console.error("[createProductionJob] Database error:", error);
      return { success: false, message: error.message };
    }

    console.log("[createProductionJob] Job created successfully with ID:", data);
    return { success: true, jobId: data as string };
  });
}

/**
 * Server action - updates the status of a production job.
 * Typically from "drafted" to "scheduled".
 */
export async function updateProductionJobStatus(
  jobId: string,
  newStatus: "scheduled" // Restrict to only allowed transitions for now
): Promise<{ success: boolean; message?: string }> {
  if (!jobId || !newStatus) {
    return { success: false, message: "Job ID and new status are required." };
  }
  console.log(`[updateProductionJobStatus] Updating job ${jobId} to status ${newStatus}`);
  return executeServerDbOperation(async (supabase) => {
    const { error } = await supabase
      .schema("production")
      .from("jobs")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("job_id", jobId)
      .eq("status", "drafted"); // IMPORTANT: Only allow update if current status is 'drafted'

    if (error) {
      console.error("[updateProductionJobStatus] Database error:", error);
      return { success: false, message: error.message };
    }
    // Optionally, check if any row was actually updated if needed.
    // const { count } = await ... (select count where updated)
    // if (count === 0) return { success: false, message: "Job not found or not in 'drafted' state." };
    console.log(`[updateProductionJobStatus] Job ${jobId} status updated to ${newStatus}`);
    return { success: true };
  });
}

/**
 * Server action - updates details of a production job IF IT IS IN DRAFT STATUS.
 */
export async function updateProductionJobDetails(
  jobId: string,
  details: Partial<ProductionJobData> // Use the same type as create for consistency
): Promise<{ success: boolean; message?: string }> {
  if (!jobId) {
    return { success: false, message: "Job ID is required." };
  }
  console.log(`[updateProductionJobDetails] Updating details for job ${jobId}:`, details);

  const { batchId, plannedDate, stillId, rawVolume, priority, jobName } = details;

  // Construct the update object, only including fields that are provided in 'details'
  const updateData: any = { updated_at: new Date().toISOString() };
  if (batchId !== undefined) updateData.input_batch_id = batchId;
  if (plannedDate !== undefined) updateData.planned_start = plannedDate;
  // Note: stillId and rawVolume are usually part of distillation_details, not directly on jobs table.
  // This update logic might need to target `production.distillation_details` for those.
  // For now, assuming these might be denormalized or handled via a more complex update RPC.
  // If they are on `jobs` table:
  // if (stillId !== undefined) updateData.still_id_on_job_table = stillId; // Example, if such field existed
  // if (rawVolume !== undefined) updateData.raw_volume_on_job_table = rawVolume; // Example
  if (priority !== undefined) updateData.priority = priority;
  if (jobName !== undefined) updateData.job_name = jobName;

  // If stillId or rawVolume need to update related operation/distillation_details,
  // a more specific RPC or multiple updates would be needed.
  // For this example, we only update fields directly on the `jobs` table based on ProductionJobData.

  if (Object.keys(updateData).length <= 1) { // Only updated_at
    return { success: false, message: "No details provided to update." };
  }

  return executeServerDbOperation(async (supabase) => {
    const { error } = await supabase
      .schema("production")
      .from("jobs")
      .update(updateData)
      .eq("job_id", jobId)
      .eq("status", "drafted"); // IMPORTANT: Only allow update if current status is 'drafted'

    if (error) {
      console.error("[updateProductionJobDetails] Database error:", error);
      return { success: false, message: error.message };
    }
    console.log(`[updateProductionJobDetails] Job ${jobId} details updated.`);
    return { success: true };
  });
}

/***************************
 * SHARED DROPDOWN HELPERS
 ***************************/
