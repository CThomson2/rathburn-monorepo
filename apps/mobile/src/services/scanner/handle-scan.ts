// /src/services/transport/handle-scan.ts
import { ScanMode } from "@rathburn/types";
import { mockScanService, setupMockScanEventSource } from './mock-scan-service';
import { createClient } from "@/lib/supabase/client";

// Base URL for the scan API
const API_BASE_URL = import.meta.env.VITE_SCAN_API_URL || 'https://api.rathburn.com';

// Flag to enable mock mode for testing - default to true for development
// const USE_MOCK_SERVICE = import.meta.env.VITE_USE_MOCK_SCAN_SERVICE !== 'false';
const USE_MOCK_SERVICE = false;

interface ScanRequest {
  barcode: string;
  jobId: number;
  scan_mode: ScanMode;
  deviceId: string;
  authToken: string;
}

interface ScanResponse {
  success: boolean;
  barcode?: string;
  drum?: string;
  error?: string;
  timestamp?: string;
  jobId?: number;
}

// Define the event types
interface ScanEvent {
  type: 'scan_success' | 'scan_error' | 'scan_exception' | 'connected';
  barcode?: string;
  drum?: string;
  error?: string;
  jobId: number;
  scanId?: string;
  scan_mode?: ScanMode;
  timestamp?: string;
  message?: string;
}

// Add interfaces for the Supabase RPC function results
interface PendingDrumResult {
  pod_id: string;
  pol_id: string;
  serial_number: string;
}

interface DrumReceivedCheckResult {
  drum_exists: boolean;
  is_received: boolean;
}

const scanService = {
  /**
   * Test connection to the scan API
   * @param authToken 
   * @returns boolean indicating if the connection test was successful
   */
  testConnection: async (authToken: string): Promise<boolean> => {
    if (USE_MOCK_SERVICE) {
      console.log("[SCAN-API] Using mock service for connection test");
      return mockScanService.testConnection(authToken);
    }
    
    try {
      console.log("[SCAN-API] Testing connection to:", API_BASE_URL);
      const response = await fetch(`${API_BASE_URL}/ping`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        console.warn("[SCAN-API] Connection test failed with status:", response.status);
        return false;
      }
      
      const data = await response.json();
      return data.status === 'ok';
    } catch (error) {
      console.error("[SCAN-API] Connection test error:", error);
      return false;
    }
  },
  
  /**
   * Handle a scan request
   * @param request The scan request data
   * @returns Scan response with the result
   */
  handleScan: async (request: ScanRequest): Promise<ScanResponse> => {
    if (USE_MOCK_SERVICE) {
      console.log("[SCAN-API] Using mock service for scan");
      return mockScanService.handleScan(request);
    }

    try {
      // First try to process internally with Supabase if possible
      // This allows offline functionality and reduces API calls
      const internalResult = await scanService.processWithSupabase(request);
      if (internalResult) {
        console.log("[SCAN-API] Successfully processed scan internally");
        return internalResult;
      }

      // If internal processing fails or is not possible, use external API
      console.log("[SCAN-API] Internal processing not available, using external API");
      console.log("[SCAN-API] Sending scan request to:", API_BASE_URL);
      const response = await fetch(`${API_BASE_URL}/scan`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${request.authToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          barcode: request.barcode,
          job_id: request.jobId,
          scan_mode: request.scan_mode,
          device_id: request.deviceId
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.warn("[SCAN-API] Scan request failed with status:", response.status);
        return {
          success: false,
          error: data.error || `Server returned ${response.status}`,
          barcode: request.barcode,
          jobId: request.jobId
        };
      }
      
      return {
        success: true,
        ...data,
        barcode: request.barcode,
        jobId: request.jobId
      };
    } catch (error) {
      console.error("[SCAN-API] Scan request error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        barcode: request.barcode,
        jobId: request.jobId
      };
    }
  },

  /**
   * Process the scan request using Supabase RPC functions
   * @param request The scan request data
   * @returns Scan response with the result or null if processing not possible
   */
  processWithSupabase: async (request: ScanRequest): Promise<ScanResponse | null> => {
    try {
      console.log(`[SCAN-SUPABASE] Processing scan for barcode: ${request.barcode}`);
      const supabase = createClient();

      // First, check if the drum exists and if it's already received
      const { data: existingDrum, error: existingError } = await supabase.rpc(
        "check_drum_already_received",
        { p_serial_number: request.barcode }
      );

      if (existingError) {
        console.error("[SCAN-SUPABASE] Error checking drum existence:", existingError);
        return null;
      }

      // Safe type assertion with validation
      if (!existingDrum || typeof existingDrum !== 'object') {
        console.error("[SCAN-SUPABASE] Unexpected response format from check_drum_already_received");
        return null;
      }

      const drumCheck = existingDrum as unknown as DrumReceivedCheckResult;

      // If the drum doesn't exist, return an error
      if (!drumCheck.drum_exists) {
        console.log("[SCAN-SUPABASE] Drum not found in database");
        return {
          success: false,
          error: `No drum found with barcode: ${request.barcode}`,
          barcode: request.barcode,
          jobId: request.jobId
        };
      }

      // If the drum is already received, return a specific error
      if (drumCheck.is_received) {
        console.log("[SCAN-SUPABASE] Drum already received:", request.barcode);
        return {
          success: false,
          error: `Drum ${request.barcode} has already been received`,
          barcode: request.barcode,
          jobId: request.jobId
        };
      }

      // Find the pending drum to get its ID
      const { data: pendingDrum, error: pendingError } = await supabase.rpc(
        "find_pending_drum_by_serial",
        { p_serial_number: request.barcode }
      );

      if (pendingError) {
        console.error("[SCAN-SUPABASE] Error finding pending drum:", pendingError);
        return null;
      }

      if (!pendingDrum || typeof pendingDrum !== 'object') {
        console.error("[SCAN-SUPABASE] Unexpected response format from find_pending_drum_by_serial");
        return null;
      }

      const drumInfo = pendingDrum as unknown as PendingDrumResult;
      const pod_id = drumInfo.pod_id;

      // Mark the drum as received
      const { error: updateError } = await supabase.rpc(
        "mark_drum_as_received",
        { p_pod_id: pod_id }
      );

      if (updateError) {
        console.error("[SCAN-SUPABASE] Error updating drum status:", updateError);
        return null;
      }

      console.log("[SCAN-SUPABASE] Successfully updated drum status");

      // Return success response
      return {
        success: true,
        barcode: request.barcode,
        drum: request.barcode, // Use the barcode as the drum ID for now
        jobId: request.jobId,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error("[SCAN-SUPABASE] Error processing scan with Supabase:", error);
      return null;
    }
  }
};

/**
 * Sets up an EventSource for real-time scan updates
 * @param jobId The job ID to receive updates for
 * @param eventCallback Callback function that receives the SSE events
 * @returns Cleanup function that closes the connection
 */
export const setupScanEventSource = (
  jobId: number,
  eventCallback: (event: ScanEvent) => void
) => {
  if (USE_MOCK_SERVICE) {
    console.log("[SSE-API] Using mock event source");
    return setupMockScanEventSource(jobId, eventCallback);
  }

  console.log(`[SSE-API] Setting up event source for job ${jobId} at ${API_BASE_URL}`);
  
  const eventSource = new EventSource(`${API_BASE_URL}/events/job/${jobId}`);
  
  eventSource.onopen = () => {
    console.log("[SSE-API] EventSource connection opened");
    eventCallback({
      type: "connected",
      message: "EventSource connection established",
      jobId
    });
  };
  
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as ScanEvent;
      console.log("[SSE-API] Received event:", data);
      eventCallback(data);
    } catch (error) {
      console.error("[SSE-API] Error parsing event data:", error);
    }
  };
  
  eventSource.onerror = (error) => {
    console.error("[SSE-API] EventSource error:", error);
  };
  
  return () => {
    console.log("[SSE-API] Closing EventSource connection");
    eventSource.close();
  };
};

export default scanService;
