// /src/services/transport/handle-scan.ts
import { createClient } from "@/lib/supabase/client";
import {
  ScanMode,
  ScanInput,
  ScanResponse,
  ScanResult,
  ScanProcessingResponse,
  ScanCancellationResponse,
  ScanEvent,
} from "@rathburn/types";

/**
 * Configuration for the scan service
 */
const config = {
  // URL of the NextJS API endpoint
  apiUrl:
    import.meta.env.DEV === true
      ? "http://localhost:3000/api/"
      : "https://rathburn.app/api/",

  // Number of retries for failed requests
  maxRetries: 3,

  // Delay between retries (in milliseconds)
  retryDelay: 1000,

  // Timeout for requests (in milliseconds)
  timeout: 10000,
};

interface ApiResponse {
  scan_id?: string;
  drum?: string;
  [key: string]: unknown;
}

export class ScanService {
  private readonly apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
    console.log("[SCAN-SERVICE] Initialized with API URL:", apiUrl);
  }

  private async makeRequest(
    endpoint: string,
    data: Record<string, unknown>,
    authToken: string
  ): Promise<ApiResponse> {
    const url = `${this.apiUrl}${endpoint}`;
    console.log(`[SCAN-API] Making request to ${url}`);
    console.log(`[SCAN-API] Request data:`, data);
    console.log(`[SCAN-API] Auth token length:`, authToken?.length || 0);
    console.log(`[SCAN-API] Auth token preview:`, authToken ? `${authToken.substring(0, 10)}...` : 'none');
    
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify(data),
        // Explicitly set credentials mode to avoid CORS issues
        credentials: 'omit',
      });

      console.log(`[SCAN-API] Response status:`, response.status);
      
      if (!response.ok) {
        console.error(`[SCAN-API] HTTP error! status: ${response.status}`);
        const errorText = await response.text();
        console.error(`[SCAN-API] Error response:`, errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const responseData = await response.json();
      console.log(`[SCAN-API] Response data:`, responseData);
      return responseData;
    } catch (error) {
      console.error(`[SCAN-API] Request failed:`, error);
      throw error;
    }
  }

  public async processScan(input: ScanInput): Promise<ScanProcessingResponse> {
    const { barcode, jobId, scan_mode, deviceId, authToken } = input;
    console.log(`[SCAN-PROCESS] Processing scan: ${barcode}, job: ${jobId}, mode: ${scan_mode}`);
    
    const endpoint =
      scan_mode === "single" ? "/scanner/scan/single" : "/scanner/scan/bulk";

    const response = await this.makeRequest(
      endpoint,
      { 
        barcode, 
        jobId: jobId || undefined,
        deviceId: deviceId || 'mobile-app' 
      },
      authToken
    );
    
    console.log(`[SCAN-PROCESS] Scan processed, ID: ${response.scan_id}, drum: ${response.drum || 'N/A'}`);
    return {
      scan_id: response.scan_id || `scan_${Date.now()}`,
      drum: response.drum,
    };
  }

  /**
   * Handles the scanning process by calling processScan and wrapping the result.
   *
   * @param input - The scan input containing barcode, job ID, scan_mode, and authentication token.
   * @returns A promise that resolves to a ScanResult object indicating the success status,
   *          scan ID, and optionally the detected drum or an error message.
   */
  async handleScan(input: ScanInput): Promise<ScanResult> {
    try {
      const response = await this.processScan(input);
      return {
        success: true,
        scan_id: response.scan_id,
        drum: response.drum,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        scan_id: `error_${Date.now()}`,
      };
    }
  }

  async handleSingleScan(
    barcode: string,
    jobId: number | undefined,
    authToken: string
  ): Promise<ScanResult> {
    return this.handleScan({
      barcode,
      jobId,
      scan_mode: "single",
      authToken,
    });
  }

  async handleBulkScan(
    barcode: string,
    jobId: number | undefined,
    authToken: string
  ): Promise<ScanResult> {
    return this.handleScan({
      barcode,
      jobId,
      scan_mode: "bulk",
      authToken,
    });
  }

  async cancelScan(scanId: string, authToken: string): Promise<boolean> {
    try {
      await this.makeRequest("/scanner/scan/cancel", { scanId }, authToken);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Test the connection to the API to check for CORS or auth issues
   * @param authToken The authentication token
   * @returns A promise that resolves to true if connected, false otherwise
   */
  async testConnection(authToken: string): Promise<boolean> {
    try {
      console.log("[SCAN-TEST] Testing API connection");
      const response = await fetch(`${this.apiUrl}/ping`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": authToken ? `Bearer ${authToken}` : '',
        },
        // Explicitly set credentials mode to avoid CORS issues
        credentials: 'omit',
      });
      
      console.log(`[SCAN-TEST] Ping response status:`, response.status);
      const responseText = await response.text();
      console.log(`[SCAN-TEST] Ping response:`, responseText);
      
      return response.ok;
    } catch (error) {
      console.error(`[SCAN-TEST] Connection test failed:`, error);
      return false;
    }
  }
}

/**
 * Set up SSE connection for real-time scan updates
 */
export function setupScanEventSource(
  jobId: number,
  onEvent: (event: ScanEvent) => void
): () => void {
  const supabase = createClient();

  // Subscribe to real-time updates for the job's scans
  const subscription = supabase
    .channel("drum_scans")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "logs",
        table: "drum_scan",
      },
      (payload) => {
        // Only process events for this job
        if (payload.new?.metadata?.jobId === jobId) {
          onEvent({
            type: "scan_success",
            barcode: payload.new.raw_barcode,
            jobId: payload.new.metadata.jobId,
            scanId: payload.new.scan_id,
            scan_mode: payload.new.scan_mode,
          });
        }
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "logs",
        table: "drum_scan",
      },
      (payload) => {
        // Handle scan status updates (e.g., error state)
        if (payload.new?.metadata?.jobId === jobId && payload.new?.status === 'error') {
          onEvent({
            type: "scan_error",
            barcode: payload.new.raw_barcode,
            jobId: payload.new.metadata.jobId,
            scanId: payload.new.scan_id,
            error: payload.new.error_code || 'Unknown error',
            scan_mode: payload.new.scan_mode,
          });
        }
      }
    )
    .subscribe();

  // Return cleanup function
  return () => {
    subscription.unsubscribe();
  };
}

export default new ScanService(config.apiUrl);
