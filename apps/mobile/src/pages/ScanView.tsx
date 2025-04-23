import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScanLog from "@/components/inventory/ScanLog";
import ScanReport from "@/components/inventory/ScanReport";
import { JobStatus } from "@/components/inventory/JobCard";

// Types
interface ScanLogItem {
  id: string;
  barcode: string;
  timestamp: Date;
  messageType: "success" | "error" | "info";
}

interface JobItem {
  id: string;
  title: string;
  supplier: string;
  status: JobStatus;
  progress: number;
  quantity: number;
  scannedQuantity: number;
  scheduledDate: string;
  priority: "low" | "medium" | "high";
}

// API config - will be different in dev vs production
const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://rathburn.app/api"
    : "http://localhost:3001/api";

/**
 * The ScanView component is a simplified version of the barcode scanner view.
 * It does not include job selection, quantity tracking, or any other features beyond
 * simply scanning barcodes and displaying the number of scans.
 *
 * This component is intended to be used as a starting point for building a custom
 * barcode scanner view.
 *
 * The component state is as follows:
 * - `isActive`: Whether the barcode scanner is currently active.
 * - `scanCount`: The number of scans that have been recorded.
 * - `logs`: An array of recent scan logs, with the most recent scan first.
 * - `showReport`: Whether to show the scan report overlay.
 * - `startTime`: The timestamp when the scanning started.
 * - `contextLocation`: The location context (e.g. "OS-N1").
 * - `relatedJob`: A sample production job that is updated by scans.
 * - `deviceId`: A unique identifier for the device.
 * - `isSubmitting`: Whether the component is currently submitting a scan to the API.
 *
 * The component has the following effects:
 * - When the component mounts, it generates or retrieves a device ID from localStorage.
 * - When the component is activated, it sets the context location and starts the timer.
 * - When the component is deactivated, it resets the context location, timer, and logs.
 * - When a scan is recorded, it increments the scan counter and logs the scan attempt.
 * - When a scan is successfully logged, it adds a success log and updates the related job if applicable.
 * - When a scan fails, it adds an error log.
 *
 * The component has the following event handlers:
 * - `toggleScanner`: Activates or deactivates the barcode scanner.
 * - `handleInputChange`: Processes a scan when the input field changes.
 * - `handleComplete`: Shows the scan report overlay when the "Complete" button is clicked.
 * - `simulateScan`: Simulates a barcode scan from hardware when the "Test Scan" button is clicked.
 * - `closeReport`: Closes the scan report overlay when the "Close" button is clicked.
 */
const ScanView = () => {
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [logs, setLogs] = useState<ScanLogItem[]>([]);
  const [showReport, setShowReport] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [contextLocation, setContextLocation] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sample production job that will be updated by scans
  const [relatedJob, setRelatedJob] = useState<JobItem>({
    id: "2",
    title: "Methanol USP",
    supplier: "Fisher Scientific",
    status: "distillation",
    progress: 60,
    quantity: 12,
    scannedQuantity: 0,
    scheduledDate: "Apr 28, 2025",
    priority: "medium",
  });

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

  // Handle initial scan for context
  useEffect(() => {
    if (isActive && !contextLocation) {
      // Simulate first scan setting the context
      setTimeout(() => {
        setContextLocation("OS-N1");
        setStartTime(new Date());
        addLog("QR-LOCATION-OSN1", "Context window opened for OS-N1", "info");
      }, 2000);
    }
  }, [isActive, contextLocation]);

  // Simulate barcode scanner input
  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive]);

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
    if (e.target.value && contextLocation) {
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
            context: contextLocation,
            timestamp: new Date().toISOString(),
            source: "mobile-app",
          },
        }),
        // Include credentials for auth cookies
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to log scan");
      }

      return data.scan;
    } catch (error) {
      console.error("Error logging scan:", error);
      addLog(
        barcode,
        `Error logging scan: ${error instanceof Error ? error.message : "Unknown error"}`,
        "error"
      );
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const processScan = async (barcode: string) => {
    // Increment counter
    setScanCount((prev) => prev + 1);

    // Log scan attempt
    addLog(barcode, `Processing scan: ${barcode}`, "info");

    // Send to API and get result
    const scanResult = await sendScanToAPI(barcode);

    if (scanResult) {
      // Add success log
      addLog(barcode, `Scan recorded successfully: ${barcode}`, "success");

      // Update related job if this is a Methanol scan (mock data)
      if (scanCount < 10 && barcode.includes("METH")) {
        setRelatedJob((prev) => ({
          ...prev,
          scannedQuantity: prev.scannedQuantity + 1,
        }));
      }
    }
  };

  const addLog = (
    barcode: string,
    message: string,
    type: "success" | "error" | "info"
  ) => {
    const newLog = {
      id: Date.now().toString(),
      barcode,
      timestamp: new Date(),
      messageType: type,
    };

    setLogs((prev) => [newLog, ...prev].slice(0, 50)); // Keep last 50 logs
  };

  const handleComplete = () => {
    setShowReport(true);
  };

  const closeReport = () => {
    setShowReport(false);
    setIsActive(false);
    setContextLocation(null);
    setScanCount(0);
    setLogs([]);
    setStartTime(null);
    setRelatedJob((prev) => ({
      ...prev,
      scannedQuantity: 0,
    }));
    navigate("/");
  };

  // Mock function to simulate barcode scan from hardware
  const simulateScan = () => {
    if (isActive && contextLocation) {
      const mockBarcodes = ["METH-123456", "METH-654321", "ACET-789012"];
      const randomBarcode =
        mockBarcodes[Math.floor(Math.random() * mockBarcodes.length)];
      processScan(randomBarcode);
    }
  };

  return (
    <div className="min-h-screen bg-lightBg pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-lg font-bold">Scanning Control Centre</h1>
        <div className="flex items-center space-x-2">
          <span
            className={`h-3 w-3 rounded-full ${isActive ? "bg-green-500 animate-pulse" : "bg-gray-300"}`}
          ></span>
          <span className="text-sm">{isActive ? "Active" : "Inactive"}</span>
        </div>
      </header>

      {/* Context info */}
      <div className="p-4 bg-white shadow-sm mt-2 mx-2 rounded-lg">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-sm text-gray-500">Context</h2>
            <p className="font-medium">
              {contextLocation || "No active context"}
            </p>
          </div>
          <div>
            <h2 className="text-sm text-gray-500">Scans</h2>
            <p className="font-medium text-center">{scanCount}</p>
          </div>
          <div>
            <h2 className="text-sm text-gray-500">Started</h2>
            <p className="font-medium">
              {startTime
                ? startTime.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "--:--"}
            </p>
          </div>
        </div>
      </div>

      {/* Scan activation area */}
      <div className="mt-4 p-4">
        {isActive ? (
          <div className="text-center">
            <p className="mb-2 text-gray-600">Barcode scanner activated</p>
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

      {/* Scan logs */}
      <div className="mt-4 px-4 pb-20">
        <h2 className="font-medium mb-2">Recent Scans</h2>
        <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-300px)]">
          <AnimatePresence initial={false}>
            {logs.map((log) => (
              <ScanLog key={log.id} log={log} />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Scan report overlay */}
      {showReport && (
        <ScanReport
          contextLocation={contextLocation || "Unknown"}
          scanCount={scanCount}
          startTime={startTime}
          endTime={new Date()}
          relatedJob={relatedJob}
          onClose={closeReport}
        />
      )}
    </div>
  );
};

export default ScanView;
