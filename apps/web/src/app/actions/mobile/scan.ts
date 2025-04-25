// /src/app/actions/mobile/scan.ts (updated version)
"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { sendScanEvent } from "@/app/api/events/scan/route";

// Update the type to match the document you shared
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
  deviceId?: string;
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
  action,
  deviceId
}: ScanActionParams) {
  try {
    // Create Supabase client with server auth context
    const supabase = createClient();
    
    // Get current user session for user_id
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: "Unauthorized - User not logged in" };
    }
    
    const userId = session.user.id;
    
    // Get device information from the headers if not provided
    let actualDeviceId = deviceId;
    if (!actualDeviceId) {
      const headersList = headers();
      // Try to get from user agent or other headers
      const userAgent = headersList.get('user-agent') || '';
      actualDeviceId = userAgent.includes('CK67') ? 'CK67-device' : 
                       userAgent.includes('CT47') ? 'CT47-device' : 
                       'unknown-device';
    }
    
    // Determine action type for the logs.drum_scan table
    const actionType = action === 'cancel_scan' ? 'cancel' : 'barcode_scan';
    
    // Insert into logs.drum_scan table
    const { data: scanData, error: scanError } = await supabase
      .from('drum_scan')
      .insert({
        user_id: userId,
        device_id: actualDeviceId,
        raw_barcode: barcode,
        detected_drum: barcode, // Assuming barcode matches drum ID directly
        action_type: actionType,
        status: 'success',
        metadata: {
          job_id: jobId,
          scan_method: action === 'bulk' ? 'bulk_registration' : 'single_scan',
          app_version: '1.0.0',
          source: 'mobile_app'
        }
      })
      .select();
    
    if (scanError) {
      console.error("Error inserting scan record:", scanError);
      
      // Send SSE event for error
      try {
        await sendScanEvent(jobId.toString(), {
          type: 'scan_error',
          barcode,
          jobId,
          action,
          error: scanError.message,
          timestamp: new Date().toISOString()
        });
      } catch (sseError) {
        console.error("Error sending SSE event:", sseError);
      }
      
      return { success: false, error: "Failed to record scan" };
    }
    
    // If this is a scan (not cancel), update the job progress
    if (action !== 'cancel_scan') {
      // This would be where you update your job progress tracking
      // For example, updating a transport_jobs table
      
      // For now, just log it
      console.log(`Updated job ${jobId} for drum ${barcode}`);
    }
    
    // Revalidate related paths to reflect the changes
    revalidatePath('/mobile/transport');
    revalidatePath('/dashboard/transport');
    
    // Send SSE event for successful scan
    try {
      await sendScanEvent(jobId.toString(), {
        type: 'scan_success',
        barcode,
        jobId,
        action,
        scanId: scanData[0].scan_id,
        timestamp: new Date().toISOString()
      });
    } catch (sseError) {
      console.error("Error sending SSE event:", sseError);
    }
    
    return { 
      success: true, 
      data: scanData[0],
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error("Error processing scan:", error);
    
    // Try to send SSE event for error
    try {
      await sendScanEvent(jobId.toString(), {
        type: 'scan_exception',
        barcode,
        jobId,
        action,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    } catch (sseError) {
      console.error("Error sending SSE event:", sseError);
    }
    
    return { 
      success: false, 
      error: "An unexpected error occurred",
      errorDetail: error instanceof Error ? error.message : String(error)
    };
  }
}