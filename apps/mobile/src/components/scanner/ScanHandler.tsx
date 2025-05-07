// /src/components/transport/ScanHandler.tsx
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { handleScan } from "@/features/scanner/services/handle-scan";
import { Badge } from "@/components/ui/badge";
import Barcode from "./Barcode";
import { useScanJob } from "@/hooks/use-scan-job";
import { useAuth } from "@/hooks/use-auth";
import { useScan } from "@/hooks/use-scan";

/**
 * NOT IN USE
 *
 * ScanHandler component
 * Handles barcode scanning through manual entry or scanner device
 */
export function ScanHandler() {
  const { jobId, setLastScan } = useScanJob();
  const { token } = useAuth();
  const { scannedDrums, setScanMode, resetScannedDrums } = useScan();
  const [barcode, setBarcode] = useState("");
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Process a barcode scan
  const processScan = async (scanBarcode: string) => {
    if (!scanBarcode || isProcessing) return;

    setIsProcessing(true);
    setScanResult(null);

    try {
      // Validate the barcode format
      if (scanBarcode.length < 3) {
        setScanResult({
          success: false,
          error: "Invalid barcode format",
        });
        setIsProcessing(false);
        return;
      }

      console.log(
        `[SCAN] Processing barcode: ${scanBarcode} for job: ${jobId || "no job"}`
      );

      // Call the scan API
      const result = await handleScan({
        barcode: scanBarcode,
        jobId: jobId || undefined,
        authToken: token || "",
        scan_mode: "single",
        deviceId: navigator.userAgent,
      });

      console.log("[SCAN] Result:", result);

      // Update the UI with the result
      setScanResult(result);

      // If successful, update the job's last scan
      if (result.success && setLastScan) {
        setLastScan({
          barcode: scanBarcode,
          timestamp: new Date().toISOString(),
          success: true,
        });

        // Add to scanned drums in context to update UI
        // Using the existing context to track scanned drums
        if (!scannedDrums.includes(scanBarcode)) {
          const updatedDrums = [...scannedDrums, scanBarcode];
          const scanContextEvent = new CustomEvent("scan:update", {
            detail: { drums: updatedDrums },
          });
          window.dispatchEvent(scanContextEvent);
        }
      }

      // Clear the barcode field on success
      if (result.success) {
        setBarcode("");
      }
    } catch (error) {
      console.error("[SCAN] Error:", error);
      setScanResult({
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle barcode input
  const handleBarcodeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBarcode(e.target.value);
  };

  // Handle barcode submission
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processScan(barcode);
  };

  // Handle keyboard events for barcode scanner
  useEffect(() => {
    let scannedBarcode = "";
    let lastKeyTime = 0;
    const SCANNER_TIMEOUT = 50; // Time between keystrokes (ms)

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentTime = new Date().getTime();

      // If this is a hardware scanner (keys come in rapid succession)
      if (currentTime - lastKeyTime <= SCANNER_TIMEOUT) {
        // Enter key signals end of scan from hardware scanner
        if (e.key === "Enter") {
          processScan(scannedBarcode);
          scannedBarcode = "";
        } else {
          scannedBarcode += e.key;
        }
      } else {
        // Reset if too much time has passed (likely manual typing)
        scannedBarcode = e.key;
      }

      lastKeyTime = currentTime;
    };

    // Only add the global event listener when jobId exists
    if (jobId) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [jobId, isProcessing]);

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <form onSubmit={handleBarcodeSubmit} className="space-y-4">
          <div className="flex flex-col space-y-2">
            <h3 className="text-lg font-medium">Scan Drum</h3>
            <div className="flex items-center space-x-2">
              <Barcode
                value={barcode}
                onChange={handleBarcodeInput}
                disabled={isProcessing}
                placeholder="Enter or scan barcode"
                autoFocus
              />
              <Button
                type="submit"
                disabled={!barcode || isProcessing}
                className="h-10"
              >
                Scan
              </Button>
            </div>
          </div>

          {/* Display job ID if available */}
          {jobId && (
            <div>
              <Badge variant="outline" className="bg-muted">
                Job ID: {jobId}
              </Badge>
            </div>
          )}

          {/* Display scan result with Unicode symbols instead of react-icons */}
          {scanResult && (
            <div
              className={`p-3 rounded-md flex items-center space-x-2 ${
                scanResult.success
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
              }`}
            >
              <span className="text-lg">{scanResult.success ? "✓" : "⚠️"}</span>
              <span>
                {scanResult.success
                  ? scanResult.message || "Scan successful"
                  : scanResult.error || "Scan failed"}
              </span>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

export default ScanHandler;
