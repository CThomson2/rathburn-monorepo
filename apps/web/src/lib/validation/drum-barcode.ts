import { z } from "zod";
import { DrumStatus } from "@/types/models/scan";

/**
 * Zod schema for validating drum barcode format
 * Format: <material_code>-<drum_id>
 * Example: HEX-12345
 */
export const drumBarcodeSchema = z.object({
  barcode: z
    .string()
    .regex(/^([A-Z]{3,6})-(\d{4,5})$/),
  timestamp: z.string().optional(),
  deviceId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type DrumBarcodeInput = z.infer<typeof drumBarcodeSchema>;

/**
 * Parses a drum barcode string into its constituent parts
 * @param barcode The drum barcode to parse
 * @returns Object containing materialCode and drumId or null if invalid
 */
export function parseDrumBarcode(
  barcode: string
): { materialCode: string; drumId: number } | null {
  const match = barcode.match(/^([A-Z]{3,6})-(\d{4,5})$/);
  if (!match || !match[1] || !match[2]) {
    return null;
  }

  return {
    materialCode: match[1],
    drumId: parseInt(match[2], 10),
  };
}

/**
 * Validates if a drum exists and has the expected status
 * @param drumId The ID of the drum to validate
 * @param expectedStatus The expected status of the drum
 * @param client Supabase client instance
 * @returns Promise resolving to the drum if valid, null if not found or invalid status
 */
export async function validateDrumStatus(
  drumId: number,
  expectedStatus: DrumStatus,
  client: any
): Promise<any> {
  const { data: drum, error } = await client
    .schema("inventory")
    .from("drums")
    .select("*")
    .eq("drum_id", drumId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching drum:", error);
    return null;
  }

  return drum?.status === expectedStatus ? drum : null;
} 