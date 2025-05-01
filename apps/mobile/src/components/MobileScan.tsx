// Mobile scan handler for Vite PWA
// @/components/stocktake/MobileScanHandler.tsx
import React, { useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";

interface ScanResult {
  success: boolean;
  message: string;
  scanEvent?: any;
}

// Probably deprecated as ScanHandler.tsx exists.
export const MobileScanHandler: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");

  const handleScan = async (scanValue: string) => {
    if (scanValue === lastScan) return; // Prevent duplicate scans

    setLastScan(scanValue);

    try {
      // Determine if this is a material code or drum ID
      const isMaterialCode = scanValue.startsWith("MAT-");

      if (!isMaterialCode) {
        // For drum ID, need to have material code already scanned
        const currentMaterialCode = sessionStorage.getItem(
          "currentMaterialCode"
        );
        if (!currentMaterialCode) {
          setMessage("Please scan material code first");
          return;
        }

        // Send to API
        const response = await fetch("/api/stocktake/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            materialCode: currentMaterialCode,
            drumId: scanValue,
            deviceId: navigator.userAgent, // Simple device identification
            userId: sessionStorage.getItem("userId") || "mobile-user",
          }),
        });

        const result: ScanResult = await response.json();

        if (result.success) {
          setMessage(`Drum ${scanValue} scanned successfully`);
        } else {
          setMessage(result.message || "Scan failed");
        }
      } else {
        // Material code scanned
        sessionStorage.setItem("currentMaterialCode", scanValue);
        setMessage(`Material selected: ${scanValue}`);
      }
    } catch (error) {
      console.error("Scan error:", error);
      setMessage("Error recording scan");
    }
  };

  const startScanning = async () => {
    setScanning(true);
    const codeReader = new BrowserMultiFormatReader();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Set up video element and start scanning
      // This is a simplified example - you'd need proper video handling
    } catch (error) {
      console.error("Scanner error:", error);
      setMessage("Camera access denied");
      setScanning(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Stock Take Scanner</h2>

      {message && (
        <div
          className={`p-3 mb-4 rounded ${
            message.includes("success")
              ? "bg-green-100 text-green-800"
              : "bg-amber-100 text-amber-800"
          }`}
        >
          {message}
        </div>
      )}

      {!scanning ? (
        <button
          onClick={startScanning}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg w-full"
        >
          Start Scanning
        </button>
      ) : (
        <div className="text-center">
          <p>Scanning... Point camera at barcode</p>
        </div>
      )}
    </div>
  );
};
