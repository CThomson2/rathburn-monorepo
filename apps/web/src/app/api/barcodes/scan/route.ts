import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { 
  detectScanType, 
  processDrumScan, 
  processPalletScan, 
  processLocationScan 
} from "./processor";

// Force dynamic rendering and no caching for this database-dependent route
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

// Schema for generic barcode scan data
const scanSchema = z.object({
  barcode: z.string().min(1, "Barcode data is required"),
  timestamp: z.string().datetime().optional(),
  deviceId: z.string().optional(),
  scanType: z.enum(["drum", "pallet", "location", "other"]).optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * POST endpoint for processing all types of barcode scans
 * 
 * This is the main entry point for barcode scanning in the system.
 * It validates the barcode format, detects the scan type, and routes to
 * the appropriate processor.
 * 
 * @route POST /api/barcodes/scan
 * 
 * @param {NextRequest} req - The request object containing:
 *   @param {Object} req.body - Request body
 *   @param {string} req.body.barcode - The scanned barcode data
 *   @param {string} req.body.timestamp - Optional timestamp of the scan
 *   @param {string} req.body.deviceId - Optional device identifier
 *   @param {string} req.body.scanType - Optional type of scan (drum, pallet, location, other)
 *   @param {Object} req.body.metadata - Optional additional metadata
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
    console.log("=== Processing barcode scan ===");
    
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
    const validationResult = scanSchema.safeParse(data);
    if (!validationResult.success) {
      console.error("Schema validation failed:", validationResult.error);
      return NextResponse.json(
        { message: "Invalid request data format", errors: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const validatedData = validationResult.data;
    const userId = user.id.toString();
    
    // If device provided, log the scan in device activity
    if (validatedData.deviceId) {
      // Update device last seen timestamp
      await supabase
        .from("devices")
        .update({
          last_seen: new Date().toISOString(),
        })
        .eq("device_id", validatedData.deviceId);
      
      // Log device activity
      await supabase
        .from("device_activity_log")
        .insert({
          device_id: validatedData.deviceId,
          activity_type: "scan",
          user_id: userId,
          timestamp: new Date().toISOString(),
          details: {
            barcode: validatedData.barcode,
            scan_type: validatedData.scanType || "unknown",
            metadata: validatedData.metadata,
          },
        });
    }
    
    // Determine scan type from barcode format if not explicitly provided
    const scanType = validatedData.scanType || detectScanType(validatedData.barcode);
    
    // Process the scan based on detected type
    let result;
    if (scanType === "drum") {
      result = await processDrumScan(validatedData.barcode, userId, supabase);
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
    console.error("Error processing scan:", error);
    return NextResponse.json(
      { message: "Internal server error", error: String(error) },
      { status: 500 }
    );
  }
} 