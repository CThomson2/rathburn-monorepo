import { createClient } from "@/lib/supabase/server";

/**
 * Determines the type of barcode based on its format
 * 
 * @param barcode The barcode string to analyze
 * @returns The detected scan type
 */
export function detectScanType(barcode: string): "drum" | "pallet" | "location" | "other" {
  if (/^[A-Z]{3}-\d{4,5}$/.test(barcode)) {
    return "drum"; // Example: HEX-12345
  } else if (/^P\d{6}$/.test(barcode)) {
    return "pallet"; // Example: P123456
  } else if (/^LOC-[A-Z]{1,3}\d{1,3}$/.test(barcode)) {
    return "location"; // Example: LOC-A12
  } else {
    return "other";
  }
}

/**
 * Processes drum-specific barcode scans
 * 
 * @param barcode The drum barcode to process
 * @param userId The ID of the user performing the scan
 * @param client The Supabase client to use for database operations
 * @param scanType Optional scan type identifier
 * @returns Result of the scan processing
 */
export async function processDrumScan(
  barcode: string, 
  userId: string, 
  client = createClient(),
  scanType = "standard_scan"
) {
  // Extract material_code and drum_id from the barcode
  const match = barcode.match(/^([A-Z]{3})-(\d{4,5})$/);
  if (!match) {
    return {
      success: false,
      message: "Invalid drum barcode format",
      barcode,
    };
  }
  
  // Ensure drumIdStr is not undefined before parsing
  const materialCode = match[1] || "";
  const drumIdStr = match[2] || "";
  const drumId = parseInt(drumIdStr, 10);
  
  // Check if drum exists
  const { data: drum, error: drumError } = await client
    .from("stock_drum")
    .select("*")
    .eq("drum_id", drumId)
    .maybeSingle();
  
  if (drumError) {
    console.error("Error fetching drum:", drumError);
    return {
      success: false,
      message: "Database error when checking drum",
      barcode,
    };
  }
  
  if (!drum) {
    return {
      success: false,
      message: "Drum not found in system",
      barcode,
      drumId,
    };
  }
  
  // Log drum scan
  const { error: scanError } = await client
    .from("log_drum_scan")
    .insert({
      drum_id: drumId,
      user_id: userId,
      scan_type: scanType,
      scan_status: "processed",
      scanned_at: new Date().toISOString(),
    });
  
  if (scanError) {
    console.error("Error logging drum scan:", scanError);
  }
  
  return {
    success: true,
    message: "Drum scan processed successfully",
    barcode,
    drumId,
    materialCode,
    currentStatus: drum.status,
  };
}

/**
 * Processes pallet-specific barcode scans
 * 
 * @param barcode The pallet barcode to process
 * @param userId The ID of the user performing the scan
 * @param client The Supabase client to use for database operations
 * @returns Result of the scan processing
 */
export async function processPalletScan(
  barcode: string, 
  userId: string, 
  client = createClient()
) {
  // Implement pallet scan logic
  return {
    success: true,
    message: "Pallet scan processed successfully",
    barcode,
    scanType: "pallet",
  };
}

/**
 * Processes location-specific barcode scans
 * 
 * @param barcode The location barcode to process
 * @param userId The ID of the user performing the scan
 * @param client The Supabase client to use for database operations
 * @returns Result of the scan processing
 */
export async function processLocationScan(
  barcode: string, 
  userId: string, 
  client = createClient()
) {
  // Implement location scan logic
  return {
    success: true,
    message: "Location scan processed successfully",
    barcode,
    scanType: "location",
  };
}

/**
 * Log device activity in the database
 * 
 * @param deviceId The ID of the device
 * @param userId The ID of the user
 * @param activityType The type of activity
 * @param details Additional details about the activity
 * @param client The Supabase client to use
 */
export async function logDeviceActivity(
  deviceId: string,
  userId: string,
  activityType: string,
  details: any,
  client = createClient()
) {
  await client
    .from("device_activity_log")
    .insert({
      device_id: deviceId,
      activity_type: activityType,
      user_id: userId,
      timestamp: new Date().toISOString(),
      details,
    });
}

/**
 * Update device status in the database
 * 
 * @param deviceId The ID of the device to update
 * @param updates The properties to update
 * @param client The Supabase client to use
 */
export async function updateDeviceStatus(
  deviceId: string,
  updates: Record<string, any>,
  client = createClient()
) {
  const timestamp = new Date().toISOString();
  
  await client
    .from("devices")
    .update({
      last_seen: timestamp,
      ...updates,
    })
    .eq("device_id", deviceId);
} 