"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

type ScanAction =
  | "context_get"
  | "context_set"
  | "transport"
  | "location_set"
  | "barcode_scan"
  | "cancel_scan"
  | "fast_forward"
  | "bulk";

interface ScanActionParams {
  barcode: string;
  jobId: number;
  action: ScanAction;
}

/**
 * Process a barcode scan for a job in the transport view.
 * 
 * The `action` parameter determines how the scan is processed:
 * - `barcode_scan`: Insert a new record into the `drum_scan` table
 *   with the given `barcode` and `jobId`.
 * - `cancel_scan`: Insert a new record into the `drum_scan` table
 *   with the given `barcode` and `jobId`, and set the `action_type`
 *   to `'cancel'`.
 * - `bulk`: Insert a new record into the `drum_scan` table with the
 *   given `barcode` and `jobId`, and set the `scan_method` to
 *   `'bulk_registration'`.
 * 
 * The function will return an object with a `success` property and
 * either a `data` property with the inserted record, or an `error`
 * property with an error message.
 * 
 * @param {string} barcode The scanned barcode
 * @param {number} jobId The ID of the job the scan is for
 * @param {ScanAction} action The action to take for the scan
 * @returns {Promise<{ success: boolean, data?: any, error?: string }>} The result of the scan processing
 */
export async function processBarcodeScan({
  barcode,
  jobId,
  action
}: ScanActionParams) {
  try {
    // Create Supabase client with server auth context
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    // Get current user session for user_id
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: "Unauthorized - User not logged in" };
    }
    
    const userId = session.user.id;
    
    // Get device information (in a real app, this would be passed from the client)
    const deviceId = "device-123"; // Mock device ID - replace with actual device ID
    
    // Determine action type for the logs.drum_scan table
    const actionType = action === 'cancel_scan' ? 'cancel' : 'barcode_scan';
    
    // Insert into logs.drum_scan table
    const { data: scanData, error: scanError } = await supabase
      .from('drum_scan')
      .insert({
        user_id: userId,
        device_id: deviceId,
        raw_barcode: barcode,
        detected_drum: barcode, // Assuming barcode matches drum ID directly
        action_type: actionType,
        status: 'success',
        metadata: {
          job_id: jobId,
          scan_method: action === 'bulk' ? 'bulk_registration' : 'single_scan',
          app_version: '1.0.0'
        }
      })
      .select();
    
    if (scanError) {
      console.error("Error inserting scan record:", scanError);
      return { success: false, error: "Failed to record scan" };
    }
    
    // If this is a scan (not cancel), update the job progress
    // In a real app, you would update a jobs table in the database
    if (action !== 'cancel_scan') {
      // Mock job update - replace with actual database update
      // Reset progress bar in UI by one (or all if bulk cancellation)
      console.log(`Updated job ${jobId} for drum ${barcode}`);
    }
    
    // Revalidate the transport page to reflect the changes
    revalidatePath('/mobile/transport');
    
    return { 
      success: true, 
      data: scanData[0]
    };
    
  } catch (error) {
    console.error("Error processing scan:", error);
    return { 
      success: false, 
      error: "An unexpected error occurred" 
    };
  }
}