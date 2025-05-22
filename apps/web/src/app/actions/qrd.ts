"use server";

import { executeServerDbOperation } from "@/lib/database";
import { SupabaseClient } from "@supabase/supabase-js";
import { QRDData, QRDFormData, emptyQRDData } from "@/features/production/types/qrd";

/**
 * Fetches QRD data for a specific distillation operation
 */
export async function fetchQRDData(operationId: string): Promise<QRDFormData | null> {
  if (!operationId) {
    console.error("[fetchQRDData] No operationId provided");
    return null;
  }

  return executeServerDbOperation(async (supabase: SupabaseClient) => {
    // Query to fetch all necessary data for the QRD form
    const { data, error } = await supabase
      // .schema('production')
      .from('v_distillation_schedule') // Using existing view, assuming it has the needed fields
      .select(`
        job_id,
        job_name,
        item_name,
        batch_code,
        supplier_name,
        op_id,
        scheduled_start,
        started_at,
        ended_at,
        op_status,
        still_id,
        still_code,
        raw_volume,
        expected_yield
      `)
      .eq('op_id', operationId)
      .single();

    if (error || !data) {
      console.error(`[fetchQRDData] Error fetching distillation data for operation ${operationId}:`, error);
      return null;
    }

    // Now get the QRD-specific data from the details field
    const { data: detailsData, error: detailsError } = await supabase
      .schema('production')
      .from('distillation_details')
      .select('details')
      .eq('op_id', operationId)
      .single();

    if (detailsError) {
      console.error(`[fetchQRDData] Error fetching details for operation ${operationId}:`, detailsError);
      return null;
    }

    // Combine the data into a single QRDFormData object
    const qrdData: QRDFormData = {
      // Job metadata
      jobId: data.job_id,
      jobName: data.job_name || 'Unnamed Job',
      materialName: data.item_name || 'Unknown Material',
      batchCode: data.batch_code || 'Unknown Batch',
      supplierName: data.supplier_name || 'Unknown Supplier',
      
      // Operation metadata
      operationId: data.op_id,
      scheduledStart: data.scheduled_start,
      startedAt: data.started_at,
      endedAt: data.ended_at,
      status: data.op_status,
      
      // Distillation details
      stillId: data.still_id,
      stillCode: data.still_code || 'Unknown Still',
      rawVolume: data.raw_volume,
      expectedYield: data.expected_yield,

      // QRD-specific data from the details JSONB field
      ...(detailsData?.details as Partial<QRDData> || emptyQRDData)
    };

    return qrdData;
  });
}

/**
 * Updates QRD data for a specific distillation operation
 */
export async function updateQRDData(
  operationId: string, 
  qrdData: Partial<QRDData>
): Promise<{ success: boolean; message?: string }> {
  if (!operationId) {
    return { success: false, message: "Operation ID is required" };
  }

  return executeServerDbOperation(async (supabase: SupabaseClient) => {
    console.log(`[updateQRDData] Updating QRD data for operation ${operationId}`);

    // First, get the current details to merge with the new data
    const { data: currentDetails, error: fetchError } = await supabase
      .schema('production')
      .from('distillation_details')
      .select('details')
      .eq('op_id', operationId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found, which is fine for new records
      console.error(`[updateQRDData] Error fetching current details:`, fetchError);
      return { success: false, message: fetchError.message };
    }

    // Merge current details with new data
    const mergedDetails = {
      ...(currentDetails?.details || {}),
      ...qrdData
    };

    // Update the distillation_details record
    const { error: updateError } = await supabase
      .schema('production')
      .from('distillation_details')
      .update({ 
        details: mergedDetails,
      })
      .eq('op_id', operationId);

    if (updateError) {
      console.error(`[updateQRDData] Error updating details:`, updateError);
      return { success: false, message: updateError.message };
    }

    // If this is the first time recording data, update the operation status
    // from 'pending' to 'active' if it's not already active or completed
    if (qrdData.setupTime && !currentDetails?.details?.setupTime) {
      const { error: statusError } = await supabase
        .schema('production')
        .from('operations')
        .update({ 
          status: 'active',
          started_at: new Date().toISOString() 
        })
        .eq('op_id', operationId)
        .eq('status', 'pending');

      if (statusError) {
        console.error(`[updateQRDData] Error updating operation status:`, statusError);
        // Non-critical error, we still updated the QRD data successfully
      }
    }

    // If final data is being added, update operation status to 'completed'
    if (qrdData.completedBy && !currentDetails?.details?.completedBy) {
      const { error: completeError } = await supabase
        .schema('production')
        .from('operations')
        .update({ 
          status: 'completed',
          ended_at: new Date().toISOString() 
        })
        .eq('op_id', operationId)
        .eq('status', 'active');

      if (completeError) {
        console.error(`[updateQRDData] Error completing operation:`, completeError);
        // Non-critical error
      }
    }

    return { success: true };
  });
}

/**
 * Updates the expected yield for a distillation operation
 */
export async function updateExpectedYield(
  operationId: string,
  expectedYield: number
): Promise<{ success: boolean; message?: string }> {
  if (!operationId) {
    return { success: false, message: "Operation ID is required" };
  }

  return executeServerDbOperation(async (supabase: SupabaseClient) => {
    const { error } = await supabase
      .schema('production')
      .from('distillation_details')
      .update({ expected_yield: expectedYield })
      .eq('op_id', operationId);

    if (error) {
      console.error(`[updateExpectedYield] Error:`, error);
      return { success: false, message: error.message };
    }

    return { success: true };
  });
}

/**
 * Fetches a list of active distillation operations for the QRD form selection
 */
export async function fetchActiveDistillationOperations(): Promise<any[]> {
  return executeServerDbOperation(async (supabase: SupabaseClient) => {
    const { data, error } = await supabase
      .from('v_distillation_schedule')
      .select(`
        job_id,
        job_name,
        item_name,
        op_id,
        scheduled_start,
        started_at,
        op_status,
        still_code
      `)
      .in('op_status', ['pending', 'active'])
      .eq('op_type', 'distillation')
      .order('scheduled_start', { ascending: false });

    if (error) {
      console.error('[fetchActiveDistillationOperations] Error:', error);
      return [];
    }

    return data || [];
  });
}