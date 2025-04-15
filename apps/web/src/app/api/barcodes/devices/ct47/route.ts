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

// Schema for CT47 scanner data
const ct47ScanSchema = z.object({
  deviceId: z.string().min(1, "Device ID is required"),
  barcode: z.string().min(1, "Barcode data is required"),
  timestamp: z.string().datetime().optional(),
  scanType: z.enum(["drum", "pallet", "location", "other"]).optional(),
  battery: z.number().min(0).max(100).optional(),
  signalStrength: z.number().min(0).max(100).optional(),
  location: z.object({
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    accuracy: z.number().optional(),
  }).optional(),
});

/**
 * POST endpoint for handling scans from Honeywell CT47 barcode scanners
 * 
 * This endpoint processes barcode scans from CT47 devices, with device-specific
 * features like battery level reporting and location data.
 * 
 * @route POST /api/barcodes/devices/ct47
 * 
 * @param {NextRequest} req - The request object containing:
 *   @param {Object} req.body - Request body
 *   @param {string} req.body.deviceId - Unique identifier for the CT47 device
 *   @param {string} req.body.barcode - The scanned barcode data
 *   @param {string} req.body.timestamp - Optional timestamp of the scan
 *   @param {string} req.body.scanType - Optional type of scan (drum, pallet, location, other)
 *   @param {number} req.body.battery - Optional battery level of the device (0-100)
 *   @param {number} req.body.signalStrength - Optional signal strength (0-100)
 *   @param {Object} req.body.location - Optional location data
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
    console.log("=== Processing CT47 scanner data ===");
    
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
    const validationResult = ct47ScanSchema.safeParse(data);
    if (!validationResult.success) {
      console.error("Schema validation failed:", validationResult.error);
      return NextResponse.json(
        { message: "Invalid request data format", errors: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const validatedData = validationResult.data;
    const userId = user.id.toString();
    
    // Update device status with CT47-specific fields
    await updateDeviceStatus(validatedData.deviceId, {
      battery_level: validatedData.battery,
      signal_strength: validatedData.signalStrength,
    }, supabase);
    
    // Log device activity with CT47-specific details
    await logDeviceActivity(
      validatedData.deviceId,
      userId,
      "scan",
      {
        barcode: validatedData.barcode,
        scan_type: validatedData.scanType || "unknown",
        battery: validatedData.battery,
        signal_strength: validatedData.signalStrength,
        location: validatedData.location,
      },
      supabase
    );
    
    // Determine scan type from barcode format if not explicitly provided
    const scanType = validatedData.scanType || detectScanType(validatedData.barcode);
    
    // Process the scan based on detected type
    let result;
    if (scanType === "drum") {
      result = await processDrumScan(validatedData.barcode, userId, supabase, "ct47_scan");
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
          timestamp: new Date().toISOString(),
        },
      },
      { status: result.success ? 200 : 400 }
    );
  } catch (error) {
    console.error("Error processing CT47 scan:", error);
    return NextResponse.json(
      { message: "Internal server error", error: String(error) },
      { status: 500 }
    );
  }
} 