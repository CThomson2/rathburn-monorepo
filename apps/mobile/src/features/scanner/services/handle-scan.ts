// /src/services/scanner/handle-scan.ts
/**
 * Handle-scan service
 * This service handles all scanning functionality for the application
 */
import { createClient } from "@/lib/supabase/client";

// Define the structure of a scan response
export interface ScanResponse {
  success: boolean;
  scanId?: string;
  message?: string;
  error?: string;
  timestamp?: string;
  updatedInDb?: boolean;
}

// Define the structure of a scan event
export interface ScanEvent {
  type: string;
  barcode?: string;
  drum?: string;
  error?: string;
  jobId?: string | number;
  scanId?: string;
  scan_mode?: string;
  timestamp?: string;
  message?: string;
}

// Get the base API URL from environment
const API_URL = import.meta.env.VITE_API_URL ?? 'https://rathburn.app';

/**
 * Create base fetch options with CORS settings
 */
function createFetchOptions(method: string, token: string, body?: object): RequestInit {
  return {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    },
    mode: 'cors',
    credentials: 'include',
    ...(body ? { body: JSON.stringify(body) } : {})
  };
}

/**
 * Test connection to the scanner API
 */
export async function testConnection(token: string): Promise<boolean> {
  try {
    console.log('[SCAN-API] Testing API connection to:', `${API_URL}/ping`);
    
    const response = await fetch(`${API_URL}/ping`, createFetchOptions('GET', token));
    
    if (!response.ok) {
      console.error('[SCAN-API] Ping failed with status:', response.status);
      return false;
    }
    
    const data = await response.json();
    console.log('[SCAN-API] Ping response:', data);
    return data.status === 'ok';
  } catch (error) {
    console.error('[SCAN-API] Ping error:', error);
    return false;
  }
}

/**
 * Send a single scan to the API
 */
export async function handleScan({
  barcode,
  jobId,
  scan_mode = 'single',
  deviceId = 'unknown',
  authToken
}: {
  barcode: string;
  jobId?: string | number;
  scan_mode?: string;
  deviceId?: string;
  authToken: string;
}): Promise<ScanResponse> {
  try {
    console.log('[SCAN-API] Processing scan:', { barcode, jobId, scan_mode, deviceId });
    
    // Prepare the request payload
    const payload = {
      barcode,
      jobId: jobId || 0,
      scan_mode,
      deviceId
    };
    
    // Log the request details
    console.log(`[SCAN-API] Sending scan to ${API_URL}/scan:`, payload);
    
    // Make the API request
    const response = await fetch(
      `${API_URL}/scan`, 
      createFetchOptions('POST', authToken, payload)
    );
    
    // Log the response status
    console.log(`[SCAN-API] Scan response status:`, response.status);
    
    if (!response.ok) {
      // For non-JSON errors
      if (!response.headers.get('content-type')?.includes('application/json')) {
        throw new Error(`Server responded with status ${response.status}`);
      }
      
      // Try to get error details from JSON
      const errorData = await response.json();
      throw new Error(errorData.error || `Server responded with status ${response.status}`);
    }
    
    // Parse the JSON response
    const apiData = await response.json();
    
    // Log the complete response
    console.log(`[SCAN-API] Scan response data:`, apiData);
    
    // Update drum status in database directly
    let dbUpdateSuccess = false;
    try {
      const supabase = createClient();
      
      console.log('[SUPABASE] Updating drum received status for:', barcode);
      const { data, error: dbError } = await supabase.rpc('mark_drum_as_received', {
        p_serial_number: barcode
      });
      
      if (dbError) {
        console.error('[SUPABASE] Error marking drum as received:', dbError);
      } else {
        console.log('[SUPABASE] Successfully marked drum as received:', barcode);
        dbUpdateSuccess = true;
      }
    } catch (dbErr) {
      console.error('[SUPABASE] Unexpected error marking drum as received:', dbErr);
    }
    
    return {
      success: response.ok,
      scanId: apiData.scanId || apiData.scan_id,
      message: apiData.message,
      error: apiData.error,
      timestamp: apiData.timestamp,
      updatedInDb: dbUpdateSuccess
    };
  } catch (error) {
    console.error('[SCAN-API] Scan error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Export the scan service functions
export default {
  testConnection,
  handleScan
};
