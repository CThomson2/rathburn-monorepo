// apps/web/src/app/actions/scan.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { sendScanEvent } from "@/app/api/events/scan/route";
import { 
  ScanActionType, 
  ScanMode, 
  ScanStatus,
  ScanResult
} from "@/types/scanner";
import { validateDrumBarcode, validateDrumScanRecord } from "@/lib/validation/drum-barcode";
import { createLogger } from "@/lib/api/utils/logger";

const logger = createLogger('actions/scan');

interface ScanActionParams {
  barcode: string;
  jobId?: number;
  action?: string;
  deviceId?: string;
  userId?: string;
  scan_mode?: ScanMode;
  metadata?: Record<string, any>;
}

/**
 * Process a barcode scan and store it in the database
 * 
 * This server action handles all barcode scan processing, including:
 * - Validating the barcode format
 * - Recording the scan in the database
 * - Processing business logic based on scan type
 * - Sending real-time events to connected clients
 * - Handling errors gracefully
 * 
 * @param {ScanActionParams} params The parameters for the scan action
 * @returns {Promise<ScanResult>} The result of the scan processing
 */
export async function processBarcodeScan(params: ScanActionParams): Promise<ScanResult> {
  const startTime = Date.now();
  
  logger.info('Processing barcode scan', { 
    barcode: params.barcode,
    jobId: params.jobId,
    action: params.action,
    scan_mode: params.scan_mode || 'single'
  });
  
  try {
    // Validate input params
    try {
      validateDrumBarcode({
        barcode: params.barcode,
        jobId: params.jobId,
        action: params.action,
        scan_mode: params.scan_mode || 'single'
      });
    } catch (validationError) {
      logger.warn('Barcode validation failed', { 
        barcode: params.barcode, 
        error: validationError 
      });
      
      // Try to send SSE event for validation error
      if (params.jobId) {
        try {
          await sendScanEvent(params.jobId.toString(), {
            type: 'scan_error',
            barcode: params.barcode,
            jobId: params.jobId,
            error: "Invalid barcode format",
            timestamp: new Date().toISOString()
          });
        } catch (sseError) {
          logger.error("Error sending validation error SSE event:", sseError);
        }
      }
      
      return { 
        success: false, 
        error: "Invalid barcode format",
        scan_id: `error_${Date.now()}`,
        timestamp: new Date().toISOString()
      };
    }
    
    // Create Supabase client
    const supabase = createClient();
    
    // Get current user session for user_id if not provided
    let userId = params.userId;
    if (!userId) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { 
          success: false, 
          error: "Unauthorized - User not logged in",
          scan_id: `error_${Date.now()}`,
          timestamp: new Date().toISOString()
        };
      }
      userId = session.user.id;
    }
    
    // Get device information from the headers if not provided
    let deviceId = params.deviceId;
    if (!deviceId) {
      const headersList = headers();
      // Try to get from user agent or other headers
      const userAgent = headersList.get('user-agent') || '';
      deviceId = userAgent.includes('CK67') ? 'CK67-device' : 
                userAgent.includes('CT47') ? 'CT47-device' : 
                'web-client';
    }
    
    // Parse action type
    const actionType = mapActionType(params.action || 'barcode_scan');
    
    // Determine scan mode
    const scanMode = params.scan_mode || 'single';
    
    // Check if this is a duplicate scan (if it's not a cancellation)
    if (actionType !== 'cancel') {
      const { data: existingScan } = await supabase
        .from('drum_scan')
        .select('scan_id, raw_barcode')
        .eq('raw_barcode', params.barcode)
        .eq('status', 'success')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (existingScan && existingScan.length > 0) {
        // This is a duplicate scan
        logger.info('Duplicate scan detected', { 
          barcode: params.barcode, 
          existingScanId: existingScan[0].scan_id 
        });
        
        // For duplicate scans, we can either:
        // 1. Return an error
        // 2. Return the existing scan
        // 3. Create a new scan record but mark it as a duplicate
        
        // Option 2: Return the existing scan with a warning
        if (params.jobId) {
          try {
            await sendScanEvent(params.jobId.toString(), {
              type: 'scan_success',
              barcode: params.barcode,
              jobId: params.jobId,
              scanId: existingScan[0].scan_id,
              timestamp: new Date().toISOString()
            });
          } catch (sseError) {
            logger.error("Error sending duplicate scan SSE event:", sseError);
          }
        }
        
        return { 
          success: true, 
          scan_id: existingScan[0].scan_id,
          drum: params.barcode,
          timestamp: new Date().toISOString()
        };
      }
    }
    
    // Prepare metadata
    const metadata = {
      job_id: params.jobId,
      scan_mode: scanMode,
      app_version: '1.0.0',
      source: deviceId.includes('web') ? 'web_app' : 'mobile_app',
      ...params.metadata
    };
    
    // Insert into drums_scan table
    const { data: scanData, error: scanError } = await supabase
      .from('drum_scan')
      .insert({
        user_id: userId,
        device_id: deviceId,
        raw_barcode: params.barcode,
        detected_drum: params.barcode, // Assuming barcode matches drum ID directly
        action_type: actionType,
        status: 'success' as ScanStatus,
        scan_timestamp: new Date().toISOString(),
        metadata
      })
      .select();
    
    if (scanError) {
      logger.error("Error inserting scan record:", scanError);
      
      // Send SSE event for error
      if (params.jobId) {
        try {
          await sendScanEvent(params.jobId.toString(), {
            type: 'scan_error',
            barcode: params.barcode,
            jobId: params.jobId,
            error: scanError.message,
            timestamp: new Date().toISOString()
          });
        } catch (sseError) {
          logger.error("Error sending database error SSE event:", sseError);
        }
      }
      
      return { 
        success: false, 
        error: "Failed to record scan", 
        errorDetail: scanError.message,
        scan_id: `error_${Date.now()}`,
        timestamp: new Date().toISOString()
      };
    }
    
    // Process business logic based on scan type
    let businessLogicResult = true;
    let businessLogicError = '';
    
    if (actionType !== 'cancel' && params.jobId) {
      try {
        // Here you would implement job-specific business logic
        // For example, updating a jobs table, inventory, etc.
        
        // For now, we'll just log it
        logger.info(`Applied business logic for job ${params.jobId}, drum ${params.barcode}`);
        
        // This is where you would add specific business logic:
        // - For 'transport', update transport logs
        // - For 'location_set', update drum location
        // - For other actions, perform relevant updates
      } catch (businessError) {
        logger.error("Business logic error:", businessError);
        businessLogicResult = false;
        businessLogicError = businessError instanceof Error 
          ? businessError.message 
          : "Business logic error";
      }
    }
    
    // Record processing time
    const processingTime = Date.now() - startTime;
    logger.info('Scan processing completed', { 
      barcode: params.barcode, 
      processingTimeMs: processingTime 
    });
    
    // Send SSE event for successful scan
    if (params.jobId) {
      try {
        await sendScanEvent(params.jobId.toString(), {
          type: 'scan_success',
          barcode: params.barcode,
          jobId: params.jobId,
          scanId: scanData[0].scan_id,
          scan_mode: scanMode,
          timestamp: new Date().toISOString()
        });
      } catch (sseError) {
        logger.error("Error sending success SSE event:", sseError);
      }
    }
    
    // Return success response
    return { 
      success: businessLogicResult, 
      scan_id: scanData[0].scan_id,
      drum: params.barcode,
      error: businessLogicResult ? undefined : businessLogicError,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    logger.error("Unhandled error processing scan:", error);
    
    // Try to send SSE event for error
    if (params.jobId) {
      try {
        await sendScanEvent(params.jobId.toString(), {
          type: 'scan_exception',
          barcode: params.barcode,
          jobId: params.jobId,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        });
      } catch (sseError) {
        logger.error("Error sending exception SSE event:", sseError);
      }
    }
    
    return { 
      success: false, 
      error: "An unexpected error occurred",
      errorDetail: error instanceof Error ? error.message : String(error),
      scan_id: `error_${Date.now()}`,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Map action string to ScanActionType enum
 */
function mapActionType(action: string): ScanActionType {
  switch (action) {
    case 'cancel_scan':
      return 'cancel';
    case 'bulk':
      return 'bulk_scan';
    case 'location_set':
      return 'location_set';
    case 'transport':
      return 'transport';
    case 'barcode_scan':
    default:
      return 'barcode_scan';
  }
}

/**
 * Process a batch of barcode scans
 * 
 * @param barcodes Array of barcodes to process
 * @param jobId Job ID for context
 * @param deviceId Optional device identifier
 * @returns Results of batch processing
 */
export async function processBatchScans(
  barcodes: string[],
  jobId?: number,
  deviceId?: string
): Promise<{
  success: boolean;
  processed: ScanResult[];
  failed: {
    barcode: string;
    error: string;
  }[];
  totalProcessed: number;
  totalFailed: number;
  totalSubmitted: number;
}> {
  logger.info('Processing batch of scans', { 
    count: barcodes.length,
    jobId 
  });
  
  const results: ScanResult[] = [];
  const failed: { barcode: string; error: string }[] = [];
  
  // Process each scan
  for (const barcode of barcodes) {
    try {
      const result = await processBarcodeScan({
        barcode,
        jobId,
        deviceId,
        scan_mode: 'bulk',
        action: 'bulk'
      });
      
      results.push(result);
      
      if (!result.success) {
        failed.push({ 
          barcode, 
          error: result.error || 'Unknown error' 
        });
      }
    } catch (error) {
      logger.error('Error processing batch scan', { barcode, error });
      
      failed.push({ 
        barcode, 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }
  
  const totalProcessed = results.filter(r => r.success).length;
  const totalFailed = failed.length;
  
  logger.info('Batch processing completed', {
    total: barcodes.length,
    processed: totalProcessed,
    failed: totalFailed
  });
  
  return {
    success: totalProcessed > 0,
    processed: results.filter(r => r.success),
    failed,
    totalProcessed,
    totalFailed,
    totalSubmitted: barcodes.length
  };
}