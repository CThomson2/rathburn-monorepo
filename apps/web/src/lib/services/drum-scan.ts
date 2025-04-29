import { createClient } from "@supabase/supabase-js";
import { DrumBarcodeInput, parseDrumBarcode, validateDrumStatus } from "../validation/drum-barcode";
import { DrumStatus } from "@/types/models/scan";

export type DrumScanAction = "goods_inwards" | "transport_for_production";

interface ProcessDrumScanResult {
  success: boolean;
  scanId?: string;
  error?: string;
  drum?: any;
}

/**
 * Processes a drum scan and performs the appropriate action based on the scan type
 * @param input The validated drum scan input
 * @param action The type of scan action being performed
 * @param client Supabase client instance
 * @returns ProcessDrumScanResult containing the result of the scan
 */
export async function processDrumScan(
  input: DrumBarcodeInput,
  action: DrumScanAction,
  client: any
): Promise<ProcessDrumScanResult> {
  try {
    // Parse barcode
    const parsed = parseDrumBarcode(input.barcode);
    if (!parsed) {
      return { success: false, error: "Invalid barcode format" };
    }

    // Validate drum status based on action type
    const expectedStatus = getExpectedStatusForAction(action);
    const drum = await validateDrumStatus(parsed.drumId, expectedStatus, client);
    
    if (!drum) {
      return { 
        success: false, 
        error: `Drum not found or invalid status for ${action}` 
      };
    }

    // Log the scan
    const { data: scan, error: scanError } = await client
      .schema("logs")
      .from("drum_scan")
      .insert({
        raw_barcode: input.barcode,
        detected_drum: parsed.drumId,
        action_type: action,
        device_id: input.deviceId,
        metadata: input.metadata,
      })
      .select()
      .single();

    if (scanError) {
      console.error("Error logging scan:", scanError);
      return { success: false, error: "Failed to log scan" };
    }

    // Update drum status based on action
    const newStatus = getNewStatusForAction(action);
    if (newStatus) {
      const { error: updateError } = await client
        .schema("inventory")
        .from("drums")
        .update({ status: newStatus })
        .eq("drum_id", parsed.drumId);

      if (updateError) {
        console.error("Error updating drum status:", updateError);
        return { success: false, error: "Failed to update drum status" };
      }
    }

    return {
      success: true,
      scanId: scan.scan_id,
      drum: {
        ...drum,
        status: newStatus || drum.status,
      },
    };

  } catch (error) {
    console.error("Error processing drum scan:", error);
    return { success: false, error: "Internal server error" };
  }
}

/**
 * Gets the expected drum status for a given scan action
 */
function getExpectedStatusForAction(action: DrumScanAction): DrumStatus {
  switch (action) {
    case "goods_inwards":
      return "in_stock";
    case "transport_for_production":
      return "in_stock";
    // Add other cases as needed
    default:
      throw new Error(`Unsupported action type: ${action}`);
  }
}

/**
 * Gets the new drum status after a successful scan action
 */
function getNewStatusForAction(action: DrumScanAction): DrumStatus | null {
  switch (action) {
    case "goods_inwards":
      return "in_stock";
    case "transport_for_production":
      return "in_production";
    // Add other cases as needed
    default:
      return null;
  }
} 