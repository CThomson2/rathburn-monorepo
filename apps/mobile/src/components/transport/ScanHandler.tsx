// /src/components/transport/ScanHandler.tsx
import { useState, useEffect, useRef } from "react";
import scanService, {
  setupScanEventSource,
} from "@/services/transport/handle-scan";
import { toast } from "react-hot-toast"; // Assuming you're using react-hot-toast for notifications

interface ScanHandlerProps {
  jobId: number;
  onScanSuccess?: (barcode: string) => void;
  onScanError?: (barcode: string, error: string) => void;
  onScanCancel?: (barcode: string) => void;
  autoFocus?: boolean;
}

export function ScanHandler({
  jobId,
  onScanSuccess,
  onScanError,
  onScanCancel,
  autoFocus = true,
}: ScanHandlerProps) {
  const [barcode, setBarcode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [sseConnected, setSseConnected] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle barcode input
  const handleBarcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBarcode(e.target.value);
  };

  // Handle barcode submission
  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!barcode.trim()) return;

    setIsScanning(true);

    try {
      const result = await scanService.processScan({
        barcode: barcode.trim(),
        jobId,
        action: "barcode_scan",
      });

      if (result.success) {
        // Handle successful scan
        if (onScanSuccess) {
          onScanSuccess(barcode);
        }

        // Show success toast
        toast.success(`Successfully scanned: ${barcode}`);
      } else {
        // Handle scan error
        if (onScanError) {
          onScanError(barcode, result.error || "Unknown error");
        }

        // Show error toast
        toast.error(`Scan error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error scanning barcode:", error);

      // Handle scan exception
      if (onScanError) {
        onScanError(
          barcode,
          error instanceof Error ? error.message : String(error)
        );
      }

      // Show error toast
      toast.error("Failed to process scan");
    } finally {
      setIsScanning(false);
      setBarcode("");

      // Re-focus the input
      if (inputRef.current && autoFocus) {
        inputRef.current.focus();
      }
    }
  };

  // Cancel a previously scanned barcode
  const handleCancelScan = async (barcodeToCancel: string) => {
    try {
      const result = await scanService.cancelScan(barcodeToCancel, jobId);

      if (result.success) {
        // Handle successful cancellation
        if (onScanCancel) {
          onScanCancel(barcodeToCancel);
        }

        // Show success toast
        toast.success(`Cancelled scan: ${barcodeToCancel}`);
      } else {
        // Show error toast
        toast.error(`Failed to cancel scan: ${result.error}`);
      }
    } catch (error) {
      console.error("Error cancelling scan:", error);
      toast.error("Failed to cancel scan");
    }
  };

  // Set up SSE connection for real-time updates
  useEffect(() => {
    let cleanup: () => void = () => {};

    const setupSSE = async () => {
      try {
        // Set up SSE connection
        cleanup = setupScanEventSource(jobId, (event) => {
          if (event.type === "connected") {
            setSseConnected(true);
            console.log("SSE connection established");
          } else if (
            event.type === "scan_success" &&
            event.barcode &&
            event.jobId === jobId
          ) {
            // Handle real-time scan success (from another device)
            if (onScanSuccess) {
              onScanSuccess(event.barcode);
            }

            // Show toast for scan from another device
            toast.success(`Scan from another device: ${event.barcode}`);
          } else if (
            (event.type === "scan_error" || event.type === "scan_exception") &&
            event.barcode &&
            event.jobId === jobId
          ) {
            // Handle real-time scan error (from another device)
            if (onScanError) {
              onScanError(event.barcode, event.error || "Unknown error");
            }
          }
        });
      } catch (error) {
        console.error("Error setting up SSE:", error);
        setSseConnected(false);
      }
    };

    setupSSE();

    return () => {
      // Clean up SSE connection
      cleanup();
    };
  }, [jobId, onScanSuccess, onScanError]);

  // Auto-focus the input on mount and when the window regains focus
  useEffect(() => {
    if (!autoFocus) return;

    const focusInput = () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };

    // Focus on mount
    focusInput();

    // Re-focus when window regains focus
    window.addEventListener("focus", focusInput);

    // Re-focus when document is clicked
    document.addEventListener("click", focusInput);

    return () => {
      window.removeEventListener("focus", focusInput);
      document.removeEventListener("click", focusInput);
    };
  }, [autoFocus]);

  return (
    <div>
      {/* Hidden form for barcode input */}
      <form onSubmit={handleBarcodeSubmit} className="hidden">
        <input
          ref={inputRef}
          type="text"
          value={barcode}
          onChange={handleBarcodeChange}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          inputMode="none" // Prevent keyboard on mobile
          className="opacity-0 h-0 w-0 absolute"
          aria-hidden="true"
          disabled={isScanning}
        />
      </form>

      {/* Optional visual indicator for scanning status */}
      {isScanning && (
        <div className="fixed bottom-4 left-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
          Processing...
        </div>
      )}

      {/* Optional visual indicator for SSE connection */}
      {sseConnected && (
        <div
          className="fixed bottom-4 right-4 bg-green-500 text-white w-3 h-3 rounded-full"
          title="Real-time connection active"
        />
      )}

      {/* This component is primarily functional, not visual */}
    </div>
  );
}

export default ScanHandler;
