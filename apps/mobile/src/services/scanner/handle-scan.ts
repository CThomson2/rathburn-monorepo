// /src/services/scanner/handle-scan.ts
/**
 * Handle-scan service
 * This service handles all scanning functionality for the application
 */

// Define the structure of a scan response
export interface ScanResponse {
  success: boolean;
  scanId?: string;
  message?: string;
  error?: string;
  timestamp?: string;
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
const API_URL = import.meta.env.VITE_SCAN_API_URL || 'http://localhost:3000/api/scanner';

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
    console.log(`[SCAN-API] Sending scan to ${API_URL}/scan/single:`, payload);
    
    // Make the API request
    const response = await fetch(
      `${API_URL}/scan/single`, 
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
    const data = await response.json();
    
    // Log the complete response
    console.log(`[SCAN-API] Scan response data:`, data);
    
    return {
      success: response.ok,
      scanId: data.scanId || data.scan_id,
      message: data.message,
      error: data.error,
      timestamp: data.timestamp
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
