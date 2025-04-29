// apps/web/src/lib/validation/drum-barcode.ts
import { z } from 'zod';
import { ScanMode, ScanActionType, ScanStatus } from '@/types/scanner';

/**
 * Regular expression for validating drum barcodes
 * This is a placeholder pattern - adjust based on your actual barcode format
 * 
 * This pattern matches:
 * - Optional prefix (D-, DRUM-, etc.)
 * - 6-15 alphanumeric characters
 * - Optional suffix (e.g., -A1, -LOT2, etc.)
 */
const DRUM_BARCODE_PATTERN = /^(?:[A-Z]-)?[A-Z0-9]{6,15}(?:-[A-Z0-9]+)?$/i;

/**
 * Validation schema for barcode data
 */
export const drumBarcodeSchema = z.object({
  /**
   * The raw barcode as scanned
   * Must match the specified pattern
   */
  barcode: z.string()
    .min(3, "Barcode must be at least 3 characters")
    .max(50, "Barcode must be at most 50 characters")
    .regex(DRUM_BARCODE_PATTERN, "Invalid barcode format")
    .trim(),
  
  /**
   * Optional job ID for context
   */
  jobId: z.number().optional(),
  
  /**
   * Optional scan mode (single or bulk)
   * Defaults to 'single'
   */
  scan_mode: z.enum(['single', 'bulk'] as const)
    .default('single'),
  
  /**
   * Optional action type
   * Defaults to 'barcode_scan'
   */
  action: z.string().optional()
    .default('barcode_scan'),
  
  /**
   * Optional device identifier
   */
  deviceId: z.string().optional(),
  
  /**
   * Optional metadata for additional context
   */
  metadata: z.record(z.any()).optional(),
});

/**
 * Validation schema for scan results to be stored in the database
 */
export const drumScanRecordSchema = z.object({
  /**
   * User ID who performed the scan
   */
  user_id: z.string().uuid(),
  
  /**
   * Device ID that performed the scan
   */
  device_id: z.string(),
  
  /**
   * Raw barcode as scanned
   */
  raw_barcode: z.string(),
  
  /**
   * Detected drum code (may be processed from raw barcode)
   */
  detected_drum: z.string().optional(),
  
  /**
   * Action type for this scan
   */
  action_type: z.enum(['barcode_scan', 'cancel', 'bulk_scan', 'location_set', 'transport'] as const),
  
  /**
   * Status of the scan (pending, success, error, canceled)
   */
  status: z.enum(['pending', 'success', 'error', 'canceled'] as const)
    .default('pending'),
  
  /**
   * Timestamp of when the scan occurred
   */
  scan_timestamp: z.string().datetime().optional()
    .default(() => new Date().toISOString()),
  
  /**
   * Additional metadata for the scan
   */
  metadata: z.object({
    job_id: z.number().optional(),
    scan_mode: z.enum(['single', 'bulk'] as const).optional(),
    app_version: z.string().optional(),
    source: z.string().optional(),
  }).passthrough().optional(),
});

/**
 * Parse and validate a drum barcode
 * 
 * @param data The data to validate
 * @returns The validated data or throws a ZodError
 */
export function validateDrumBarcode(data: unknown) {
  return drumBarcodeSchema.parse(data);
}

/**
 * Parse and validate a drum scan record
 * 
 * @param data The data to validate
 * @returns The validated data or throws a ZodError
 */
export function validateDrumScanRecord(data: unknown) {
  return drumScanRecordSchema.parse(data);
}

/**
 * Safely attempt to validate a drum barcode
 * Returns null if validation fails instead of throwing an error
 * 
 * @param data The data to validate
 * @returns The validated data or null if invalid
 */
export function safeParseDrumBarcode(data: unknown) {
  const result = drumBarcodeSchema.safeParse(data);
  return result.success ? result.data : null;
}