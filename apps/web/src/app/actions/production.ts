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
    const { data: job, error } = await supabase
      .schema("production")
      .from("jobs")
      .select(
        `job_id,
         job_name
         item_id,
         input_batch_id,
         status,
         priority,
         planned_start,
         planned_end,
         created_at,
         updated_at,
         items:item_id ( name, suppliers:supplier_id ( name ) ),
         batches:input_batch_id ( batch_code ),
         operations!job_id ( 
           op_id, 
           op_type, 
           status, 
           scheduled_start, 
           started_at, 
           ended_at,
           distillation_details ( still_id, raw_volume, stills (code, max_capacity) ),
           operation_drums ( drum_id, volume_transferred, drums (serial_number, current_volume) )
          )
        `
      )
      .eq("job_id", jobId)
      .single();

    if (error || !job) {
      console.error(`[fetchProductionJobById: ${jobId}]`, error);
      return null;
    }

    const mappedJobs = [job].map((j: any) => ({
      id: j.job_id,
      jobName: j.job_name ?? `${j.items?.name} - (${j.batches?.batch_code})`,
      itemName: j.items?.name ?? "Unknown Item",
      supplier: j.items?.suppliers?.name ?? "Unknown Supplier",
      quantity:
        j.operations?.reduce(
          (acc: number, op: any) =>
            acc +
            (op.operation_drums?.reduce(
              (sum_vol: number, od: any) =>
                sum_vol + (od.volume_transferred || 0),
              0
            ) || 0) /
              200,
          0
        ) ?? 0,
      scheduledDate: j.planned_start ?? j.created_at,
      status: mapJobStatusToOrderStatus(j.status),
      progress: getProgressFromStatus(j.status),
      priority: getPriorityFromJob(j),
      drums:
        j.operations?.flatMap(
          (op: any) =>
            op.operation_drums?.map((od: any) => ({
              id: od.drum_id,
              serial: od.drums?.serial_number ?? "N/A",
              volume: od.volume_transferred ?? od.drums?.current_volume ?? 0,
              location: "N/A",
            })) || []
        ) ?? [],
      tasks:
        j.operations?.map((op: any) => ({
          name: `${op.op_type}`,
          completed: op.status === "completed",
          assignedTo: "",
          details: op.distillation_details
            ? `Still: ${op.distillation_details.stills?.code}, Raw Volume: ${op.distillation_details.raw_volume}L`
            : undefined,
          status: op.status,
        })) ?? [],
      timeline:
        j.operations
          ?.filter((op: any) => op.started_at || op.ended_at)
          .flatMap((op: any) => {
            const events = [] as any[];
            if (op.started_at) {
              events.push({
                event: `${op.op_type} started`,
                timestamp: op.started_at,
                user: "system",
              });
            }
            if (op.ended_at) {
              events.push({
                event: `${op.op_type} completed`,
                timestamp: op.ended_at,
                user: "system",
              });
            }
            return events;
          })
          .sort(
            (a: any, b: any) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          ) ?? [],
    }));
    return mappedJobs[0] || null;
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

interface ProductionFormData {
  batchId: string;
  plannedDate: string; // ISO string
  stillId: number;
  rawVolume: number;
  priority?: number;
}

/**
 * Parse formData sent from ProductionForm (client component)
 */
function parseProductionFormData(
  formData: FormData
): ProductionFormData | null {
  console.log("[parseProductionFormData] Starting to parse form data");
  try {
    const batchId = formData.get("batchId") as string;
    const plannedDate = formData.get("plannedDate") as string;
    const stillIdStr = formData.get("stillId") as string;
    const rawVolumeStr = formData.get("rawVolume") as string;
    const priorityStr = formData.get("priority") as string | null;

    console.log("[parseProductionFormData] Raw form values:", {
      batchId,
      plannedDate,
      stillIdStr,
      rawVolumeStr,
      priorityStr
    });

    if (!batchId || !plannedDate || !stillIdStr || !rawVolumeStr) {
      console.log("[parseProductionFormData] Missing required fields");
      return null;
    }

    const parsedData = {
      batchId,
      plannedDate,
      stillId: parseInt(stillIdStr, 10),
      rawVolume: parseFloat(rawVolumeStr),
      priority: priorityStr ? parseInt(priorityStr, 10) : undefined,
    };
    
    console.log("[parseProductionFormData] Parsed data:", parsedData);
    return parsedData;
  } catch (err) {
    console.error("[parseProductionFormData] Error parsing form data:", err);
    return null;
  }
}

/**
 * Server action – creates a new distillation job via the DB function.
 */
export async function createProductionJob(formData: FormData): Promise<{
  success: boolean;
  jobId?: string;
  message?: string;
}> {
  console.log("[createProductionJob] Starting job creation");
  const parsed = parseProductionFormData(formData);
  if (!parsed) {
    console.log("[createProductionJob] Failed to parse form data");
    return { success: false, message: "Missing or invalid form fields" };
  }

  const { batchId, plannedDate, stillId, rawVolume, priority } = parsed;
  console.log("[createProductionJob] Parsed data:", { batchId, plannedDate, stillId, rawVolume, priority });

  return executeServerDbOperation(async (supabase) => {
    console.log("[createProductionJob] Calling database function");
    const { data, error } = await supabase
      .schema("production")
      .rpc("create_distillation_job", {
        p_batch_id: batchId,
        p_planned_start: plannedDate,
        p_still_id: stillId,
        p_raw_volume: rawVolume,
        p_priority: priority ?? 10,
      });

    if (error) {
      console.error("[createProductionJob] Database error:", error);
      return { success: false, message: error.message };
    }

    console.log("[createProductionJob] Job created successfully with ID:", data);
    return { success: true, jobId: data as string };
  });
}

/***************************
 * SHARED DROPDOWN HELPERS
 ***************************/
