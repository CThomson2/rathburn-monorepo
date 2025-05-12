import { createContext, useState, useEffect, ReactNode } from "react";

import { supabase } from "@/core/lib/supabase/client";
import { toast } from "@/core/components/ui/toaster";
import scanService from "@/features/scanner/services/handle-scan";

// // Define interfaces for the tables we're using (based on inventory schema)
// interface Drum {
//   drum_id: string; // uuid
//   batch_id: string; // uuid
//   serial_number: string;
//   current_volume: number;
//   status: string;
//   current_location: string | null;
//   created_at: string;
//   updated_at: string;
// }

// interface PurchaseOrderDrum {
//   pod_id: string; // uuid
//   pol_id: string; // uuid
//   serial_number: string;
//   is_received: boolean;
//   is_printed: boolean;
//   drum_id: string | null;
//   created_at: string;
// }

// interface PurchaseOrderLine {
//   pol_id: string; // uuid
//   po_id: string; // uuid
//   item_id: string; // uuid
//   quantity: number;
//   unit_weight: number | null;
//   cost: number | null;
// }

// interface PurchaseOrder {
//   po_id: string; // uuid
//   po_number: string;
//   supplier_id: string; // uuid
//   order_date: string;
//   status: string;
//   eta_date: string | null;
//   created_at: string;
//   updated_at: string;
// }

// interface Batch {
//   batch_id: string; // uuid
//   item_id: string; // uuid
//   batch_type: string;
//   total_volume: number;
//   created_at: string;
//   po_id?: string | null; // uuid
//   updated_at?: string | null;
// }

// // Define interfaces for our RPC function results
// interface PendingDrumResult {
//   pod_id: string;
//   pol_id: string;
//   serial_number: string;
// }

// interface DrumReceivedCheckResult {
//   drum_exists: boolean;
//   is_received: boolean;
// }

// interface OrderCompletionResult {
//   line_complete: boolean;
//   order_complete: boolean;
// }

// Create a context for sharing the scanned drums state
export interface ScanContextType {
  scannedDrums: string[];
  setScannedDrums: (drums: string[]) => void;
  handleDrumScan: (barcode: string) => void;
  resetScannedDrums: () => void;
  currentJobId: number | null;
  setCurrentJobId: (jobId: number | null) => void;
  scanMode: ScanMode;
  setScanMode: (mode: ScanMode) => void;
  // isProcessing: boolean; // Commented out as requested
  pendingDrums: number;
  processedDrums: number;
}

// Create context with default values
export const ScanContext = createContext<ScanContextType>({
  scannedDrums: [],
  setScannedDrums: () => {},
  handleDrumScan: () => {},
  resetScannedDrums: () => {},
  currentJobId: null,
  setCurrentJobId: () => {},
  scanMode: "single",
  setScanMode: () => {},
  // isProcessing: false, // Commented out as requested
  pendingDrums: 0,
  processedDrums: 0,
});

// Hook for easier context consumption
// export const useScan = () => useContext(ScanContext);

interface ScanProviderProps {
  children: ReactNode;
}

// Define ScanMode locally as these scanner modes
type ScanMode = "single" | "bulk";

/**
 * ScanProvider component that manages the state and handling of drum scans.
 *
 * It provides scanning functionality, including:
 * - Tracking of scanned drums.
 * - Managing the current job ID.
 * - Handling different scan modes.
 * - Fetching and updating drum status.
 * - Keeping track of processing status, pending, and processed drum counts.
 *
 * Wraps its children with the `ScanContext` to provide access to scan-related methods and state.
 *
 * @param {ScanProviderProps} props - The props for the ScanProvider component.
 * @param {ReactNode} props.children - The child components that will have access to scan context.
 */
export const ScanProvider = ({ children }: ScanProviderProps) => {
  const [scannedDrums, setScannedDrums] = useState<string[]>([]);
  const [currentJobId, setCurrentJobId] = useState<number | null>(null);
  const [scanMode, setScanMode] = useState<ScanMode>("single");
  // const [isProcessing, setIsProcessing] = useState(false); // Commented out as requested
  const [pendingDrums, setPendingDrums] = useState(0);
  const [processedDrums, setProcessedDrums] = useState(0);
  const [location, setLocation] = useState<"OS" | "NS" | null>(null);

  // Fetch pending drums count on mount
  useEffect(() => {
    const fetchPendingDrumCount = async () => {
      try {
        // Execute raw query to count purchase_order_drums where is_received is false
        const { data, error } = await supabase.rpc("count_pending_drums");

        if (error) {
          console.error("Error fetching pending drum count:", error);
          // Fallback to default count for now
          setPendingDrums(0);
          return;
        }

        if (data !== null && typeof data === "number") {
          setPendingDrums(data);
        }
      } catch (err) {
        console.error("Unexpected error fetching pending drum count:", err);
      }
    };

    fetchPendingDrumCount();
  }, []);

  const handleDrumScan = async (barcode: string) => {
    console.log("ScanContext: Handling drum scan for value:", barcode);

    // If already processing, log it but proceed with the API call.
    // The setIsProcessing state below prevents rapid UI updates.
    // if (isProcessing) { // Commented out as requested
    //   console.warn("ScanContext: New scan received while previous one is still processing.");
    //   // Optionally, you could queue scans here on the frontend if needed,
    //   // but for now, we'll let the backend handle potential concurrency.
    // } // Commented out as requested

    // setIsProcessing(true); // Commented out as requested

    // Show initial scanning toast
    toast.notify("Scanning...", `Processing drum: ${barcode}`, "info");

    try {
      // Get auth token for the scan service
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData.session?.access_token) {
        console.error("Error getting auth session:", sessionError);
        toast.notify(
          "Authentication Error",
          "Please sign in to scan drums",
          "error"
        );
        return;
      }

      // Process the scan using the scan service
      console.log(
        "[SCAN CONTEXT] Calling scan service with token:",
        sessionData.session.access_token.substring(0, 10) + "..."
      );

      const scanResult = await scanService.handleScan({
        barcode: barcode, // Using the already trimmed barcode
        jobId: currentJobId || 0,
        scan_mode: scanMode,
        deviceId: "mobile-app",
        authToken: sessionData.session.access_token,
      });

      if (scanResult.success) {
        console.log("ScanContext: Scan successful:", scanResult);

        // Update the pending/processed counts
        setPendingDrums((prev) => Math.max(prev - 1, 0));
        setProcessedDrums((prev) => prev + 1);

        // Add to the scanned list if not already present
        if (!scannedDrums.includes(barcode)) {
          console.log(`ScanContext: Adding drum ID ${barcode} to scanned list`);
          setScannedDrums((prev) => [...prev, barcode]);
        }

        // Show success toast with confirmation the database was updated
        toast.notify(
          "Drum Received ✅",
          scanResult.updatedInDb
            ? `Successfully received drum ${barcode} and updated database`
            : `Successfully received drum ${barcode}`,
          "success"
        );

        // Dispatch custom event for UI update
        window.dispatchEvent(
          new CustomEvent("scan:update", {
            detail: { drums: [...scannedDrums, barcode] },
          })
        );
      } else {
        console.error("ScanContext: Scan failed:", scanResult.error);

        // Show scan failure toast
        toast.notify(
          "Scan Failed ❌",
          `Error: ${scanResult.error || "Unknown error occurred"} (${barcode})`,
          "error"
        );
      }
    } catch (err) {
      console.error("Error during drum scan processing:", err);
      // Show unexpected error toast
      toast.notify(
        "Scan Error ❌",
        `${err instanceof Error ? err.message : "Failed to process scan"} (${barcode})`,
        "error"
      );
    } finally {
      // setIsProcessing(false); // Commented out as requested
    }
  };

  const resetScannedDrums = () => {
    console.log("ScanContext: Resetting scanned drums");
    setScannedDrums([]);
    setProcessedDrums(0);

    // Re-fetch the pending count to ensure it's accurate
    const fetchPendingDrumCount = async () => {
      try {
        // Execute raw query to count purchase_order_drums where is_received is false
        const { data, error } = await supabase.rpc("count_pending_drums");

        if (error) {
          console.error("Error fetching pending drum count:", error);
          return;
        }

        if (data !== null && typeof data === "number") {
          setPendingDrums(data);
        }
      } catch (err) {
        console.error("Unexpected error fetching pending drum count:", err);
      }
    };

    fetchPendingDrumCount();
  };

  return (
    <ScanContext.Provider
      value={{
        scannedDrums,
        setScannedDrums,
        handleDrumScan,
        resetScannedDrums,
        currentJobId,
        setCurrentJobId,
        scanMode,
        setScanMode,
        // isProcessing, // Commented out as requested
        pendingDrums,
        processedDrums,
      }}
    >
      {children}

      {/* The ScanHandler is now rendered at the root level for all authenticated content.
          We're removing this component since we're now using ScanInput at the app level instead */}

      {/* Show the scan tester in development mode for easier testing */}
    </ScanContext.Provider>
  );
};
