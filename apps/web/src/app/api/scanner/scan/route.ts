// app/api/scanner/scan/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient as createClient } from "@/lib/supabase/server";
import { getCorsHeaders, handleOptionsRequest } from "@/lib/api/utils/cors"; // <-- Import CORS utils
import { z } from "zod";
import {
  detectActionType,
  processDrumScan,
  processLocationScan,
} from "./processor";

// Force dynamic rendering and no caching for this database-dependent route
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const ACTION_TYPES = [
  "context_get",
  "context_set",
  "transport",
  "location_set",
  "barcode_scan",
  "cancel_scan",
  "fast_forward",
  "bulk",
] as const;

const scanSchema = z.object({
  rawBarcode: z.string().min(1, "Barcode data is required"),
  deviceId: z.string(),
  actionType: z.enum(ACTION_TYPES),
  metadata: z.record(z.any()).optional(),
  scannedAt: z.string().datetime().optional(),
});

export async function OPTIONS(request: NextRequest) {
  return handleOptionsRequest(request, 'POST, OPTIONS');
}

/**
 * POST endpoint for processing all types of barcode scans
 *
 * This is the main entry point for barcode scanning in the system.
 * It validates the barcode format, detects the scan type, and routes to
 * the appropriate processor.
 *
 * @route POST /api/scanner/scan
 *
 * @param {NextRequest} request - The request object containing:
 *   @param {Object} request.body - Request body
 *   @param {string} request.body.rawBarcode - The scanned barcode data
 *   @param {string} request.body.scannedAt - Optional timestamp of the scan
 *   @param {string} request.body.deviceId - Optional device identifier
 *   @param {string} request.body.actionType - Optional type of scan (drum, pallet, location, other)
 *   @param {Object} request.body.metadata - Optional additional metadata
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
export async function POST(request: Request): Promise<NextResponse> {
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
    const data = await request.json();
    console.log("Parsed request data:", JSON.stringify(data, null, 2));

    // Validate against schema
    const validationResult = scanSchema.safeParse(data);
    if (!validationResult.success) {
      console.error("Schema validation failed:", validationResult.error);
      return NextResponse.json(
        {
          message: "Invalid request data format",
          errors: validationResult.error.format(),
        },
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
    }

    // Determine scan type from barcode format if not explicitly provided
    const actionType =
      validatedData.actionType || detectActionType(validatedData.rawBarcode);

    let result;
    if (actionType === "barcode_scan") {
      result = await processDrumScan(
        validatedData.rawBarcode,
        userId,
        supabase
      );
      // Process the scan
      // if (actionType.startsWith("location")) {
      //     result = await processLocationScan(validatedData.rawBarcode, userId, supabase);
      // } Other action types are not supported yet
    } else {
      result = {
        success: false,
        message: "Unrecognized action type",
        actionType: validatedData.actionType,
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
