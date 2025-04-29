// /src/components/transport/ScanHandler.tsx
import { useState, useEffect } from "react";
import { ScanInput } from "@/features/transport/ScanInput";
import scanService, {
  setupScanEventSource,
} from "@/services/scanner/handle-scan";
import { toast } from "@/components/ui/use-toast";
import { createClient } from "@/lib/supabase/client";
import { ScanMode } from "@rathburn/types";

interface ScanHandlerProps {
  jobId: number;
  scan_mode: ScanMode;
  onScanSuccess?: (barcode: string) => void;
  onScanError?: (barcode: string, error: string) => void;
  // onScanCancel?: (barcode: string) => void;
}

/**
 * Global Scan Handler
 * Handles scanning a barcode and performs the appropriate action based on the scan type
 * @param jobId The ID of the job
 * @param scan_mode The scan mode ('single' or 'bulk')
 * @param onScanSuccess Called when a scan is successful
 * @param onScanError Called when a scan fails
 * @param onScanCancel Called when a scan is cancelled
 * @param autoFocus Whether to auto-focus the input when the component mounts and when the window regains focus
 */
export function ScanHandler({
  jobId,
  scan_mode = "single",
  onScanSuccess,
  onScanError,
}: ScanHandlerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [sseConnected, setSseConnected] = useState(false);

  // Handle barcode scan
  const handleScan = async (barcode: string) => {
    console.log("Scan detected:", barcode);

    if (!barcode.trim()) return;

    setIsScanning(true);

    try {
      // Get the current session for auth token
      const supabase = createClient();
      const {
        data: { session },
        error: authError,
      } = await supabase.auth.getSession();

      if (authError || !session) {
        console.error("Auth error:", authError);
        throw new Error("Authentication required");
      }

      console.log("Processing scan with auth token");

      const result = await scanService.handleScan({
        barcode: barcode.trim(),
        jobId,
        scan_mode,
        deviceId: "mobile-app",
        authToken: session.access_token,
      });

      if (result.success) {
        console.log("Scan successful:", result);

        // Handle successful scan
        if (onScanSuccess) {
          onScanSuccess(barcode);
        }

        toast({
          title: "Scan Successful",
          description: `Scanned: ${barcode}, Drum: ${result.drum || "N/A"}`,
          variant: "default",
        });
      } else {
        console.error("Scan failed:", result.error);

        // Handle scan error
        if (onScanError) {
          onScanError(barcode, result.error || "Unknown error");
        }

        toast({
          title: "Scan Error",
          description: result.error || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error processing scan:", error);

      // Handle scan exception
      if (onScanError) {
        onScanError(
          barcode,
          error instanceof Error ? error.message : String(error)
        );
      }

      toast({
        title: "Scan Failed",
        description: "Failed to process scan",
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
        "Invalid jobId provided to ScanHandler, SSE not initialized."
      );
      return;
    }

    console.log("Setting up SSE connection for job:", jobId);

    const cleanup = setupScanEventSource(jobId, (event) => {
      console.log("Received SSE event:", event);

      if (event.type === "connected") {
        setSseConnected(true);
        console.log("SSE connection established");
      } else if (
        event.type === "scan_success" &&
        event.barcode &&
        event.jobId === jobId
      ) {
        console.log("Remote scan success:", event);

        // Handle real-time scan success (from another device)
        if (onScanSuccess) {
          onScanSuccess(event.barcode);
        }

        toast({
          title: "Remote Scan Success",
          description: `Device: ${event.scanId || "Unknown"} - Mode: ${event.scan_mode || "N/A"}`,
          variant: "default",
        });
      } else if (
        (event.type === "scan_error" || event.type === "scan_exception") &&
        event.barcode &&
        event.jobId === jobId
      ) {
        console.log("Remote scan error:", event);

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
      console.log("Cleaning up SSE connection");
      cleanup();
    };
  }, [jobId, onScanSuccess, onScanError]);

  return (
    <>
      {/* Hidden scan input */}
      <ScanInput onScan={handleScan} />

      {/* Optional visual indicators */}
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
