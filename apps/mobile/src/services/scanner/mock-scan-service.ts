import { ScanMode } from "@rathburn/types";

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

/**
 * Mock scan service that simulates API responses for testing.
 * This can be used when the real API is not available or for development.
 */
export const mockScanService = {
  /**
   * Test the connection to the mock API service
   */
  testConnection: async (authToken: string): Promise<boolean> => {
    console.log("[MOCK-SCAN] Testing connection with token:", authToken.substring(0, 10) + "...");
    
    // Simulate a delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return true;
  },
  
  /**
   * Handle a scan request and return a simulated response
   */
  handleScan: async (request: ScanRequest): Promise<ScanResponse> => {
    console.log("[MOCK-SCAN] Processing scan request:", request);
    
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // For testing errors, specific barcodes can trigger errors
    if (request.barcode.includes("ERROR")) {
      return {
        success: false,
        barcode: request.barcode,
        error: "Mock error response for testing",
        timestamp: new Date().toISOString(),
        jobId: request.jobId
      };
    }
    
    // Special handling for specific test patterns
    if (request.barcode.includes("TEST-")) {
      const drumId = request.barcode.replace("TEST-", "");
      
      // Simulate a successful scan
      return {
        success: true,
        barcode: request.barcode,
        drum: drumId,
        timestamp: new Date().toISOString(),
        jobId: request.jobId
      };
    }
    
    // Default success response for any other barcode
    return {
      success: true,
      barcode: request.barcode,
      drum: request.barcode,
      timestamp: new Date().toISOString(),
      jobId: request.jobId
    };
  }
};

/**
 * Mock function to set up a simulated event source for real-time updates
 */
export const setupMockScanEventSource = (
  jobId: number,
  eventCallback: (event: ScanEvent) => void
) => {
  console.log("[MOCK-SSE] Setting up mock event source for job:", jobId);
  
  // Send an initial connection event
  setTimeout(() => {
    eventCallback({
      type: "connected",
      message: "Mock SSE connection established",
      jobId
    });
  }, 500);
  
  // Set up a timer to simulate occasional scan events
  const intervalId = setInterval(() => {
    // Only send events sometimes to simulate real-world behavior
    if (Math.random() > 0.7) {
      const isSuccess = Math.random() > 0.2;
      
      if (isSuccess) {
        // Simulate a successful scan from another device
        const mockBarcode = `MOCK-${Math.floor(Math.random() * 10000)}`;
        eventCallback({
          type: "scan_success",
          barcode: mockBarcode,
          drum: mockBarcode,
          jobId,
          scanId: `mock-device-${Math.floor(Math.random() * 100)}`,
          scan_mode: Math.random() > 0.5 ? "single" : "bulk",
          timestamp: new Date().toISOString()
        });
      } else {
        // Simulate an error
        eventCallback({
          type: "scan_error",
          barcode: `ERROR-${Math.floor(Math.random() * 10000)}`,
          error: "Mock scan error from another device",
          jobId,
          scanId: `mock-device-${Math.floor(Math.random() * 100)}`,
          timestamp: new Date().toISOString()
        });
      }
    }
  }, 10000); // Every 10 seconds
  
  // Return a cleanup function
  return () => {
    clearInterval(intervalId);
    console.log("[MOCK-SSE] Cleaned up mock event source");
  };
};

export default mockScanService; 