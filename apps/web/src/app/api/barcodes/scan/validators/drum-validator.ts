import { z } from "zod";

/**
 * Schema for validating drum barcodes
 * Format: <material_code>-<drum_id>
 * e.g., "HEX-18342"
 */
export const drumBarcodeSchema = z
  .string()
  .regex(
    /^[A-Z]{3,5}-\d{4,5}$/,
    "Invalid drum barcode format. Expected format: XXX(X?X?)-12345 (material code followed by drum ID)"
  );

/**
 * Parses a drum barcode string into its constituent parts
 *
 * @param barcode The drum barcode to parse
 * @returns Object containing materialCode and drumId or null if invalid
 */
export function parseDrumBarcode(
  barcode: string
): { materialCode: string; drumId: number } | null {
  const match = barcode.match(/^([A-Z]{3,5})-(\d{4,5})$/);
  if (!match || !match[1] || !match[2]) {
    return null;
  }

  return {
    materialCode: match[1],
    drumId: parseInt(match[2], 10),
  };
}

/**
 * Validates whether a drum barcode is in the correct format
 *
 * @param barcode The barcode to validate
 * @returns True if the barcode is valid, false otherwise
 */
export function isValidDrumBarcode(barcode: string): boolean {
  return drumBarcodeSchema.safeParse(barcode).success;
}

/**
 * Extracts a drum ID from a barcode
 *
 * @param barcode The barcode string
 * @returns The drum ID as a number or null if invalid format
 */
export function extractDrumId(barcode: string): number | null {
  const parsed = parseDrumBarcode(barcode);
  return parsed ? parsed.drumId : null;
}

/**
 * Extracts a material code from a barcode
 *
 * @param barcode The barcode string
 * @returns The material code or null if invalid format
 */
export function extractMaterialCode(barcode: string): string | null {
  const parsed = parseDrumBarcode(barcode);
  return parsed ? parsed.materialCode : null;
}
