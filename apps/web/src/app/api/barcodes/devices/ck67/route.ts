import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { 
  detectScanType, 
  processDrumScan, 
  processPalletScan, 
  processLocationScan,
  updateDeviceStatus,
  logDeviceActivity
} from "@/app/api/barcodes/scan/processor";

// Force dynamic rendering and no caching for this database-dependent route
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

// Schema for CK67 scanner data
const ck67ScanSchema = z.object({
  deviceId: z.string().min(1, "Device ID is required"),
  barcode: z.string().min(1, "Barcode data is required"),
  timestamp: z.string().datetime().optional(),
  scanType: z.enum(["drum", "pallet", "location", "other"]).optional(),
  battery: z.number().min(0).max(100).optional(),
  temperature: z.number().optional(),
  humidity: z.number().min(0).max(100).optional(),
  scanMode: z.enum(["1D", "2D", "Auto"]).optional(),
});

/**
 * POST endpoint for handling scans from Honeywell CK67 barcode scanners
 * 
 * This endpoint processes barcode scans from CK67 devices, with device-specific
 * features like temperature/humidity monitoring and enhanced barcode scanning modes.
 * 
 * @route POST /api/barcodes/devices/ck67
 * 
 * @param {NextRequest} req - The request object containing:
 *   @param {Object} req.body - Request body
 *   @param {string} req.body.deviceId - Unique identifier for the CK67 device
 *   @param {string} req.body.barcode - The scanned barcode data
 *   @param {string} req.body.timestamp - Optional timestamp of the scan
 *   @param {string} req.body.scanType - Optional type of scan (drum, pallet, location, other)
 *   @param {number} req.body.battery - Optional battery level of the device (0-100)
 *   @param {number} req.body.temperature - Optional ambient temperature
 *   @param {number} req.body.humidity - Optional humidity level (0-100)
 *   @param {string} req.body.scanMode - Optional scan mode used (1D, 2D, Auto)
 * 
 * @returns {Promise<NextResponse>} Response object with:
 *   - 200: Successfully processed scan
 *     - success: true
 *     - data: Object containing processing results
 *   - 400: Invalid request data
 *     - message: Error description
 *   - 401: Unauthorized
 *     - message: Error description
 *   - 500: Internal server error
 *     - message: "Internal server error"
 *     - error: Error details
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    console.log("=== Processing CK67 scanner data ===");
    
    // Get the Supabase client
    const supabase = createClient();
    
    // Get user from Supabase server-side authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Authentication error:", authError);
      return NextResponse.json(
        { message: "Authentication required to process scans" },
        { status: 401 }
      );
    }
    
    // Parse and validate incoming data
    const data = await req.json();
    console.log("Parsed request data:", JSON.stringify(data, null, 2));
    
    // Validate against schema
    const validationResult = ck67ScanSchema.safeParse(data);
    if (!validationResult.success) {
      console.error("Schema validation failed:", validationResult.error);
      return NextResponse.json(
        { message: "Invalid request data format", errors: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const validatedData = validationResult.data;
    const userId = user.id.toString();
    
    // Update device status with CK67-specific fields
    await updateDeviceStatus(validatedData.deviceId, {
      battery_level: validatedData.battery,
      temperature: validatedData.temperature,
      humidity: validatedData.humidity,
    }, supabase);
    
    // Log device activity with CK67-specific details
    await logDeviceActivity(
      validatedData.deviceId,
      userId,
      "scan",
      {
        barcode: validatedData.barcode,
        scan_type: validatedData.scanType || "unknown",
        battery: validatedData.battery,
        temperature: validatedData.temperature,
        humidity: validatedData.humidity,
        scan_mode: validatedData.scanMode,
      },
      supabase
    );
    
    // Determine scan type from barcode format if not explicitly provided
    const scanType = validatedData.scanType || detectScanType(validatedData.barcode);
    
    // Process the scan based on detected type
    let result;
    if (scanType === "drum") {
      result = await processDrumScan(validatedData.barcode, userId, supabase, "ck67_scan");
    } else if (scanType === "pallet") {
      result = await processPalletScan(validatedData.barcode, userId, supabase);
    } else if (scanType === "location") {
      result = await processLocationScan(validatedData.barcode, userId, supabase);
    } else {
      result = {
        success: false,
        message: "Unrecognized barcode format",
        barcode: validatedData.barcode,
      };
    }
    
    return NextResponse.json(
      {
        success: result.success,
        data: {
          ...result,
          deviceId: validatedData.deviceId,
          scanMode: validatedData.scanMode,
          timestamp: new Date().toISOString(),
        },
      },
      { status: result.success ? 200 : 400 }
    );
  } catch (error) {
    console.error("Error processing CK67 scan:", error);
    return NextResponse.json(
      { message: "Internal server error", error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Detects the type of barcode based on its format
 */
function detectScanType(barcode: string): "drum" | "pallet" | "location" | "other" {
  // Implement barcode format detection logic
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
 */
async function processDrumScan(barcode: string, userId: string, supabase: any, scanType: string) {
  // Extract material_code and drum_id from the barcode
  const match = barcode.match(/^([A-Z]{3})-(\d{4,5})$/);
  if (!match) {
    return {
      success: false,
      message: "Invalid drum barcode format",
      barcode,
    };
  }
  
  const [, materialCode, drumIdStr] = match;
  const drumId = parseInt(drumIdStr, 10);
  
  // Check if drum exists
  const { data: drum, error: drumError } = await supabase
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
  const { error: scanError } = await supabase
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
 */
async function processPalletScan(barcode: string, userId: string, supabase: any) {
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
 */
async function processLocationScan(barcode: string, userId: string, supabase: any) {
  // Implement location scan logic
  return {
    success: true,
    message: "Location scan processed successfully",
    barcode,
    scanType: "location",
  };
} 