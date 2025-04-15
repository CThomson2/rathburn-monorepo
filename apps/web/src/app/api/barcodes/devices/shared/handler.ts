import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import {
  detectScanType,
  processDrumScan,
  processPalletScan,
  processLocationScan,
  updateDeviceStatus,
  logDeviceActivity,
} from "@/app/api/barcodes/scan/processor";

export type DeviceHandlerConfig = {
  deviceType: string;
  schema: z.ZodSchema;
  processExtraData?: (validatedData: any) => Record<string, any>;
};

/**
 * Factory function that creates a standardized handler for different device types
 *
 * @param config Configuration options for the handler
 * @returns A handler function for processing device scans
 */
export function createDeviceScanHandler(config: DeviceHandlerConfig) {
  return async function handler(req: NextRequest): Promise<NextResponse> {
    try {
      console.log(`=== Processing ${config.deviceType} scanner data ===`);

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
      const validationResult = config.schema.safeParse(data);
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

      // Extract device-specific status updates
      const deviceStatusUpdates: Record<string, any> = {
        battery_level: validatedData.battery,
      };

      // Add device-specific fields
      if ("temperature" in validatedData)
        deviceStatusUpdates.temperature = validatedData.temperature;
      if ("humidity" in validatedData)
        deviceStatusUpdates.humidity = validatedData.humidity;
      if ("signalStrength" in validatedData)
        deviceStatusUpdates.signal_strength = validatedData.signalStrength;

      // Update device status
      await updateDeviceStatus(
        validatedData.deviceId,
        deviceStatusUpdates,
        supabase
      );

      // Prepare activity details
      const activityDetails: Record<string, any> = {
        barcode: validatedData.barcode,
        scan_type: validatedData.scanType || "unknown",
        battery: validatedData.battery,
      };

      // Add device-specific activity details
      if ("temperature" in validatedData)
        activityDetails.temperature = validatedData.temperature;
      if ("humidity" in validatedData)
        activityDetails.humidity = validatedData.humidity;
      if ("signalStrength" in validatedData)
        activityDetails.signal_strength = validatedData.signalStrength;
      if ("scanMode" in validatedData)
        activityDetails.scan_mode = validatedData.scanMode;
      if ("location" in validatedData)
        activityDetails.location = validatedData.location;

      // Log device activity
      await logDeviceActivity(
        validatedData.deviceId,
        userId,
        "scan",
        activityDetails,
        supabase
      );

      // Determine scan type from barcode format if not explicitly provided
      const scanType =
        validatedData.scanType || detectScanType(validatedData.barcode);

      // Process the scan based on detected type
      let result;
      if (scanType === "drum") {
        result = await processDrumScan(
          validatedData.barcode,
          userId,
          supabase,
          `${config.deviceType}_scan`
        );
      } else if (scanType === "pallet") {
        result = await processPalletScan(
          validatedData.barcode,
          userId,
          supabase
        );
      } else if (scanType === "location") {
        result = await processLocationScan(
          validatedData.barcode,
          userId,
          supabase
        );
      } else {
        result = {
          success: false,
          message: "Unrecognized barcode format",
          barcode: validatedData.barcode,
        };
      }

      // Prepare response with device-specific extras
      const responseData = {
        ...result,
        deviceId: validatedData.deviceId,
        timestamp: new Date().toISOString(),
      };

      // Add extra device-specific fields to response if the function is provided
      if (config.processExtraData) {
        Object.assign(responseData, config.processExtraData(validatedData));
      }

      return NextResponse.json(
        {
          success: result.success,
          data: responseData,
        },
        { status: result.success ? 200 : 400 }
      );
    } catch (error) {
      console.error(`Error processing ${config.deviceType} scan:`, error);
      return NextResponse.json(
        { message: "Internal server error", error: String(error) },
        { status: 500 }
      );
    }
  };
}
