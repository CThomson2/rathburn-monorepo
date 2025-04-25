import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/models/supabase";
import { Order, mapJobStatusToOrderStatus, getProgressFromStatus, getPriorityFromJob } from "../types";

/**
 * Fetches production orders from Supabase
 * Combines data from jobs, operations, and drum tables
 */
export const fetchProductionOrders = async (
  supabase: SupabaseClient<Database, 'public' | 'production' | 'inventory'>
): Promise<Order[]> => {
  try {
    // Fetch jobs with related item information
    const { data: jobs, error: jobsError } = await supabase
      .from("production.jobs")
      .select(`
        job_id,
        input_batch_id,
        item_id,
        status,
        priority,
        planned_start,
        planned_end,
        operations:operations(*)
      `)
      .order("priority", { ascending: false });

    if (jobsError) {
      console.error("Error fetching jobs:", jobsError);
      throw jobsError;
    }

    if (!jobs || jobs.length === 0) {
      return [];
    }

    // Fetch related drums information 
    const jobIds = jobs.map((job) => job.job_id);
    const { data: operations, error: opsError } = await supabase
      .from("production.operations")
      .select(`
        op_id,
        job_id,
        op_type,
        status,
        started_at,
        ended_at,
        operation_drums:operation_drums(
          drum_id,
          volume_transferred
        )
      `)
      .in("job_id", jobIds);

    if (opsError) {
      console.error("Error fetching operations:", opsError);
      // Continue without operations data
    }

    // Get drum details for all operations
    let allDrumIds: string[] = [];
    operations?.forEach(op => {
      if (op.operation_drums) {
        // @ts-ignore - TypeScript doesn't know the structure of the nested data
        op.operation_drums.forEach((drum: any) => {
          if (drum.drum_id) allDrumIds.push(drum.drum_id);
        });
      }
    });

    // Fetch details for all drums
    const { data: drums, error: drumsError } = await supabase
      .from("inventory.drums")
      .select(`
        drum_id,
        serial_number,
        current_volume,
        current_location,
        status
      `)
      .in("drum_id", allDrumIds);

    if (drumsError) {
      console.error("Error fetching drums:", drumsError);
      // Continue without drum details
    }

    // Map to the Order type expected by the UI
    const orders: Order[] = jobs.map((job) => {
      // Find operations for this job
      const jobOperations = operations?.filter(op => op.job_id === job.job_id) || [];
      
      // Find timeline events from operations
      const timeline = jobOperations.map(op => ({
        event: `${op.op_type.charAt(0).toUpperCase() + op.op_type.slice(1)} ${op.status}`,
        timestamp: op.started_at || new Date().toISOString(),
        user: "System" // We don't have user info in the operations table
      }));

      // Find drums associated with this job
      let jobDrums: Order["drums"] = [];
      if (drums && drums.length > 0) {
        const drumIds = new Set<string>();
        jobOperations.forEach(op => {
          // @ts-ignore - TypeScript doesn't know the structure of the nested data
          op.operation_drums?.forEach((opDrum: any) => {
            if (opDrum.drum_id) drumIds.add(opDrum.drum_id);
          });
        });

        jobDrums = drums
          .filter(d => drumIds.has(d.drum_id))
          .map(d => ({
            id: d.drum_id,
            serial: d.serial_number,
            volume: d.current_volume,
            location: d.current_location || "Unknown"
          }));
      }

      // Create tasks based on the job's operations
      const tasks = [
        { 
          name: "Prepare raw materials", 
          completed: jobOperations.some(op => op.op_type === "preparation" && op.status === "completed") 
        },
        { 
          name: "Set up distillation equipment", 
          completed: jobOperations.some(op => op.op_type === "distillation" && op.status === "completed") 
        },
        { 
          name: "Run quality checks", 
          completed: jobOperations.some(op => op.op_type === "qc" && op.status === "completed") 
        }
      ];

      // Map the database job to the UI Order type
      return {
        id: job.job_id,
        itemName: job.item_id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '), // Format item_id as item name
        supplier: "Unknown", // We don't have supplier info in jobs table
        quantity: job.priority || 1, // Using priority as a placeholder for quantity
        scheduledDate: job.planned_start || new Date().toISOString(),
        status: mapJobStatusToOrderStatus(job.status),
        progress: getProgressFromStatus(job.status),
        priority: getPriorityFromJob(job),
        drums: jobDrums,
        timeline,
        tasks
      };
    });

    return orders;
  } catch (error) {
    console.error("Error in fetchProductionOrders:", error);
    throw error;
  }
}; 