// /src/components/transport/ScanHandler.tsx
import { useState, useEffect } from "react";
import { ScanInput } from "@/features/transport/ScanInput";
import scanService, {
  setupScanEventSource,
} from "@/services/scanner/handle-scan";
import { toast } from "@/components/ui/use-toast";
import { createAuthClient } from "@/lib/supabase/client";
import { ScanMode } from "@rathburn/types";

interface ScanHandlerProps {
  jobId: number;
  scan_mode: ScanMode;
  onScanSuccess?: (barcode: string) => void;
  onScanError?: (barcode: string, error: string) => void;
}

/**
 * Global Scan Handler
 * Handles scanning a barcode and performs the appropriate action based on the scan type.
 * It provides:
 * - An invisible input field that captures barcode scans
 * - API integration to process scans
 * - Real-time updates via server-sent events (SSE)
 * - Visual indicators for scan status
 *
 * @param jobId The ID of the job (used for associating scans)
 * @param scan_mode The scan mode ('single' or 'bulk')
 * @param onScanSuccess Called when a scan is successful
 * @param onScanError Called when a scan fails
 */
export function ScanHandler({
  jobId,
  scan_mode = "single",
  onScanSuccess,
  onScanError,
}: ScanHandlerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [sseConnected, setSseConnected] = useState(false);

  // Test API connection when component mounts
  useEffect(() => {
    const testApiConnection = async () => {
      try {
        console.log("[SCAN-INIT] Testing API connection");
        const supabase = createAuthClient();
        const { data } = await supabase.auth.getSession();
        const session = data.session;

        if (!session?.access_token) {
          console.warn("[SCAN-INIT] No access token available for API test");
          return;
        }

        console.log(
          "[SCAN-INIT] Got access token, length:",
          session.access_token.length
        );

        const connectionSuccessful = await scanService.testConnection(
          session.access_token
        );
        console.log(
          "[SCAN-INIT] API connection test result:",
          connectionSuccessful ? "Success" : "Failed"
        );
      } catch (error) {
        console.error("[SCAN-INIT] API connection test error:", error);
      }
    };

    testApiConnection();
  }, []);

  // Handle barcode scan
  const handleScan = async (barcode: string) => {
    if (!barcode.trim()) {
      console.log("[SCAN-VALIDATE] Empty barcode, ignoring");
      return;
    }

    console.log("[SCAN-INIT] Scan detected:", barcode);
    setIsScanning(true);

    try {
      // Get the current session for auth token
      const supabase = createAuthClient();
      const { data, error: authError } = await supabase.auth.getSession();
      const session = data.session;

      if (authError || !session?.access_token) {
        console.error("[SCAN-AUTH] Auth error:", authError || "No session");
        throw new Error("Authentication required");
      }

      // Process the scan via the scan service
      const result = await scanService.handleScan({
        barcode: barcode.trim(),
        jobId,
        scan_mode,
        deviceId: "mobile-app",
        authToken: session.access_token,
      });

      if (result.success) {
        console.log("[SCAN-SUCCESS] Scan completed successfully");

        // Handle successful scan
        if (onScanSuccess) {
          onScanSuccess(barcode);
        }
      } else {
        console.error("[SCAN-ERROR] Scan failed:", result.error);

        // Handle scan error
        if (onScanError) {
          onScanError(barcode, result.error || "Unknown error");
        }
      }
    } catch (error) {
      console.error("[SCAN-EXCEPTION] Error processing scan:", error);

      // Handle scan exception
      if (onScanError) {
        onScanError(
          barcode,
          error instanceof Error ? error.message : String(error)
        );
      }

      toast({
        title: "Scan Failed",
        description:
          error instanceof Error ? error.message : "Failed to process scan",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  // Set up SSE connection for real-time updates
  useEffect(() => {
    if (typeof jobId !== "number" || isNaN(jobId)) {
      console.warn(
        "[SSE-INIT] Invalid jobId provided to ScanHandler, SSE not initialized."
      );
      return;
    }

    console.log("[SSE-INIT] Setting up SSE connection for job:", jobId);

    const cleanup = setupScanEventSource(jobId, (event) => {
      console.log("[SSE-EVENT] Received SSE event:", event);

      if (event.type === "connected") {
        setSseConnected(true);
        console.log("[SSE-CONNECTED] SSE connection established");
      } else if (
        event.type === "scan_success" &&
        event.barcode &&
        event.jobId === jobId
      ) {
        console.log("[SSE-SCAN] Remote scan success:", event);

        // Handle real-time scan success (from another device)
        if (onScanSuccess) {
          onScanSuccess(event.barcode);
        }

        toast({
          title: "Remote Scan Success",
          description: `Device: ${event.scanId || "Unknown"} - Barcode: ${event.barcode}`,
          variant: "default",
        });
      } else if (
        (event.type === "scan_error" || event.type === "scan_exception") &&
        event.barcode &&
        event.jobId === jobId
      ) {
        console.log("[SSE-ERROR] Remote scan error:", event);

        // Handle real-time scan error (from another device)
        if (onScanError) {
          onScanError(event.barcode, event.error || "Unknown error");
        }

        toast({
          title: "Remote Scan Error",
          description: `Error: ${event.error || "Unknown"}`,
          variant: "destructive",
        });
      }
    });

    return () => {
      console.log("[SSE-CLEANUP] Cleaning up SSE connection");
      cleanup();
    };
  }, [jobId, onScanSuccess, onScanError]);

  return (
    <>
      {/* Hidden scan input */}
      <ScanInput onScan={handleScan} />

      {/* Visual indicators */}
      {isScanning && (
        <div className="fixed bottom-4 left-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
          Processing...
        </div>
      )}

      {sseConnected && (
        <div
          className="fixed bottom-4 right-4 bg-green-500 text-white w-3 h-3 rounded-full"
          title="Real-time connection active"
        />
      )}
    </>
  );
}

export default ScanHandler;
