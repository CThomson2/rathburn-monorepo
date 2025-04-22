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

const ScanView = () => {
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [logs, setLogs] = useState<ScanLogItem[]>([]);
  const [showReport, setShowReport] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [contextLocation, setContextLocation] = useState<string | null>(null);
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

  const processScan = (barcode: string) => {
    // Increment counter
    setScanCount((prev) => prev + 1);

    // Add log
    addLog(barcode, `Scanned item: ${barcode}`, "success");

    // Update related job if this is a Methanol scan (mock data)
    if (scanCount < 10 && barcode.includes("METH")) {
      setRelatedJob((prev) => ({
        ...prev,
        scannedQuantity: prev.scannedQuantity + 1,
      }));
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
              >
                <Check className="w-4 h-4 mr-2" />
                Complete
              </Button>
              <Button variant="outline" onClick={simulateScan}>
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
