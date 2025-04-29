import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// Force dynamic rendering and no caching for this database-dependent route
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

// Schema for device registration
const deviceRegistrationSchema = z.object({
  deviceId: z.string().min(1, "Device ID is required"),
  deviceModel: z.enum(["CT47", "CK67", "Generic"]),
  deviceName: z.string().optional(),
  deviceMac: z.string().optional(),
  firmwareVersion: z.string().optional(),
  lastSeen: z.string().datetime().optional(),
});

/**
 * POST endpoint for registering barcode scanner devices
 * 
 * This endpoint allows barcode scanners to register themselves with the system
 * and maintain their active status. It creates a device record if one doesn't exist
 * or updates an existing record with the latest information.
 * 
 * @route POST /api/scanners/devices/register
 * 
 * @param {NextRequest} req - The request object containing:
 *   @param {Object} req.body - Request body
 *   @param {string} req.body.deviceId - Unique identifier for the device
 *   @param {string} req.body.deviceModel - Model of the device (CT47, CK67, or Generic)
 *   @param {string} req.body.deviceName - Optional friendly name for the device
 *   @param {string} req.body.deviceMac - Optional MAC address of the device
 *   @param {string} req.body.firmwareVersion - Optional firmware version of the device
 * 
 * @returns {Promise<NextResponse>} Response object with:
 *   - 201: Successfully registered device
 *     - success: true
 *     - data: Object containing device information
 *   - 400: Invalid request data
 *     - message: Error description
 *   - 500: Internal server error
 *     - message: "Internal server error"
 *     - error: Error details
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    console.log("=== Processing device registration ===");
    
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
        { message: "Authentication required to register devices" },
        { status: 401 }
      );
    }
    
    // Parse and validate incoming data
    const data = await req.json();
    console.log("Parsed request data:", JSON.stringify(data, null, 2));
    
    // Validate against schema
    const validationResult = deviceRegistrationSchema.safeParse(data);
    if (!validationResult.success) {
      console.error("Schema validation failed:", validationResult.error);
      return NextResponse.json(
        { message: "Invalid request data format", errors: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const validatedData = validationResult.data;
    const timestamp = new Date().toISOString();
    
    // Upsert device record in the database
    const { data: device, error: deviceError } = await supabase
      .from("devices")
      .upsert(
        {
          device_id: validatedData.deviceId,
          device_model: validatedData.deviceModel,
          device_name: validatedData.deviceName || validatedData.deviceId,
          device_mac: validatedData.deviceMac,
          firmware_version: validatedData.firmwareVersion,
          registered_by: user.id,
          last_seen: timestamp,
          is_active: true,
        },
        { onConflict: "device_id" }
      )
      .select()
      .single();
    
    if (deviceError) {
      console.error("Error registering device:", deviceError);
      return NextResponse.json(
        { message: "Database error when registering device" },
        { status: 500 }
      );
    }
    
    // Log device activity
    await supabase
      .from("device_activity_log")
      .insert({
        device_id: validatedData.deviceId,
        activity_type: "registration",
        user_id: user.id,
        timestamp: timestamp,
        details: { ip: req.headers.get("x-forwarded-for") || "unknown" },
      });
    
    return NextResponse.json(
      {
        success: true,
        data: {
          deviceId: device.device_id,
          deviceModel: device.device_model,
          deviceName: device.device_name,
          isActive: device.is_active,
          lastSeen: device.last_seen,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error processing device registration:", error);
    return NextResponse.json(
      { message: "Internal server error", error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check device registration status
 * 
 * @route GET /api/scanners/devices/register?deviceId=<deviceId>
 * 
 * @returns {Promise<NextResponse>} Response containing device registration status
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Get deviceId from the URL params
    const url = new URL(req.url);
    const deviceId = url.searchParams.get("deviceId");
    
    if (!deviceId) {
      return NextResponse.json(
        { message: "Device ID is required" },
        { status: 400 }
      );
    }
    
    // Get the Supabase client
    const supabase = createClient();
    
    // Get device record
    const { data: device, error: deviceError } = await supabase
      .from("devices")
      .select("*")
      .eq("device_id", deviceId)
      .maybeSingle();
    
    if (deviceError) {
      console.error("Error fetching device:", deviceError);
      return NextResponse.json(
        { message: "Database error when checking device" },
        { status: 500 }
      );
    }
    
    if (!device) {
      return NextResponse.json(
        { registered: false },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      {
        registered: true,
        data: {
          deviceId: device.device_id,
          deviceModel: device.device_model,
          deviceName: device.device_name,
          isActive: device.is_active,
          lastSeen: device.last_seen,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error checking device registration:", error);
    return NextResponse.json(
      { message: "Internal server error", error: String(error) },
      { status: 500 }
    );
  }
} 