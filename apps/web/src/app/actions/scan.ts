// /src/app/actions/scan.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { sendScanEvent } from "@/app/api/scanner/events/scan/route";
import { ScanMode, ScanEvent } from "@rathburn/types";

interface ScanActionParams {
  barcode: string;
  jobId?: number;
  scan_mode: ScanMode;
  deviceId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Process a barcode scan.
 * 
 * Inserts a record into the `logs.drum_scan` table with the provided
 * details, including the scan_mode ('single' or 'bulk').
 * 
 * Sends SSE events for success or failure.
 * 
 * @param {ScanActionParams} params - The scan parameters.
 * @returns {Promise<{ success: boolean, data?: any, error?: string, errorDetail?: string }>} The result of the scan processing.
 */
export async function processBarcodeScan({
  barcode,
  jobId,
  scan_mode,
  deviceId,
  metadata = {}
}: ScanActionParams): Promise<{ success: boolean, data?: any, error?: string, errorDetail?: string }> {
  let sseEventPayload: Partial<ScanEvent> = {
      barcode,
      jobId,
      scan_mode,
  };
  
  try {
    // Create Supabase client with server auth context
    const supabase = createClient();
    
    // Get current user session for user_id
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      sseEventPayload.type = 'scan_error';
      sseEventPayload.error = 'Unauthorized - User not logged in';
      if (jobId) sendScanEvent(jobId.toString(), sseEventPayload as ScanEvent).catch(console.error);
      return { success: false, error: "Unauthorized - User not logged in" };
    }
    
    const userId = session.user.id;
    
    // Get device information from the headers if not provided
    let actualDeviceId = deviceId;
    if (!actualDeviceId) {
      const headersList = headers();
      // Try to get from user agent or other headers
      const userAgent = headersList.get('user-agent') || '';
      // Simplified device ID logic - consider a more robust approach
      actualDeviceId = userAgent.substring(0, 50); // Example: truncate user agent
      if (!actualDeviceId) actualDeviceId = 'unknown-web-device';
    }
    
    // Prepare metadata, ensuring job_id is included if present
    const finalMetadata = {
        ...metadata,
        ...(jobId && { job_id: jobId }), // Conditionally add job_id
        app_version: '1.0.0', // Example version
        source: 'web_or_mobile_backend'
    };

    // Insert into logs.drum_scan table
    const { data: scanData, error: scanError } = await supabase
      .from('drum_scan')
      .insert({
        user_id: userId,
        device_id: actualDeviceId,
        raw_barcode: barcode,
        scan_mode: scan_mode,
        status: 'success',
        metadata: finalMetadata
      })
      .select()
      .single();
    
    if (scanError) {
      console.error("Error inserting scan record:", scanError);
      sseEventPayload.type = 'scan_error';
      sseEventPayload.error = scanError.message;
      if (jobId) sendScanEvent(jobId.toString(), sseEventPayload as ScanEvent).catch(console.error);
      return { success: false, error: "Failed to record scan", errorDetail: scanError.message };
    }
    
    // Send SSE event for successful scan
    sseEventPayload.type = 'scan_success';
    sseEventPayload.scanId = scanData.scan_id;
    if (jobId) sendScanEvent(jobId.toString(), sseEventPayload as ScanEvent).catch(console.error);
    
    return { 
      success: true, 
      data: scanData,
    };
    
  } catch (error) {
    console.error("Unexpected error processing scan:", error);
    
    sseEventPayload.type = 'scan_exception';
    sseEventPayload.error = error instanceof Error ? error.message : String(error);
    if (jobId) sendScanEvent(jobId.toString(), sseEventPayload as ScanEvent).catch(console.error);
    
    return { 
      success: false, 
      error: "An unexpected error occurred",
      errorDetail: error instanceof Error ? error.message : String(error)
    };
  }
}