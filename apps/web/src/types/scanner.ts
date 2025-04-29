// packages/types/src/scanner.ts
// Shared types for barcode scanning functionality

/**
 * Scan modes (single barcode or batch processing)
 */
export type ScanMode = 'single' | 'bulk';

/**
 * Action types for different barcode scan operations
 */
export type ScanActionType = 
  | 'barcode_scan' // Standard barcode scan
  | 'cancel'       // Cancel a previous scan
  | 'bulk_scan'    // Batch scanning operation
  | 'location_set' // Update drum location
  | 'transport';   // Transport operation

/**
 * Scan status values
 */
export type ScanStatus = 
  | 'pending'  // Scan is being processed
  | 'success'  // Scan was successful
  | 'error'    // Scan failed with an error
  | 'canceled'; // Scan was canceled

/**
 * Input for scan processing
 */
export interface ScanInput {
  barcode: string;           // The scanned barcode
  jobId?: number;            // Optional job ID context
  scan_mode?: ScanMode;      // Scan mode (single or bulk)
  action?: string;           // Action to perform
  deviceId?: string;         // ID of the scanning device
  authToken: string;         // Authentication token
  metadata?: Record<string, any>; // Additional metadata
}

/**
 * Response from scan processing
 */
export interface ScanProcessingResponse {
  scan_id: string;           // ID of the recorded scan
  drum?: string;             // Detected drum code (if applicable)
  timestamp?: string;        // Timestamp of the scan
  status?: ScanStatus;       // Status of the scan
  [key: string]: unknown;    // Additional response data
}

/**
 * Response from scan cancellation
 */
export interface ScanCancellationResponse {
  success: boolean;          // Success status
  scan_id?: string;          // ID of the canceled scan
  message?: string;          // Message describing the result
}

/**
 * Scan result returned to clients
 */
export interface ScanResult {
  success: boolean;          // Whether the scan was successful
  scan_id?: string;          // ID of the scan
  drum?: string;             // Detected drum code
  error?: string;            // Error message (if failed)
  errorDetail?: string;      // Detailed error message
  timestamp?: string;        // Timestamp of the scan
}

/**
 * Server-sent event types
 */
export type ScanEventType = 
  | 'connected'       // Initial connection established
  | 'scan_success'    // Successful scan
  | 'scan_error'      // Error during scan processing
  | 'scan_exception'  // Exception occurred during processing
  | 'scan_canceled';  // Scan was canceled

/**
 * Server-sent event data structure
 */
export interface ScanEvent {
  type: ScanEventType;       // Type of the event
  barcode?: string;          // Scanned barcode
  jobId?: number;            // Job ID context
  scanId?: string;           // Scan ID
  scan_mode?: ScanMode;      // Scan mode
  error?: string;            // Error message (for error events)
  timestamp?: string;        // Event timestamp
}

/**
 * API error types
 */
export enum ScanError {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  DUPLICATE_SCAN = 'DUPLICATE_SCAN',
  SERVER_ERROR = 'SERVER_ERROR',
}

/**
 * Standardized API response format
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp?: string;
}

/**
 * Stored scan data structure (as saved in database)
 */
export interface StoredScanData {
  id: number;
  scan_id: string;
  user_id: string;
  device_id: string;
  raw_barcode: string;
  detected_drum?: string;
  scan_mode: ScanMode;
  status: ScanStatus;
  scan_timestamp: string;
  created_at: string;
  metadata?: {
    job_id?: number;
    scan_mode?: ScanMode;
    app_version?: string;
    source?: string;
    [key: string]: any;
  };
}