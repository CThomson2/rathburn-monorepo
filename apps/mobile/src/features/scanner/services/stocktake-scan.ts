// Define the payload for the stocktake scan API
export interface ScanPayload {
  barcode: string;
  sessionId: string;
  deviceId?: string;
}

// Define the expected response structure from the stocktake scan API
// Reusing parts of OriginalScanResponse but tailoring it
export interface ScanResponse {
  success: boolean;
  scanId?: string; // UUID of the scan record in logs.stocktake_scans
  message?: string;
  error?: string;
}

// Get the base API URL from environment - Ensure this points to your Next.js app
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'https://rathburn.app'; // Keep /api here in base
// Define just the path part of the endpoint
const STOCKTAKE_SCAN_ENDPOINT_PATH = '/api/scanner/stocktake/scan'; 
// Construct the full URL
const STOCKTAKE_SCAN_ENDPOINT = `${API_BASE_URL}${STOCKTAKE_SCAN_ENDPOINT_PATH}`;

/**
 * Sends a stocktake scan to the backend API.
 *
 * @param payload - The barcode, session ID, and optional device ID.
 * @param authToken - The user's JWT authentication token.
 * @returns A promise resolving to the API response.
 */
export async function handleScan(
  payload: ScanPayload,
  authToken: string
): Promise<ScanResponse> {
  try {
    console.log('[Scan Service] Sending scan:', payload);
    console.log('[Scan Service] Endpoint:', STOCKTAKE_SCAN_ENDPOINT);

    const response = await fetch(STOCKTAKE_SCAN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'Accept': 'application/json',
      },
      mode: 'cors',
      // credentials: 'include', // Usually not needed when sending Bearer token explicitly
      body: JSON.stringify(payload),
    });

    console.log('[Stocktake Scan Service] Response Status:', response.status);

    const responseData = await response.json();
    console.log('[Stocktake Scan Service] Response Data:', responseData);

    if (!response.ok) {
      // Use the error message from the API response if available
      throw new Error(responseData.error || responseData.message || `Request failed with status ${response.status}`);
    }

    // Return the structured response from the API
    return {
      success: true,
      scanId: responseData.scanId,
      message: responseData.message,
    };

  } catch (error: unknown) {
    console.error('[Stocktake Scan Service] Error:', error);
    // Check if it's an error object before accessing message
    const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unknown error occurred while sending the scan.';
    return {
      success: false,
      error: errorMessage,
    };
  }
} 