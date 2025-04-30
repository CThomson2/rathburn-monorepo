import {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import { ScanHandler } from "@/components/ScanHandler";
import { ScanTester } from "@/components/ScanTester";
import { ScanMode } from "@rathburn/types";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Database } from "@/types/supabase";

// Determine if we should show the scan tester (typically in development)
const SHOW_SCAN_TESTER =
  import.meta.env.DEV || import.meta.env.VITE_SHOW_SCAN_TESTER === "true";

// Define interfaces for the tables we're using (based on inventory schema)
interface Drum {
  drum_id: string; // uuid
  batch_id: string; // uuid
  serial_number: string;
  current_volume: number;
  status: string;
  current_location: string | null;
  created_at: string;
  updated_at: string;
}

interface PurchaseOrderDrum {
  pod_id: string; // uuid
  pol_id: string; // uuid
  serial_number: string;
  is_received: boolean;
  is_printed: boolean;
  drum_id: string | null;
  created_at: string;
}

interface PurchaseOrderLine {
  pol_id: string; // uuid
  po_id: string; // uuid
  item_id: string; // uuid
  quantity: number;
  unit_weight: number | null;
  cost: number | null;
}

interface PurchaseOrder {
  po_id: string; // uuid
  po_number: string;
  supplier_id: string; // uuid
  order_date: string;
  status: string;
  eta_date: string | null;
  created_at: string;
  updated_at: string;
}

interface Batch {
  batch_id: string; // uuid
  item_id: string; // uuid
  batch_type: string;
  total_volume: number;
  created_at: string;
  po_id?: string | null; // uuid
  updated_at?: string | null;
}

// Define interfaces for our RPC function results
interface PendingDrumResult {
  pod_id: string;
  pol_id: string;
  serial_number: string;
}

interface DrumReceivedCheckResult {
  exists: boolean;
  is_received: boolean;
}

interface OrderCompletionResult {
  line_complete: boolean;
  order_complete: boolean;
}

// Create a context for sharing the scanned drums state
interface ScanContextType {
  scannedDrums: string[];
  setScannedDrums: (drums: string[]) => void;
  handleDrumScan: (barcode: string) => void;
  resetScannedDrums: () => void;
  currentJobId: number | null;
  setCurrentJobId: (jobId: number | null) => void;
  scanMode: ScanMode;
  setScanMode: (mode: ScanMode) => void;
  isProcessing: boolean;
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
  isProcessing: false,
  pendingDrums: 0,
  processedDrums: 0,
});

// Hook for easier context consumption
export const useScan = () => useContext(ScanContext);

interface ScanProviderProps {
  children: ReactNode;
}

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingDrums, setPendingDrums] = useState(0);
  const [processedDrums, setProcessedDrums] = useState(0);

  // Fetch pending drums count on mount
  useEffect(() => {
    const fetchPendingDrumCount = async () => {
      try {
        const supabase = createClient();

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

  // Find and update a drum by barcode (serial number)
  const findAndUpdateDrum = async (barcode: string) => {
    console.log(`ScanContext: Searching for drum with barcode: ${barcode}`);

    try {
      const supabase = createClient();

      // Look up the drum by executing a raw query
      const { data: drumData, error: drumError } = await supabase.rpc(
        "find_pending_drum_by_serial",
        { p_serial_number: barcode }
      );

      if (drumError) {
        console.error("Error searching for drum:", drumError);
        toast({
          title: "Error Searching Drum",
          description: drumError.message,
          variant: "destructive",
        });
        return false;
      }

      if (!drumData || typeof drumData !== "object") {
        // Check if already received
        const { data: existingDrum, error: existingError } = await supabase.rpc(
          "check_drum_already_received",
          { p_serial_number: barcode }
        );

        if (
          !existingError &&
          existingDrum &&
          typeof existingDrum === "object" &&
          "is_received" in existingDrum &&
          existingDrum.is_received
        ) {
          toast({
            title: "Drum Already Received",
            description: `Drum with serial number ${barcode} has already been received`,
            variant: "default",
          });
        } else {
          toast({
            title: "Drum Not Found",
            description: `No pending drum found with serial number: ${barcode}`,
            variant: "destructive",
          });
        }
        return false;
      }

      console.log(`ScanContext: Found drum:`, drumData);
      // Type assertion to safely access properties
      const drumInfo = drumData as unknown as PendingDrumResult;
      const pod_id = drumInfo.pod_id;
      const pol_id = drumInfo.pol_id;

      // Update the drum status to received using raw query
      const { error: updateError } = await supabase.rpc(
        "mark_drum_as_received",
        { p_pod_id: pod_id }
      );

      if (updateError) {
        console.error("Error updating drum status:", updateError);
        toast({
          title: "Update Failed",
          description: updateError.message,
          variant: "destructive",
        });
        return false;
      }

      console.log(
        `ScanContext: Successfully marked drum ${barcode} as received`
      );

      // Update the local pending/processed counts
      setPendingDrums((prev) => Math.max(prev - 1, 0));
      setProcessedDrums((prev) => prev + 1);

      // Check if all drums in this order line are now received
      const { data: orderStatus, error: statusError } = await supabase.rpc(
        "check_purchase_order_completion",
        { p_pol_id: pol_id }
      );

      if (!statusError && orderStatus && typeof orderStatus === "object") {
        // Type assertion to safely access properties
        const statusInfo = orderStatus as unknown as OrderCompletionResult;
        if (statusInfo.line_complete) {
          console.log(
            `ScanContext: All drums for line ${pol_id} have been received`
          );

          if (statusInfo.order_complete) {
            console.log(
              `ScanContext: All drums for purchase order have been received`
            );
            toast({
              title: "Order Complete",
              description: `All drums for this purchase order have been received.`,
              variant: "default",
            });
          }
        }
      }

      toast({
        title: "Drum Received",
        description: `Successfully marked drum ${barcode} as received.`,
        variant: "default",
      });

      return true;
    } catch (err) {
      console.error("Unexpected error processing drum scan:", err);
      toast({
        title: "Error Processing Scan",
        description:
          err instanceof Error ? err.message : "Unknown error processing scan",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleDrumScan = async (barcode: string) => {
    console.log("ScanContext: Handling drum scan for value:", barcode);
    setIsProcessing(true);

    try {
      // Process the scanned barcode
      const result = await findAndUpdateDrum(barcode);

      // If found and updated in the database, add to the local scanned list
      if (result) {
        if (!scannedDrums.includes(barcode)) {
          console.log(`ScanContext: Adding drum ID ${barcode} to scanned list`);
          setScannedDrums((prev) => [...prev, barcode]);
        } else {
          console.log(
            `ScanContext: Drum ID ${barcode} already in local scanned list`
          );
        }
      }
    } catch (err) {
      console.error("Error during drum scan processing:", err);
      toast({
        title: "Scan Error",
        description:
          err instanceof Error ? err.message : "Failed to process scan",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetScannedDrums = () => {
    console.log("ScanContext: Resetting scanned drums");
    setScannedDrums([]);
    setProcessedDrums(0);

    // Re-fetch the pending count to ensure it's accurate
    const fetchPendingDrumCount = async () => {
      try {
        const supabase = createClient();

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
        isProcessing,
        pendingDrums,
        processedDrums,
      }}
    >
      {children}
      {/* The ScanHandler is now rendered at the root level for all authenticated content */}
      <ScanHandler
        jobId={currentJobId || 0}
        scan_mode={scanMode}
        onScanSuccess={handleDrumScan}
        onScanError={(barcode, error) => console.error("Scan error:", error)}
      />
      {/* Show the scan tester in development mode for easier testing */}
      {SHOW_SCAN_TESTER && <ScanTester />}
    </ScanContext.Provider>
  );
};
