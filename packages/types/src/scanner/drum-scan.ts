/**
 * Type for scan mode - determines which API endpoint to use
 */
export type ScanMode = 'single' | 'bulk';

/**
 * Interface for the drum_scan table in the database
 */
export interface DrumScan {
  scan_id: number;
  scanned_at: Date;
  user_id: string;
  device_id: string;
  raw_barcode: string;
  detected_drum: string | null;
  scan_mode: ScanMode;
  status: 'success' | 'error';
  error_code: string | null;
  metadata: Record<string, unknown>;
  parent_scan_id: number | null;
}

/**
 * API Request/Response Types
 */
export interface ScanInput {
  barcode: string;
  jobId?: number; // may not always be linked to a job
  scan_mode: ScanMode;
  authToken: string;
  deviceId?: string;
  metadata?: Record<string, unknown>;
}

export interface ScanResult {
  success: boolean;
  scan_id: string;
  error?: string;
  drum?: string;
}

export interface ScanProcessingResponse {
  scan_id: string;
  drum?: string;
}

export interface ScanCancellationResponse {
  scan_id: string;
  status: string;
}

export type ScanResponse = ScanProcessingResponse | ScanCancellationResponse;

// Replaced type alias with a const map for better access patterns (e.g., ScanError.AUTHORIZATION_ERROR)
// and derived the type from the map's values to maintain compatibility.
export const ScanError = {
  AUTHORIZATION_ERROR: "AUTHORIZATION_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  SCAN_ERROR: "SCAN_ERROR",
  SCAN_EXCEPTION: "SCAN_EXCEPTION",
  DUPLICATE_SCAN: "DUPLICATE_SCAN", // Added based on instruction example
  NOT_FOUND: "NOT_FOUND", // Added common error type
  DATABASE_ERROR: "DATABASE_ERROR", // Added common error type
  UNKNOWN_ERROR: "UNKNOWN_ERROR", // Added common error type
} as const;

export type ScanError = typeof ScanError[keyof typeof ScanError];

/**
 * Real-time event types
 */
export interface ScanEvent {
  type: "connected" | "scan_success" | "scan_error" | "scan_exception";
  barcode?: string;
  jobId?: number;
  scanId?: string;
  error?: string;
  scan_mode?: ScanMode;
}