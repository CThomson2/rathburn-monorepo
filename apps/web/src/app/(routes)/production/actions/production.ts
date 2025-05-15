'use server';

import { executeServerDbOperation } from "@/lib/database";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  Order,
  mapJobStatusToOrderStatus,
  getProgressFromStatus,
  getPriorityFromJob,
} from "@/features/production/types";
import { fetchSuppliers, fetchItemsBySupplier } from "@/app/actions/orders";

/***************************
 * READ ACTIONS
 ***************************/

/**
 * Returns a list of upcoming / recent production jobs.
 * Joins helper tables to give the UI meaningful strings.
 */
export async function fetchProductionJobs(): Promise<Order[]> {
  return executeServerDbOperation(async (supabase: SupabaseClient) => {
    // A simple query for now – can be replaced with a dedicated view later.
    const { data: jobs, error } = await supabase
      .schema("production")
      .from("jobs")
      .select(
        `job_id,
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
         operations!job_id ( op_id, op_type, status, scheduled_start, started_at, ended_at )`
      )
      .order("created_at", { ascending: false });

    if (error || !jobs) {
      console.error("[fetchProductionJobs]", error);
      return [];
    }

    return jobs.map((job: any) => ({
      id: `JOB-${job.job_id.slice(0, 8)}`,
      itemName: job.items?.name ?? "Unknown Item",
      supplier: job.items?.suppliers?.name ?? "Unknown Supplier",
      quantity: 0, // placeholder until operation_drums implemented
      scheduledDate: job.planned_start ?? job.created_at,
      status: mapJobStatusToOrderStatus(job.status),
      progress: getProgressFromStatus(job.status),
      priority: getPriorityFromJob(job),
      drums: [],
      tasks: job.operations?.map((op: any) => ({
        name: `${op.op_type}`,
        completed: op.status === "completed",
        assignedTo: "",
      })) ?? [],
      timeline:
        job.operations
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
          .sort((a: any, b: any) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          ) ?? [],
    }));
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
    return data as Array<{ still_id: number; code: string; max_capacity: number }>;
  });
}

/**
 * Returns batches containing the requested item with drums currently in stock.
 */
export async function fetchAvailableBatchesByItem(
  itemId: string
): Promise<
  Array<{ batch_id: string; batch_code: string | null; drums_in_stock: number }>
> {
  if (!itemId) return [];
  return executeServerDbOperation(async (supabase) => {
    const { data, error } = await supabase
      .from("v_batches_with_drums")
      .select("batch_id, batch_code, drums_in_stock")
      .eq("item_id", itemId)
      .gt("drums_in_stock", 0);

    if (error) {
      console.error("[fetchAvailableBatchesByItem]", error);
      return [];
    }
    return data as Array<{ batch_id: string; batch_code: string | null; drums_in_stock: number }>;
  });
}

/***************************
 * WRITE ACTIONS
 ***************************/

interface ProductionFormData {
  itemId: string;
  batchId: string;
  plannedDate: string; // ISO string
  stillId: number;
  rawVolume: number;
  priority?: number;
}

/**
 * Parse formData sent from ProductionForm (client component)
 */
function parseProductionFormData(formData: FormData): ProductionFormData | null {
  try {
    const itemId = formData.get("itemId") as string;
    const batchId = formData.get("batchId") as string;
    const plannedDate = formData.get("plannedDate") as string;
    const stillIdStr = formData.get("stillId") as string;
    const rawVolumeStr = formData.get("rawVolume") as string;
    const priorityStr = formData.get("priority") as string | null;

    if (!itemId || !batchId || !plannedDate || !stillIdStr || !rawVolumeStr) {
      return null;
    }

    return {
      itemId,
      batchId,
      plannedDate,
      stillId: parseInt(stillIdStr, 10),
      rawVolume: parseFloat(rawVolumeStr),
      priority: priorityStr ? parseInt(priorityStr, 10) : undefined,
    };
  } catch (err) {
    console.error("[parseProductionFormData]", err);
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
  const parsed = parseProductionFormData(formData);
  if (!parsed) {
    return { success: false, message: "Missing or invalid form fields" };
  }

  const { itemId, batchId, plannedDate, stillId, rawVolume, priority } = parsed;

  return executeServerDbOperation(async (supabase) => {
    const { data, error } = await supabase
      .schema("production")
    .rpc("create_distillation_job", {
        p_item_id: itemId,
        p_batch_id: batchId,
        p_planned_start: plannedDate,
        p_still_id: stillId,
        p_raw_volume: rawVolume,
        p_priority: priority ?? 10,
      });

    if (error) {
      console.error("[createProductionJob]", error);
      return { success: false, message: error.message };
    }

    return { success: true, jobId: data as string };
  });
}

/***************************
 * SHARED DROPDOWN HELPERS
 ***************************/

// We simply re-export the supplier & item helpers from orders actions so the
// production form can import from a single location.

export { fetchSuppliers, fetchItemsBySupplier };