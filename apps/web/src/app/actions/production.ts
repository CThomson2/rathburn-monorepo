"use server";

import { executeServerDbOperation } from "@/lib/database";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  getPriorityFromJob,
  JobStatus,
  OperationStatus,
  ProductionJobData,
  ProductionJobViewData,
  mapJobStatusToDisplayStatus,
  getProgressFromDbJobStatus,
  OperationType,
} from "@/features/production/types";

/***************************
 * READ ACTIONS
 ***************************/

/**
 * Returns a list of upcoming / recent production jobs.
 * Joins helper tables to give the UI meaningful strings.
 */
export async function fetchProductionJobs(): Promise<ProductionJobViewData[]> {
  return executeServerDbOperation(async (supabase: SupabaseClient) => {
    const { data: viewData, error } = await supabase
      .schema("production")
      .from("v_operation_schedule")
      .select("*");

    if (error || !viewData) {
      console.error("[fetchProductionJobs]", error);
      return [];
    }

    return viewData.map((job: any) => {
      const dbJobStatus = job.job_status as JobStatus;
      const displayStatus = mapJobStatusToDisplayStatus(dbJobStatus);
      
      const activeOpTypeFromView = job.active_operation_type as OperationType | undefined;

      return {
        id: job.job_id,
        jobName: job.job_name ?? job.job_id.slice(0, 8),
        itemName: job.item_name ?? "Unknown Item",
        supplier: job.supplier_name ?? "Unknown Supplier",
        quantity: typeof job.raw_volume === 'number' ? job.raw_volume / 200 : 0,
        scheduledDate: job.scheduled_start ?? job.job_created_at,
        status: mapJobStatusToDisplayStatus(dbJobStatus, activeOpTypeFromView),
        progress: getProgressFromDbJobStatus(dbJobStatus),
        priority: getPriorityFromJob({priority: job.priority}),
        activeOperationType: activeOpTypeFromView,
        drums: job.drum_id && job.drum_serial_number
          ? [
              {
                id: job.drum_id,
                serial: job.drum_serial_number,
                volume: typeof job.volume_transferred === 'number' ? job.volume_transferred : (typeof job.drum_current_volume === 'number' ? job.drum_current_volume : 0),
                location: job.drum_location ?? "N/A",
              },
            ]
          : [],
        tasks: job.op_id ? [
          {
            op_id: job.op_id,
            name: job.op_type ? (job.op_type as string).replace(/_/g, " ") : "Operation",
            op_type: job.op_type as OperationType,
            completed: job.op_status === "completed",
            details: job.still_code && typeof job.raw_volume === 'number'
              ? `Still: ${job.still_code}, Raw Vol: ${job.raw_volume}L, Max Cap: ${job.still_max_capacity ? job.still_max_capacity * 200 : 'N/A'}L`
              : undefined,
            status: job.op_status as OperationStatus,
            started_at: job.started_at,
            ended_at: job.ended_at,
          },
        ] : [],
        timeline: [],
      };
    });
  });
}

/** Fetches details for a single production job */
export async function fetchProductionJobById(
  jobId: string
): Promise<ProductionJobViewData | null> {
  if (!jobId) return null;

  return executeServerDbOperation(async (supabase: SupabaseClient) => {
    const { data: jobDataRows, error } = await supabase
      .from("v_production_job_details")
      .select("*")
      .eq("job_id", jobId);

    if (error || !jobDataRows || jobDataRows.length === 0) {
      console.error(`[fetchProductionJobById: ${jobId}] Error fetching job details:`, error);
      return null;
    }

    let activeOperationType: OperationType | undefined = undefined;
    for (const row of jobDataRows) {
      if (row.operation_status === 'active' && row.op_type) {
        activeOperationType = row.op_type as OperationType;
        break;
      }
    }
    
    const firstRow = jobDataRows[0];
    const dbJobStatus = firstRow.job_status as JobStatus;

    const aggregatedJob: ProductionJobViewData = {
      id: firstRow.job_id,
      jobName: firstRow.job_name ?? `${firstRow.item_name} - (${firstRow.batch_code ?? 'N/A'})`,
      batch_id: firstRow.input_batch_id,
      batch_code: firstRow.batch_code,
      item_id: firstRow.item_id,
      material_id: firstRow.material_id,
      itemName: firstRow.item_name ?? "Unknown Item",
      supplier: firstRow.supplier_name ?? "Unknown Supplier",
      quantity: 0,
      scheduledDate: firstRow.job_planned_start ?? firstRow.job_created_at,
      status: mapJobStatusToDisplayStatus(dbJobStatus, activeOperationType),
      progress: getProgressFromDbJobStatus(dbJobStatus),
      priority: getPriorityFromJob({ priority: firstRow.job_priority }),
      activeOperationType: activeOperationType,
      drums: [],
      tasks: [],
      timeline: [],
    };

    const operationMap = new Map<string, NonNullable<ProductionJobViewData['tasks']>[0]>();
    const drumMap = new Map<string, NonNullable<ProductionJobViewData['drums']>[0]>();

    for (const row of jobDataRows) {
      if (row.drum_serial_number && !drumMap.has(row.drum_serial_number)) {
        drumMap.set(row.drum_serial_number, {
          id: row.drum_id ?? row.drum_serial_number,
          serial: row.drum_serial_number,
          volume: row.operation_drum_volume_transferred ?? row.drum_current_volume ?? 0,
          location: row.drum_location ?? 'N/A',
        });
      }

      if (row.op_id && !operationMap.has(row.op_id)) {
        let taskDetails = "";
        if (row.op_type === 'distillation' && row.still_code) {
          taskDetails = `Still: ${row.still_code}, Raw Vol: ${row.distillation_raw_volume ?? 'N/A'}L, Max Cap: ${row.still_max_capacity ? row.still_max_capacity * 200 : 'N/A'}L`;
        }
        operationMap.set(row.op_id, {
          op_id: row.op_id,
          name: row.op_type ? (row.op_type as string).replace(/_/g, " ") : 'Operation',
          op_type: row.op_type as OperationType,
          completed: row.operation_status === "completed",
          details: taskDetails || undefined,
          status: row.operation_status as OperationStatus,
          started_at: row.operation_started_at,
          ended_at: row.operation_ended_at,
        });
      }
    }

    aggregatedJob.drums = Array.from(drumMap.values());
    aggregatedJob.tasks = Array.from(operationMap.values()).sort((a, b) => {
        const order = ['preparation', 'distillation', 'qc', 'packaging', 'decanting', 'split', 'transport', 'goods_in'] as OperationType[];
        const aIndex = a.op_type ? order.indexOf(a.op_type) : -1;
        const bIndex = b.op_type ? order.indexOf(b.op_type) : -1;
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (a.started_at && b.started_at) return new Date(a.started_at).getTime() - new Date(b.started_at).getTime();
        if (a.name && b.name) return a.name.localeCompare(b.name);
        return 0;
    });
    
    aggregatedJob.quantity = aggregatedJob.drums.reduce((acc, drum) => acc + (drum.volume || 0), 0) / 200;

    const timelineEvents: NonNullable<ProductionJobViewData['timeline']> = [];
    aggregatedJob.tasks.forEach(op => {
      if (op.started_at) {
        timelineEvents.push({
          event: `${op.name} started`,
          timestamp: op.started_at,
          user: "system", 
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

    return aggregatedJob;
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
    return data;
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
  if (!materialId) {
    return [];
  }
  
  return executeServerDbOperation(async (supabase) => {
    const { data: itemData, error: itemError } = await supabase
      .schema("inventory")
      .from("items")
      .select("item_id, name")
      .eq("material_id", materialId);

    if (itemError || !itemData) {
      console.error("[fetchAvailableBatchesByMaterial: itemError]", itemError);
      return [];
    }
    if (itemData.length === 0) {
        console.log("[fetchAvailableBatchesByMaterial] No items found for materialId:", materialId);
        return [];
    }

    const { data: batchData, error: batchError } = await supabase
      .from("v_batches_with_drums")
      .select("batch_id, batch_code, drums_in_stock, supplier_name")
      .in("item_id", itemData.map((item) => item.item_id))
      .gt("drums_in_stock", 0);

    if (batchError) {
      console.error("[fetchAvailableBatchesByMaterial: batchError]", batchError);
      return [];
    }

    return batchData.filter(batch => batch.batch_id !== null) as Array<{
      batch_id: string,
      batch_code: string | null,
      drums_in_stock: number,
      supplier_name: string | null,
    }>;
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
  const { batchId, plannedDate, stillId, rawVolume, priority, jobName, jobStatus, createdBy } = jobData;

  return executeServerDbOperation(async (supabase) => {
    const { data, error } = await supabase
      .schema("production")
      .rpc("create_production_job", {
        p_user_id: createdBy,
        p_batch_id: batchId,
        p_planned_start: plannedDate,
        p_still_id: stillId,
        p_raw_volume: rawVolume,
        p_priority: priority ?? 5,
        p_job_name: jobName,
        p_job_status: jobStatus,
      });

    if (error) {
      console.error("[createProductionJob] Database error:", error);
      return { success: false, message: error.message };
    }
    return { success: true, jobId: data as string };
  });
}

/**
 * Server action - updates the status of a production job.
 */
export async function updateProductionJobStatus(
  jobId: string,
  newStatus: JobStatus
): Promise<{ success: boolean; message?: string }> {
  if (!jobId || !newStatus) {
    return { success: false, message: "Job ID and new status are required." };
  }
  return executeServerDbOperation(async (supabase) => {
    const { error } = await supabase
      .schema("production")
      .rpc("update_job_status_rpc", {
        p_job_id: jobId,
        p_new_status: newStatus,
      });

    if (error) {
      console.error("[updateProductionJobStatus] Database error:", error);
      return { success: false, message: error.message };
    }
    return { success: true };
  });
}

/**
 * Server action - updates details of a production job IF IT IS IN DRAFT STATUS.
 */
export async function updateProductionJobDetails(
  jobId: string,
  details: Partial<Omit<ProductionJobData, 'jobStatus' | 'createdBy'> & { jobName?: string, priority?: number }>
): Promise<{ success: boolean; message?: string }> {
  if (!jobId) {
    return { success: false, message: "Job ID is required." };
  }

  const { batchId, plannedDate, stillId, rawVolume, priority, jobName } = details;
  const updatePayload: any = { updated_at: new Date().toISOString() };

  if (details.hasOwnProperty('batchId')) updatePayload.input_batch_id = batchId;
  if (details.hasOwnProperty('plannedDate')) updatePayload.planned_start = plannedDate;
  if (details.hasOwnProperty('priority')) updatePayload.priority = priority;
  if (details.hasOwnProperty('jobName')) updatePayload.job_name = jobName;
  
  if (details.hasOwnProperty('stillId')) {
    console.warn("[updateProductionJobDetails] stillId update needs to target operations or distillation_details, not implemented for direct job update yet.");
  }
  if (details.hasOwnProperty('rawVolume')) {
    console.warn("[updateProductionJobDetails] rawVolume update needs to target operations or distillation_details, not implemented for direct job update yet.");
  }

  if (Object.keys(updatePayload).length <= 1) {
    return { success: true, message: "No updatable details provided." };
  }

  return executeServerDbOperation(async (supabase) => {
    const { error, count } = await supabase
      .schema("production")
      .from("jobs")
      .update(updatePayload)
      .eq("job_id", jobId)
      .eq("status", "drafted")
      .select();

    if (error) {
      console.error("[updateProductionJobDetails] Database error:", error);
      return { success: false, message: error.message };
    }
    if (count === 0) {
        return { success: false, message: "Job not found in 'drafted' state or no changes made." };
    }
    return { success: true };
  });
}

/***************************
 * SHARED DROPDOWN HELPERS
 ***************************/
