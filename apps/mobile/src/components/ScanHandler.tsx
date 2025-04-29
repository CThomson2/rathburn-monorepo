// apps/mobile/src/components/ScanHandler.tsx
import { useState, useEffect, useCallback } from "react";
import { ScanInput } from "@/features/transport/ScanInput";
import scanService, {
  setupScanEventSource,
  scanConfig
} from "@/services/scanner/handle-scan";
import { toast } from "@/components/ui/use-toast";
import { ScanMode, ScanEvent } from "@/types/scanner";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface ScanHandlerProps {
  jobId?: number;
  mode?: ScanMode;
  deviceId?: string;
  onScanSuccess?: (barcode: string, scanId: string) => void;
  onScanError?: (barcode: string, error: string) => void;
  onScanCancel?: (barcode: string) => void;
  showStatusIndicators?: boolean;
  showConnectionStatus?: boolean;
  autoFocus?: boolean;
  disableRealtime?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Global Scan Handler
 * 
 * Handles scanning a barcode and performs the appropriate action based on the scan type.
 * This component listens for barcode scans, processes them through the API, and provides
 * real-time updates on scan statuses.
 * 
 * @param jobId Associated job ID (optional)
 * @param mode Scan mode ('single' or 'bulk')
 * @param deviceId Optional device identifier
 * @param onScanSuccess Callback when a scan is successful
 * @param onScanError Callback when a scan fails
 * @param onScanCancel Callback when a scan is cancelled
 * @param showStatusIndicators Show visual status indicators
 * @param showConnectionStatus Show real-time connection status
 * @param autoFocus Auto-focus the input on mount
 * @param disableRealtime Disable real-time updates
 * @param metadata Additional metadata to send with scan
 */
export function ScanHandler({
  jobId,
  mode = "single",
  deviceId,
  onScanSuccess,
  onScanError,
  onScanCancel,
  showStatusIndicators = true,
  showConnectionStatus = true,
  autoFocus = true,
  disableRealtime = false,
  metadata = {}
}: ScanHandlerProps) {
  // State for tracking scan processing and connection status
  const [isScanning, setIsScanning] = useState(false);
  const [sseConnected, setSseConnected] = useState(false);
  const [lastScan, setLastScan] = useState<{
    barcode: string;
    timestamp: string;
    success: boolean;
  } | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

  const test_token = "eyJhY2Nlc3NfdG9rZW4iOiJleUpoYkdjaU9pSklVekkxTmlJc0ltdHBaQ0k2SW5WelpVVnRTVmhXU0VwQ2QzTTJOMWdpTENKMGVYQWlPaUpLVjFRaWZRLmV5SnBjM01pT2lKb2RIUndjem92TDJkM2VHMTNibUo1ZW01M2FYbG5hR1o1ZDJONExuTjFjR0ZpWVhObExtTnZMMkYxZEdndmRqRWlMQ0p6ZFdJaU9pSmhZVGxqT1RkaE5pMWpZMkkyTFRSaVl6Z3RPVEUwTWkxbFpqZ3daR1F5WkRWbE5URWlMQ0poZFdRaU9pSmhkWFJvWlc1MGFXTmhkR1ZrSWl3aVpYaHdJam94TnpRMU9UUXhOelUzTENKcFlYUWlPakUzTkRVNU16Z3hOVGNzSW1WdFlXbHNJam9pWTI5dWNtRmtMblJvYjIweE5FQm5iV0ZwYkM1amIyMGlMQ0p3YUc5dVpTSTZJaUlzSW1Gd2NGOXRaWFJoWkdGMFlTSTZleUp3Y205MmFXUmxjaUk2SW1WdFlXbHNJaXdpY0hKdmRtbGtaWEp6SWpwYkltVnRZV2xzSWwxOUxDSjFjMlZ5WDIxbGRHRmtZWFJoSWpwN0ltVnRZV2xzSWpvaVkyOXVjbUZrTG5Sb2IyMHhORUJuYldGcGJDNWpiMjBpTENKbGJXRnBiRjkyWlhKcFptbGxaQ0k2ZEhKMVpTd2ljR2h2Ym1WZmRtVnlhV1pwWldRaU9tWmhiSE5sTENKemRXSWlPaUpoWVRsak9UZGhOaTFqWTJJMkxUUmlZemd0T1RFME1pMWxaamd3WkdReVpEVmxOVEVpZlN3aWNtOXNaU0k2SW1GMWRHaGxiblJwWTJGMFpXUWlMQ0poWVd3aU9pSmhZV3d4SWl3aVlXMXlJanBiZXlKdFpYUm9iMlFpT2lKd1lYTnpkMjl5WkNJc0luUnBiV1Z6ZEdGdGNDSTZNVGMwTlRrek9ERTFOMzFkTENKelpYTnphVzl1WDJsa0lqb2lZV013T0dRMk1HUXROakU1WWkwMFpqTTNMVGswWmpndFpXRTNZalptTURjMk5qQTJJaXdpYVhOZllXNXZibmx0YjNWeklqcG1ZV3h6WlgwLl9CNzhiN3JqNUJUTXNaTWxjZXFpSF90WFN0UllHazVtUm9ERFdkMEVBd1UiLCJ0b2tlbl90eXBlIjoiYmVhcmVyIiwiZXhwaXJlc19pbiI6MzYwMCwiZXhwaXJlc19hdCI6MTc0NTk0MTc1NywicmVmcmVzaF90b2tlbiI6InhpMzN3emppdHlteiIsInVzZXIiOnsiaWQiOiJhYTljOTdhNi1jY2I2LTRiYzgtOTE0Mi1lZjgwZGQyZDVlNTEiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJlbWFpbCI6ImNvbnJhZC50aG9tMTRAZ21haWwuY29tIiwiZW1haWxfY29uZmlybWVkX2F0IjoiMjAyNS0wMy0yN1QyMDowNDoyNS4yMTYxMThaIiwicGhvbmUiOiIiLCJjb25maXJtYXRpb25fc2VudF9hdCI6IjIwMjUtMDMtMjdUMjA6MDM6MDMuNjQwMDI4WiIsImNvbmZpcm1lZF9hdCI6IjIwMjUtMDMtMjdUMjA6MDQ6MjUuMjE2MTE4WiIsImxhc3Rfc2lnbl9pbl9hdCI6IjIwMjUtMDQtMjlUMTQ6NDk6MTcuMTg3ODQzMDQ4WiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsIjoiY29ucmFkLnRob20xNEBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJzdWIiOiJhYTljOTdhNi1jY2I2LTRiYzgtOTE0Mi1lZjgwZGQyZDVlNTEifSwiaWRlbnRpdGllcyI6W10sImNyZWF0ZWRfYXQiOiIyMDI1LTAzLTI3VDIwOjAzOjAzLjYyOTQxM1oiLCJ1cGRhdGVkX2F0IjoiMjAyNS0wNC0yOVQxNDo0OToxNy4xOTQ0NzJaIiwiaXNfYW5vbnltb3VzIjpmYWxzZX19"
  
  // Mock authentication token instead of using Supabase
  const getAuthToken = useCallback(async () => {
    console.log("[SCAN-MOCK] Providing mock auth token");
    // Return a mock token
    return test_token;
  }, []);

  // Handle barcode scan
  const handleScan = useCallback(async (barcode: string) => {
    console.log("[SCAN] Scan detected:", barcode);

    if (!barcode.trim()) {
      console.log("[SCAN] Empty barcode, ignoring");
      return;
    }

    setIsScanning(true);
    setLastScan(null);

    try {
      console.log("[SCAN] Processing scan...");
      // Instead of calling the real API, we'll mock success directly
      
      // Generate a mock scan ID
      const scanId = `mock-scan-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      console.log("[SCAN-MOCK] Generated mock scan ID:", scanId);
      
      // Create mock result
      const result = {
        success: true,
        scan_id: scanId,
        barcode: barcode.trim(),
        timestamp: new Date().toISOString()
      };
      
      console.log("[SCAN-MOCK] Mock scan successful:", result);

      // Update last scan state
      setLastScan({
        barcode: barcode.trim(),
        timestamp: result.timestamp,
        success: result.success
      });

      // Call success callback
      if (onScanSuccess && result.scan_id) {
        console.log("[SCAN] Calling onScanSuccess with:", barcode, result.scan_id);
        onScanSuccess(barcode, result.scan_id);
      } else {
        console.log("[SCAN] onScanSuccess callback not available or no scan_id");
      }

      // Show success toast
      toast({
        title: "Scan Successful",
        description: `Scanned: ${barcode}`,
        variant: "default",
      });
    } catch (error) {
      console.error("[SCAN] Error processing scan:", error);

      // Update last scan state
      setLastScan({
        barcode: barcode.trim(),
        timestamp: new Date().toISOString(),
        success: false
      });

      // Call error callback
      if (onScanError) {
        onScanError(
          barcode,
          error instanceof Error ? error.message : String(error)
        );
      }

      // Show error toast
      toast({
        title: "Scan Failed",
        description: error instanceof Error ? error.message : "Failed to process scan",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  }, [jobId, mode, deviceId, onScanSuccess, onScanError, metadata]);

  // Process real-time scan events
  const handleScanEvent = useCallback((event: ScanEvent) => {
    console.log("[SCAN-EVENT] Received scan event:", event);

    if (event.type === "connected") {
      setSseConnected(true);
      setConnectionStatus('connected');
      console.log("[SCAN-EVENT] SSE connection established");
    } 
    else if (
      event.type === "scan_success" &&
      event.barcode &&
      event.jobId === jobId
    ) {
      console.log("[SCAN-EVENT] Remote scan success:", event);

      // Update last scan state for remote scan
      setLastScan({
        barcode: event.barcode,
        timestamp: event.timestamp || new Date().toISOString(),
        success: true
      });

      // Handle real-time scan success (from another device)
      if (onScanSuccess && event.scanId) {
        onScanSuccess(event.barcode, event.scanId);
      }

      // Show notification toast for remote scan
      toast({
        title: "Remote Scan",
        description: `Scan from another device: ${event.barcode}`,
        variant: "default",
      });
    } 
    else if (
      (event.type === "scan_error" || event.type === "scan_exception") &&
      event.barcode &&
      event.jobId === jobId
    ) {
      console.log("[SCAN-EVENT] Remote scan error:", event);

      // Update last scan state for remote error
      setLastScan({
        barcode: event.barcode,
        timestamp: event.timestamp || new Date().toISOString(),
        success: false
      });

      // Handle real-time scan error (from another device)
      if (onScanError) {
        onScanError(event.barcode, event.error || "Unknown error");
      }

      // Show notification toast for remote error
      toast({
        title: "Remote Scan Error",
        description: `Error from another device: ${event.error || "Unknown error"}`,
        variant: "destructive",
      });
    }
    else if (
      event.type === "scan_canceled" &&
      event.barcode &&
      event.jobId === jobId
    ) {
      console.log("[SCAN-EVENT] Remote scan canceled:", event);

      // Handle real-time scan cancellation
      if (onScanCancel) {
        onScanCancel(event.barcode);
      }

      // Show notification toast for canceled scan
      toast({
        title: "Scan Canceled",
        description: `Scan canceled: ${event.barcode}`,
        variant: "default",
      });
    }
  }, [jobId, onScanSuccess, onScanError, onScanCancel]);

  // Set up real-time event source for scan updates - Mock this functionality
  useEffect(() => {
    // Skip if no job ID or real-time is disabled
    if (!jobId || disableRealtime) {
      setSseConnected(false);
      setConnectionStatus('disconnected');
      console.log("[SCAN-MOCK] Real-time updates disabled");
      return;
    }

    console.log("[SCAN-MOCK] Setting up mock real-time connection for job:", jobId);
    setConnectionStatus('connecting');
    
    // Simulate connection established after a delay
    const timer = setTimeout(() => {
      console.log("[SCAN-MOCK] Simulated real-time connection established");
      setConnectionStatus('connected');
      setSseConnected(true);
    }, 1000);

    return () => {
      console.log("[SCAN-MOCK] Cleaning up mock real-time connection");
      clearTimeout(timer);
      setSseConnected(false);
      setConnectionStatus('disconnected');
    };
  }, [jobId, disableRealtime]);

  // Add a debug log on component mount
  useEffect(() => {
    console.log("[SCAN] ScanHandler mounted with props:", { 
      jobId, 
      mode, 
      deviceId,
      autoFocus,
      disableRealtime,
      metadata
    });
    
    return () => {
      console.log("[SCAN] ScanHandler unmounted");
    };
  }, [jobId, mode, deviceId, autoFocus, disableRealtime, metadata]);

  return (
    <>
      {/* Hidden scan input */}
      <ScanInput onScan={handleScan} autoFocus={autoFocus} />
      
      {/* Log that we're rendering the ScanInput */}
      {console.log("[SCAN] Rendering ScanInput with autoFocus:", autoFocus)}

      {/* Status indicators */}
      {showStatusIndicators && (
        <div className="fixed bottom-4 left-4 flex flex-col space-y-2">
          {/* Processing indicator */}
          {isScanning && (
            <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm flex items-center space-x-2">
              <Loader2 className="animate-spin h-4 w-4" />
              <span>Processing...</span>
            </div>
          )}

          {/* Last scan indicator */}
          {lastScan && (
            <div className={`${lastScan.success ? 'bg-green-500' : 'bg-red-500'} text-white px-3 py-1 rounded-full text-sm`}>
              Last: {lastScan.barcode.substring(0, 10)}{lastScan.barcode.length > 10 ? '...' : ''}
            </div>
          )}
        </div>
      )}

      {/* Connection status indicator */}
      {showConnectionStatus && jobId && !disableRealtime && (
        <div 
          className="fixed bottom-4 right-4 flex items-center space-x-2"
          title={`Real-time connection: ${connectionStatus}`}
        >
          {connectionStatus === 'connected' ? (
            <Badge variant="outline" className="bg-green-500 text-white border-none">
              <div className="h-2 w-2 rounded-full bg-white mr-1" /> Live
            </Badge>
          ) : connectionStatus === 'connecting' ? (
            <Badge variant="outline" className="bg-yellow-500 text-white border-none">
              <Loader2 className="animate-spin h-2 w-2 mr-1" /> Connecting
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-gray-500 text-white border-none">
              <div className="h-2 w-2 rounded-full bg-white mr-1" /> Offline
            </Badge>
          )}
        </div>
      )}
    </>
  );
}

export default ScanHandler;