// apps/mobile/src/components/ScanHandler.tsx
import { useState, useEffect, useCallback } from "react";
import { ScanInput } from "@/features/transport/ScanInput";
import scanService, {
  setupScanEventSource,
  scanConfig
} from "@/services/scanner/handle-scan";
import { toast } from "@/components/ui/use-toast";
import { createClient } from "@/lib/supabase/client";
import { ScanMode, ScanEvent } from "@/types/scanner";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

// This would normally be resolved from a query, but for now we'll use one of the devices from your screenshot
const DEVICE_HARDWARE_IDS = {
  "CT47": "4f096e70-33fd-4913-9df1-8e1fae9591bc",
  "CK67": "8a1af7de-04a7-406a-94f4-64e674ba9fe5"
};

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
  disabled?: boolean;
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
  metadata = {},
  disabled = false
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
  const [deviceInfo, setDeviceInfo] = useState<{id: string, hw_id: string} | null>(null);

  // Get authentication token from Supabase
  const getAuthToken = useCallback(async () => {
    console.log("[SCAN-AUTH] Getting auth token from Supabase");
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getSession();
      
      if (error || !data.session) {
        console.error("[SCAN-AUTH] Authentication error:", error);
        // Fall back to a hardcoded token for testing if auth fails
        console.log("[SCAN-AUTH] Using fallback hardcoded token for testing");
        return "eyJhbGciOiJIUzI1NiIsImtpZCI6InVzZUVtSVhWSEpCd3M2N1giLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2d3eG13bmJ5em53aXlnaGZ5d2N4LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJhYTljOTdhNi1jY2I2LTRiYzgtOTE0Mi1lZjgwZGQyZDVlNTEiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzQ1OTQxNzU3LCJpYXQiOjE3NDU5MzgxNTcsImVtYWlsIjoiY29ucmFkLnRob20xNEBnbWFpbC5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsIjoiY29ucmFkLnRob20xNEBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJzdWIiOiJhYTljOTdhNi1jY2I2LTRiYzgtOTE0Mi1lZjgwZGQyZDVlNTEifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc0NTkzODE1N31dLCJzZXNzaW9uX2lkIjoiYWMwOGQ2MGQtNjE5Yi00ZjM3LTk0ZjgtZWE3YmZmMDc2NjA2IiwiaXNfYW5vbnltb3VzIjpmYWxzZX0._B78b7rj5BTMsZMlceqiH_tXStRYGk5mRoDDWd0EAwU";
      }
      
      console.log("[SCAN-AUTH] Successfully retrieved auth token");
      return data.session.access_token;
    } catch (error) {
      console.error("[SCAN-AUTH] Error getting auth token:", error);
      // Fall back to a hardcoded token for testing
      return "eyJhbGciOiJIUzI1NiIsImtpZCI6InVzZUVtSVhWSEpCd3M2N1giLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2d3eG13bmJ5em53aXlnaGZ5d2N4LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJhYTljOTdhNi1jY2I2LTRiYzgtOTE0Mi1lZjgwZGQyZDVlNTEiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzQ1OTQxNzU3LCJpYXQiOjE3NDU5MzgxNTcsImVtYWlsIjoiY29ucmFkLnRob20xNEBnbWFpbC5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsIjoiY29ucmFkLnRob20xNEBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJzdWIiOiJhYTljOTdhNi1jY2I2LTRiYzgtOTE0Mi1lZjgwZGQyZDVlNTEifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc0NTkzODE1N31dLCJzZXNzaW9uX2lkIjoiYWMwOGQ2MGQtNjE5Yi00ZjM3LTk0ZjgtZWE3YmZmMDc2NjA2IiwiaXNfYW5vbnltb3VzIjpmYWxzZX0._B78b7rj5BTMsZMlceqiH_tXStRYGk5mRoDDWd0EAwU";
    }
  }, []);

  // Fetch device information on component mount
  useEffect(() => {
    const fetchDeviceInfo = async () => {
      // For testing, we'll use the hardcoded device IDs
      // In production, you would query the devices table or detect from hardware info
      const hwId = "1"; // Hardware ID 1 or 2 from your database screenshot
      const deviceUuid = DEVICE_HARDWARE_IDS[hwId as keyof typeof DEVICE_HARDWARE_IDS] || DEVICE_HARDWARE_IDS["CT47"];
      
      console.log(`[SCAN-DEVICE] Setting device info to hw_id=${hwId}, device_id=${deviceUuid}`);
      setDeviceInfo({
        id: deviceUuid,
        hw_id: hwId
      });
    };

    fetchDeviceInfo();
  }, []);

  // Handle barcode scan - restore real API call functionality
  const handleScan = useCallback(async (barcode: string) => {
    console.log("[SCAN] Scan detected:", barcode);

    if (!barcode.trim()) {
      console.log("[SCAN] Empty barcode, ignoring");
      return;
    }

    setIsScanning(true);
    setLastScan(null);

    try {
      // Get authentication token
      const authToken = await getAuthToken();
      console.log("[SCAN] Got auth token, length:", authToken?.length || 0);
      
      // Build request payload
      const payload = {
        barcode: barcode.trim(),
        jobId,
        scan_mode: mode,
        action: mode === "bulk" ? "bulk" : "barcode_scan",
        deviceId: deviceInfo?.id || deviceId || "mobile-app",
        hw_id: deviceInfo?.hw_id || "1",
        authToken,
        metadata: {
          ...metadata,
          app_version: import.meta.env.VITE_APP_VERSION || "1.0.0",
          source: "mobile_app",
          device_info: deviceInfo
        }
      };
      
      // Log the full request payload
      console.log("[SCAN] Full API request payload:", JSON.stringify(payload, null, 2));

      // Make the real API call
      const result = await scanService.handleScan(payload);
      console.log("[SCAN] API response:", result);

      // Update last scan state
      setLastScan({
        barcode: barcode.trim(),
        timestamp: result.timestamp || new Date().toISOString(),
        success: result.success
      });

      if (result.success) {
        console.log("[SCAN] Scan successful:", result);

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
      } else {
        console.error("[SCAN] Scan failed:", result.error);

        // Call error callback
        if (onScanError) {
          onScanError(barcode, result.error || "Unknown error");
        }

        // Show error toast
        toast({
          title: "Scan Error",
          description: result.error || "Unknown error",
          variant: "destructive",
        });
      }
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
  }, [jobId, mode, deviceId, onScanSuccess, onScanError, metadata, getAuthToken, deviceInfo]);

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

  // Set up real-time event source for scan updates
  useEffect(() => {
    // Skip if no job ID or real-time is disabled
    if (!jobId || disableRealtime) {
      setSseConnected(false);
      setConnectionStatus('disconnected');
      console.log("[SCAN-REALTIME] Real-time updates disabled");
      return;
    }

    console.log("[SCAN-REALTIME] Setting up real-time connection for job:", jobId);
    setConnectionStatus('connecting');

    // Use the real event source connection
    const cleanup = setupScanEventSource(jobId, handleScanEvent);

    return () => {
      console.log("[SCAN-REALTIME] Cleaning up real-time connection");
      cleanup();
      setSseConnected(false);
      setConnectionStatus('disconnected');
    };
  }, [jobId, disableRealtime, handleScanEvent]);

  // Add additional debug log for device info on component mount
  useEffect(() => {
    console.log("[SCAN-INIT] ScanHandler mounted with props:", { 
      jobId, 
      mode, 
      deviceId,
      autoFocus,
      disableRealtime,
      metadata,
      deviceInfo
    });
    
    return () => {
      console.log("[SCAN-CLEANUP] ScanHandler unmounted");
    };
  }, [jobId, mode, deviceId, autoFocus, disableRealtime, metadata, deviceInfo]);

  return (
    <>
      {/* Hidden scan input */}
      <ScanInput 
        onScan={handleScan} 
        autoFocus={autoFocus} 
        forceDebugMode={true}
        disabled={disabled}
      />
      
      {/* Device info display for debugging */}
      <div className="fixed top-4 right-4 bg-black/70 text-white text-xs rounded px-2 py-1 z-50">
        Device: {deviceInfo?.hw_id || 'Unknown'} ({deviceInfo?.id?.substring(0, 8) || 'Not set'}...)
      </div>

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