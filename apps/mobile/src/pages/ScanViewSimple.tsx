import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, FileText, Download, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

// API config - will be different in dev vs production
const API_BASE_URL = (() => {
  if (process.env.NODE_ENV === "production") {
    return "https://rathburn.app/api";
  }

  // For development and preview modes
  const host = window.location.hostname;

  // When using the dev server proxy, we can use the relative URL
  // This works with Vite's proxy settings in vite.config.ts
  return "/api";

  // Old approach without proxy - keeping for reference
  // If you need to disable the proxy, use this instead
  /*
  if (host === "localhost" || host === "127.0.0.1") {
    // In local development, use the Express API server running on port 3001
    return "http://localhost:3001/api";
  }
  
  // For preview deployments or other environments
  return `${window.location.protocol}//${host}/api`;
  */
})();

/**
 * Simple barcode scanner view.
 *
 * This component is a simplified version of the barcode scanner view.
 * It does not include job selection, quantity tracking, or any other features beyond
 * simply scanning barcodes and displaying the number of scans.
 *
 * @returns A React component that renders a simple barcode scanner view.
 */
const ScanViewSimple = () => {
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deviceId, setDeviceId] = useState<string>("");
  const [localScanCount, setLocalScanCount] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate or retrieve device ID on component mount
  useEffect(() => {
    // Try to get existing deviceId from localStorage
    const storedDeviceId = localStorage.getItem("device_id");

    if (storedDeviceId) {
      setDeviceId(storedDeviceId);
    } else {
      // Generate a new device ID
      const newDeviceId = `mobile-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      localStorage.setItem("device_id", newDeviceId);
      setDeviceId(newDeviceId);
    }
  }, []);

  const toggleScanner = () => {
    if (!isActive) {
      setIsActive(true);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } else {
      // Already active, do nothing
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const barcode = e.target.value;
      processScan(barcode);
      e.target.value = ""; // Clear input for next scan
    }
  };

  // Send scan data to API
  const sendScanToAPI = async (barcode: string) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      console.log(`Sending scan to API: ${API_BASE_URL}/logs/drum-scan`);

      const response = await fetch(`${API_BASE_URL}/logs/drum-scan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rawBarcode: barcode,
          deviceId: deviceId,
          actionType: "transport",
          metadata: {
            timestamp: new Date().toISOString(),
            source: "mobile-app-simple",
          },
        }),
        credentials: "include",
        mode: "cors",
      });

      // Check response status
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API error:", response.status, errorData);
        throw new Error(
          errorData.error || `Server responded with ${response.status}`
        );
      }

      const data = await response.json();
      console.log("API response:", data);

      // Update local scan count if provided
      if (data.totalLocalScans) {
        setLocalScanCount(data.totalLocalScans);
      }

      return data.scan;
    } catch (error) {
      console.error("Error logging scan:", error);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const processScan = async (barcode: string) => {
    // Increment counter
    setScanCount((prev) => prev + 1);

    // Send to API
    await sendScanToAPI(barcode);
  };

  const handleComplete = () => {
    setShowReport(true);
  };

  const closeReport = () => {
    setShowReport(false);
    setIsActive(false);
    setScanCount(0);
    navigate("/");
  };

  // Mock function to simulate barcode scan from hardware
  const simulateScan = () => {
    if (isActive) {
      const mockBarcode = `MOCK-${Date.now()}`;
      processScan(mockBarcode);
    }
  };

  // Export scans as CSV
  const exportScansCSV = async () => {
    try {
      setIsExporting(true);
      setExportMessage("Exporting scans...");

      // Trigger CSV download by opening URL in new tab
      window.open(`${API_BASE_URL}/logs/export-csv`, "_blank");

      setExportMessage("CSV export started in new tab");
    } catch (error) {
      console.error("Error exporting scans:", error);
      setExportMessage("Error exporting scans");
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportMessage(""), 3000);
    }
  };

  // Save scans locally on the server
  const saveScansLocally = async () => {
    try {
      setIsExporting(true);
      setExportMessage("Saving scans...");

      const response = await fetch(`${API_BASE_URL}/logs/save-local`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        mode: "cors",
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      setExportMessage(`Saved ${data.message}`);
    } catch (error) {
      console.error("Error saving scans:", error);
      setExportMessage("Error saving scans locally");
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportMessage(""), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-lg font-bold">Simple Scanner</h1>
        <div className="flex items-center space-x-2">
          <span
            className={`h-3 w-3 rounded-full ${isActive ? "bg-green-500" : "bg-gray-300"}`}
          ></span>
          <span className="text-sm">{isActive ? "Active" : "Inactive"}</span>
        </div>
      </header>

      {/* Context info */}
      <div className="p-4 bg-white shadow-sm mt-2 mx-2 rounded-lg">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-sm text-gray-500">Scans</h2>
            <p className="font-medium text-center">{scanCount}</p>
          </div>
          <div>
            <h2 className="text-sm text-gray-500">Storage</h2>
            <p className="font-medium text-center">{localScanCount}</p>
          </div>
        </div>
      </div>

      {/* Export buttons (always visible) */}
      <div className="mt-2 p-2 bg-white shadow-sm mx-2 rounded-lg">
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={exportScansCSV}
            disabled={isExporting || localScanCount === 0}
            className="text-xs flex items-center"
          >
            <Download className="w-3 h-3 mr-1" />
            Export CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={saveScansLocally}
            disabled={isExporting || localScanCount === 0}
            className="text-xs flex items-center"
          >
            <Save className="w-3 h-3 mr-1" />
            Save to Server
          </Button>
        </div>

        {exportMessage && (
          <p className="text-xs text-center mt-2 text-blue-600">
            {exportMessage}
          </p>
        )}
      </div>

      {/* Scan activation area */}
      <div className="mt-4 p-4">
        {isActive ? (
          <div className="text-center">
            <p className="mb-2 text-gray-600">Scanner activated</p>
            <div className="flex justify-center space-x-4">
              <Button
                className="bg-green-500 hover:bg-green-600"
                onClick={handleComplete}
                disabled={isSubmitting}
              >
                <Check className="w-4 h-4 mr-2" />
                Complete
              </Button>
              <Button
                variant="outline"
                onClick={simulateScan}
                disabled={isSubmitting}
              >
                <FileText className="w-4 h-4 mr-2" />
                Test Scan
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <Button
              className="bg-blue-500 hover:bg-blue-600"
              onClick={toggleScanner}
            >
              Activate Scanner
            </Button>
          </div>
        )}

        {/* Hidden input for barcode scanner */}
        <input
          ref={inputRef}
          type="text"
          className="opacity-0 absolute pointer-events-none"
          onChange={handleInputChange}
          autoFocus={isActive}
          aria-label="Barcode Scanner Input"
        />
      </div>

      {/* Simple modal for scan report */}
      {showReport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden">
            <div className="p-4 bg-green-500 text-white flex justify-between items-center">
              <h2 className="text-lg font-bold">Scan Complete</h2>
              <button
                onClick={closeReport}
                className="p-1 rounded-full hover:bg-white/20"
                aria-label="Close report"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <p>Total scans: {scanCount}</p>
              <p>Stored in server memory: {localScanCount}</p>

              <div className="mt-4 flex justify-between">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={exportScansCSV}
                  disabled={isExporting || localScanCount === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={saveScansLocally}
                  disabled={isExporting || localScanCount === 0}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save to Server
                </Button>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeReport}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScanViewSimple;
