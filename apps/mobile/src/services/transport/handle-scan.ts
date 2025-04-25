// /src/services/transport/handle-scan.ts
import { getSupabaseAuth } from '@/lib/supabase/auth';

// Define the types for scan actions
type ScanAction =
  | "context_get"
  | "context_set"
  | "transport"
  | "location_set"
  | "barcode_scan"
  | "cancel_scan"
  | "fast_forward"
  | "bulk";

// Define the parameters for a scan request
interface ScanParams {
  barcode: string;
  jobId: number;
  action: ScanAction;
}

// Define the response structure
interface ScanResponse {
  success: boolean;
  data?: any;
  error?: string;
  errorDetail?: string;
  timestamp?: string;
}

/**
 * Configuration for the scan service
 */
const config = {
  // URL of the NextJS API endpoint
  apiUrl: import.meta.env.VITE_API_URL || 'https://rathburn.app/api/logs/drum-scan',
  
  // Number of retries for failed requests
  maxRetries: 3,
  
  // Delay between retries (in milliseconds)
  retryDelay: 1000,
  
  // Timeout for requests (in milliseconds)
  timeout: 10000,
};

/**
 * Service for handling drum scans in the transport view
 */
export const scanService = {
  /**
   * Process a barcode scan for a transport job
   * 
   * @param params The scan parameters
   * @returns A promise that resolves to the scan response
   */
  async processScan(params: ScanParams): Promise<ScanResponse> {
    const { barcode, jobId, action } = params;
    
    try {
      // Get the authentication token
      const auth = await getSupabaseAuth();
      if (!auth.session) {
        return {
          success: false,
          error: 'Not authenticated',
        };
      }
      
      // Get the access token
      const token = auth.session.access_token;
      
      // Create the request headers
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };
      
      // Prepare the request body
      const body = JSON.stringify({
        barcode,
        jobId,
        action,
      });
      
      // Send the request with retry logic
      return await this.sendWithRetry(() => 
        fetch(config.apiUrl, {
          method: 'POST',
          headers,
          body,
          signal: AbortSignal.timeout(config.timeout),
        })
      );
      
    } catch (error) {
      console.error('Error processing scan:', error);
      
      // Return a formatted error response
      return {
        success: false,
        error: 'Failed to process scan',
        errorDetail: error instanceof Error ? error.message : String(error),
      };
    }
  },
  
  /**
   * Send a request with retry logic
   * 
   * @param fetchFn A function that returns a fetch promise
   * @returns A promise that resolves to the scan response
   */
  async sendWithRetry(fetchFn: () => Promise<Response>): Promise<ScanResponse> {
    let retries = 0;
    let lastError: any;
    
    while (retries < config.maxRetries) {
      try {
        // Send the request
        const response = await fetchFn();
        
        // Check if the request was successful
        if (!response.ok) {
          // If the response is 401 or 403, don't retry
          if (response.status === 401 || response.status === 403) {
            const errorData = await response.json().catch(() => ({}));
            return {
              success: false,
              error: errorData.error || `HTTP error ${response.status}`,
            };
          }
          
          // For other errors, throw to trigger retry
          throw new Error(`HTTP error ${response.status}`);
        }
        
        // Parse the response
        const data = await response.json();
        return data;
        
      } catch (error) {
        lastError = error;
        retries++;
        
        // If we've reached the max retries, break out of the loop
        if (retries >= config.maxRetries) break;
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, config.retryDelay));
      }
    }
    
    // Return an error response after all retries have failed
    return {
      success: false,
      error: 'Maximum retries exceeded',
      errorDetail: lastError instanceof Error ? lastError.message : String(lastError),
    };
  },
  
  /**
   * Bulk register multiple barcodes
   * 
   * @param jobId The ID of the job
   * @param barcodes An array of barcodes to register
   * @returns A promise that resolves to an array of scan responses
   */
  async bulkRegister(jobId: number, barcodes: string[]): Promise<ScanResponse[]> {
    // Process each barcode in sequence to avoid race conditions
    const results: ScanResponse[] = [];
    
    for (const barcode of barcodes) {
      const result = await this.processScan({
        barcode,
        jobId,
        action: 'bulk',
      });
      
      results.push(result);
      
      // If one fails, continue with the rest but log the error
      if (!result.success) {
        console.error(`Failed to bulk register barcode ${barcode}:`, result.error);
      }
    }
    
    return results;
  },
  
  /**
   * Cancel a scan
   * 
   * @param barcode The barcode to cancel
   * @param jobId The ID of the job
   * @returns A promise that resolves to the scan response
   */
  async cancelScan(barcode: string, jobId: number): Promise<ScanResponse> {
    return this.processScan({
      barcode,
      jobId,
      action: 'cancel_scan',
    });
  },
};

/**
 * Setup event source for real-time scan confirmations (optional)
 * 
 * @param jobId The ID of the job to listen for events
 * @param onEvent Callback function for handling events
 * @returns A function to close the event source
 */
export function setupScanEventSource(
  jobId: number,
  onEvent: (event: any) => void
): () => void {
  try {
    const auth = getSupabaseAuth();
    
    // Get the authentication token asynchronously
    auth.then(({ session }) => {
      if (!session) {
        console.error('Cannot setup event source: Not authenticated');
        return;
      }
      
      const token = session.access_token;
      
      // Create the event source URL with authentication
      const url = new URL('/api/events/scan', config.apiUrl);
      url.searchParams.append('jobId', jobId.toString());
      
      // Create the event source
      const eventSource = new EventSource(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      // Setup event handlers
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onEvent(data);
        } catch (error) {
          console.error('Error parsing event data:', error);
        }
      };
      
      eventSource.onerror = (error) => {
        console.error('Event source error:', error);
        // Attempt to reconnect after a delay
        setTimeout(() => eventSource.close(), 5000);
      };
      
      // Return a function to close the event source
      return () => {
        eventSource.close();
      };
    });
    
    // Return a dummy function for the async case
    return () => {};
    
  } catch (error) {
    console.error('Error setting up event source:', error);
    return () => {};
  }
}

export default scanService;

/**
 * create table logs.drum_scan (
 *  scan_id bigserial not null,
 *  scanned_at timestamp with time zone not null default now(),
 *  user_id uuid not null,
 *  device_id uuid not null,
 *  raw_barcode text not null,
 *  detected_drum uuid null,
 *  action_type inventory.action_type not null default 'barcode_scan'::inventory.action_type,
 *  status text not null,
 *  error_code text null,
 *  metadata jsonb not null default '{}'::jsonb,
 *  constraint drum_scan_pkey primary key (scan_id),
 *  constraint drum_scan_detected_drum_fkey foreign KEY (detected_drum) references inventory.drums (drum_id),
 *  constraint drum_scan_device_id_fkey foreign KEY (device_id) references logs.devices (device_id) on delete RESTRICT,
 *  constraint drum_scan_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete RESTRICT,
 *  constraint chk_status check (
 *    (
 *      status = any (array['success'::text, 'error'::text])
 *    )
 *  )
 *) TABLESPACE pg_default;

create trigger trg_apply_context
after INSERT on logs.drum_scan for EACH row
execute FUNCTION logs.fn_apply_context_to_drum ();

create trigger trg_detected_drum BEFORE INSERT on logs.drum_scan for EACH row
execute FUNCTION logs.set_detected_drum ();

create trigger trg_update_location
after INSERT on logs.drum_scan for EACH row
execute FUNCTION logs.update_drum_location ();
 */