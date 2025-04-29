// apps/mobile/src/services/scanner/handle-scan.ts
import { createClient } from "@/lib/supabase/client";
import {
  ScanMode,
  ScanInput,
  ScanProcessingResponse,
  ScanCancellationResponse,
  ScanResult,
  ScanEvent
} from "@/types/scanner";

/**
 * Configuration for the scan service
 */
export const scanConfig = {
  // URL of the NextJS API endpoint
//   apiUrl: import.meta.env.VITE_API_URL || 
//          (import.meta.env.DEV 
//            ? "http://localhost:3000/api/" 
//            : "https://rathburn.app/api/"),
  apiUrl: "http://localhost:3000/api/",

  // Number of retries for failed requests
  maxRetries: 3,

  // Delay between retries (in milliseconds)
  retryDelay: 1000,

  // Timeout for requests (in milliseconds)
  timeout: 10000,
};

/**
 * Handle barcode scanning operations
 */
export class ScanService {
  private readonly apiUrl: string;
  private readonly maxRetries: number;
  private readonly retryDelay: number;
  private readonly timeout: number;

  /**
   * Create a new scan service instance
   */
  constructor(config: { 
    apiUrl: string; 
    maxRetries?: number; 
    retryDelay?: number; 
    timeout?: number;
  }) {
    this.apiUrl = config.apiUrl;
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 1000;
    this.timeout = config.timeout || 10000;
  }

  /**
   * Make an authenticated API request with retries
   * 
   * @param endpoint API endpoint path
   * @param data Request payload
   * @param authToken Authentication token
   * @param retries Number of retries remaining
   * @returns API response
   */
  private async makeRequest(
    endpoint: string,
    data: Record<string, unknown>,
    authToken: string,
    retries = this.maxRetries
  ): Promise<any> {
    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      console.log(`[API] Making request to ${this.apiUrl}${endpoint}`);
      
      const response = await fetch(`${this.apiUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          // Add user agent so server can identify client
          "User-Agent": "RathburnMobileApp/" + (import.meta.env.VITE_APP_VERSION || "1.0.0"),
        },
        body: JSON.stringify(data),
        signal: controller.signal,
        // Ensure credentials are included
        credentials: "include",
        // Explicitly set mode to cors
        mode: "cors"
      });

      // Clear timeout
      clearTimeout(timeoutId);

      // Check if response is ok
      if (!response.ok) {
        // Get error details
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.error || `HTTP error! status: ${response.status}`;
        
        console.error(`[API] Request failed with status ${response.status}:`, errorData || errorMessage);
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      // Improved error logging for network/CORS issues
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.error('[API] Network error - possibly CORS related:', error);
        throw new Error('Network error: Could not connect to the API. This may be due to CORS restrictions or the server being unavailable.');
      }
      
      // Check if we should retry
      if (retries > 0 && !(error instanceof DOMException && error.name === 'AbortError')) {
        console.warn(`[API] Request failed, retrying (${retries} retries left):`, error);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        
        // Retry the request
        return this.makeRequest(endpoint, data, authToken, retries - 1);
      }
      
      // No more retries or abort error (timeout)
      throw error;
    }
  }

  /**
   * Process a barcode scan
   * 
   * @param input Scan input parameters
   * @returns Scan processing response
   */
  public async processScan(input: ScanInput): Promise<ScanProcessingResponse> {
    const { barcode, jobId, scan_mode = 'single', action = 'barcode_scan', authToken, deviceId, metadata } = input;
    const endpoint = scan_mode === "single" ? "scanner/scan/single" : "scanner/scan/bulk";

    // For single mode, send a single scan request
    if (scan_mode === "single") {
      const response = await this.makeRequest(
        endpoint, 
        { 
          barcode, 
          jobId, 
          action,
          deviceId,
          metadata
        }, 
        authToken
      );
      
      return {
        scan_id: response.scan_id || response.data?.scan_id || `scan_${Date.now()}`,
        drum: response.drum || response.data?.detected_drum || barcode,
        timestamp: response.timestamp || response.data?.scan_timestamp || new Date().toISOString(),
        status: response.data?.status || 'success',
      };
    } 
    // For bulk mode, send array of a single barcode (to maintain compatibility)
    else {
      const response = await this.makeRequest(
        endpoint, 
        { 
          barcodes: [barcode],
          jobId,
          action: 'bulk',
          deviceId,
          metadata
        }, 
        authToken
      );
      
      // Extract the single result from the batch response
      const scanResult = 
        response.data?.processed?.[0] || 
        (response.success ? { scan_id: `scan_${Date.now()}`, drum: barcode } : null);
      
      if (!scanResult) {
        throw new Error(response.error || response.data?.failed?.[0]?.error || "Unknown error");
      }
      
      return {
        scan_id: scanResult.scan_id,
        drum: scanResult.drum,
        timestamp: scanResult.timestamp || response.timestamp || new Date().toISOString(),
        status: 'success',
      };
    }
  }

  /**
   * Handle a scan and return a standardized result
   * 
   * @param input Scan input parameters
   * @returns Standardized scan result
   */
  async handleScan(input: ScanInput): Promise<ScanResult> {
    try {
      const response = await this.processScan(input);
      return {
        success: true,
        scan_id: response.scan_id,
        drum: response.drum,
        timestamp: response.timestamp,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        scan_id: `error_${Date.now()}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Handle a single barcode scan
   * 
   * @param barcode Barcode to scan
   * @param jobId Associated job ID
   * @param authToken Authentication token
   * @returns Scan result
   */
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

  /**
   * Handle a bulk barcode scan
   * 
   * @param barcode Barcode to scan
   * @param jobId Associated job ID
   * @param authToken Authentication token
   * @returns Scan result
   */
  async handleBulkScan(
    barcode: string,
    jobId: number | undefined,
    authToken: string
  ): Promise<ScanResult> {
    return this.handleScan({
      barcode,
      jobId,
      scan_mode: "bulk",
      action: "bulk",
      authToken,
    });
  }

  /**
   * Cancel a previously recorded scan
   * 
   * @param scanId ID of the scan to cancel
   * @param authToken Authentication token
   * @returns Success status
   */
  async cancelScan(scanId: string, authToken: string): Promise<boolean> {
    try {
      await this.makeRequest(
        "scanner/scan/cancel", 
        { 
          scanId,
          action: "cancel_scan" 
        }, 
        authToken
      );
      return true;
    } catch (error) {
      console.error("Error canceling scan:", error);
      return false;
    }
  }
  
  /**
   * Process multiple barcodes in a true batch operation
   * 
   * @param barcodes Array of barcodes to process
   * @param jobId Associated job ID
   * @param authToken Authentication token
   * @returns Batch processing results
   */
  async processBarcodesBatch(
    barcodes: string[],
    jobId: number | undefined,
    authToken: string,
    deviceId?: string
  ): Promise<{
    success: boolean;
    processed: ScanResult[];
    failed: { barcode: string; error: string }[];
    totalProcessed: number;
    totalFailed: number;
  }> {
    try {
      const response = await this.makeRequest(
        "scanner/scan/bulk",
        {
          barcodes,
          jobId,
          action: "bulk",
          deviceId
        },
        authToken
      );
      
      return {
        success: response.success,
        processed: response.data?.processed || [],
        failed: response.data?.failed || [],
        totalProcessed: response.data?.totalProcessed || 0,
        totalFailed: response.data?.totalFailed || 0
      };
    } catch (error) {
      console.error("Batch processing error:", error);
      return {
        success: false,
        processed: [],
        failed: barcodes.map(barcode => ({
          barcode,
          error: error instanceof Error ? error.message : "Unknown error"
        })),
        totalProcessed: 0,
        totalFailed: barcodes.length
      };
    }
  }
}

/**
 * Set up Server-Sent Events connection for real-time scan updates
 * 
 * @param jobId Job ID to listen for updates
 * @param onEvent Event handler callback
 * @returns Cleanup function
 */
export function setupScanEventSource(
  jobId: number,
  onEvent: (event: ScanEvent) => void
): () => void {
  // Method 1: Using Supabase real-time
  const supabase = createClient();
  
  // Get auth token for SSE connection
  const getAuthToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  };

  // Set up Supabase real-time subscription
  const supabaseSubscription = supabase
    .channel(`drum_scans_${jobId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "logs",
        table: "drum_scan",
        filter: `metadata->job_id=eq.${jobId}`,
      },
      (payload) => {
        // Process new scan
        onEvent({
          type: "scan_success",
          barcode: payload.new.raw_barcode,
          jobId: payload.new.metadata?.job_id,
          scanId: payload.new.scan_id,
          scan_mode: payload.new.metadata?.scan_mode || "single",
          timestamp: payload.new.scan_timestamp || payload.new.created_at,
        });
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "logs",
        table: "drum_scan",
        filter: `metadata->job_id=eq.${jobId}`,
      },
      (payload) => {
        // Process scan updates (e.g., status changes)
        if (payload.new?.status === "error") {
          onEvent({
            type: "scan_error",
            barcode: payload.new.raw_barcode,
            jobId: payload.new.metadata?.job_id,
            scanId: payload.new.scan_id,
            error: payload.new.error_message || "Unknown error",
            scan_mode: payload.new.metadata?.scan_mode || "single",
            timestamp: payload.new.updated_at,
          });
        } else if (payload.new?.action_type === "cancel") {
          onEvent({
            type: "scan_canceled",
            barcode: payload.new.raw_barcode,
            jobId: payload.new.metadata?.job_id,
            scanId: payload.new.scan_id,
            timestamp: payload.new.updated_at,
          });
        }
      }
    )
    .subscribe();

  // Method 2: Using Server-Sent Events API (as backup)
  let eventSource: EventSource | null = null;
  
  // Create SSE connection after getting auth token
  getAuthToken().then(token => {
    if (!token) {
      console.error("Unable to establish SSE connection - no auth token");
      return;
    }
    
    const apiUrl = scanConfig.apiUrl;
    const sseUrl = `${apiUrl}events/scan?jobId=${jobId}`;
    
    try {
      // Create event source with authorization header
      const eventSourceUrl = new URL(sseUrl);
      
      // Create EventSource with custom headers via a transport polyfill
      // or use a standard EventSource and handle auth in the server
      eventSource = new EventSource(eventSourceUrl.toString(), {
        withCredentials: true
      });
      
      // Connection opened
      eventSource.onopen = () => {
        console.log("SSE connection established");
        onEvent({ type: "connected", timestamp: new Date().toISOString() });
      };
      
      // Handle messages
      eventSource.onmessage = (e) => {
        try {
          const eventData = JSON.parse(e.data) as ScanEvent;
          onEvent(eventData);
        } catch (error) {
          console.error("Error parsing SSE message:", error);
        }
      };
      
      // Handle errors
      eventSource.onerror = (e) => {
        console.error("SSE connection error:", e);
        
        // Attempt to reconnect or fall back to polling
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
      };
    } catch (error) {
      console.error("Error setting up SSE connection:", error);
    }
  });
  
  // Return cleanup function
  return () => {
    console.log("Cleaning up event sources");
    
    // Clean up Supabase subscription
    supabaseSubscription.unsubscribe();
    
    // Clean up SSE connection
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };
}

// Create and export default scan service instance
export default new ScanService(scanConfig);