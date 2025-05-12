import { useState, useEffect, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Calendar,
  Users,
  MapPin,
  RefreshCw,
  X,
  ChevronRight,
  ScanBarcode,
  Truck,
  Package,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { createClient } from "@/core/lib/supabase/client";
import { useScan } from "@/core/hooks/use-scan";
// import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/core/components/ui/card";
import { Button } from "@/core/components/ui/button";
import { Progress } from "@/core/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/core/components/ui/alert-dialog";
import { Badge } from "@/core/components/ui/badge";
import { useToast } from "@/core/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { useSessionStore } from "@/core/stores/session-store";
import { TaskSelectionModal } from "@/features/scanner/components/task-selection-modal";
import { ScrollArea } from "@/core/components/ui/scroll-area";

/**
 * Define the interface for our purchase order data from the RPC function
 * `get_pending_purchase_orders`
 *
 * ```sql
 * BEGIN
 *     RETURN QUERY
 *     SELECT json_build_object(
 *         'po_id', po.po_id,
 *         'po_number', po.po_number,
 *         'supplier', s.name,
 *         'order_date', po.order_date,
 *         'status', po.status,
 *         'eta_date', po.eta_date,
 *         'item', i.name,
 *         'quantity', pol.quantity
 *     )
 *     FROM inventory.purchase_orders po
 *     JOIN inventory.suppliers s ON po.supplier_id = s.supplier_id
 *     JOIN inventory.purchase_order_lines pol ON po.po_id = pol.po_id
 *     JOIN inventory.items i ON pol.item_id = i.item_id
 *     WHERE po.status IN ('pending', 'partially_received')
 *     ORDER BY po.order_date DESC;
 * END;
 * ```
 */
interface PurchaseOrderData {
  po_id: string;
  po_number: string;
  supplier: string;
  order_date: string;
  status: string;
  eta_date: string | null;
  item: string;
  quantity: number;
}

/**
 * Define the interface for purchase order drums from the RPC function
 * `get_purchase_order_drums`
 *
 * ```sql
 * BEGIN
 *   RETURN QUERY
 *   SELECT json_build_object(
 *       'pod_id', pod.pod_id,
 *       'pol_id', pod.pol_id,
 *       'serial_number', pod.serial_number,
 *       'is_received', pod.is_received
 *   )
 *   FROM inventory.purchase_order_drums pod
 *     JOIN inventory.purchase_order_lines pol ON pod.pol_id = pol.pol_id
 *     WHERE pol.po_id = p_po_id
 *     ORDER BY pod.serial_number;
 * END;
 * ```
 */
interface PurchaseOrderDrumData {
  pod_id: string;
  pol_id: string;
  serial_number: string;
  is_received: boolean;
}

interface TransportJob {
  id: string; // po_id
  title: string; // po_number
  supplier: string;
  orderDate: string;
  progress: number;
  status: string;
  etaDate: string | null;
  item: string;
  quantity: number;
  drums: PurchaseOrderDrumData[];
}

/**
 * Transport view that displays goods in transport
 * Extracted from the original Index component
 */
export function TransportView() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [jobDetail, setJobDetail] = useState<TransportJob | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { scannedDrums, resetScannedDrums, scanMode, setScanMode } = useScan();
  const [transportJobs, setTransportJobs] = useState<TransportJob[]>([]);

  // Get session store state and actions
  const {
    currentSessionId,
    currentSessionTaskId,
    isScanning,
    startSession,
    endSession,
    processScan,
    availableTasks,
  } = useSessionStore();

  // Get the current task details
  const currentTask = availableTasks.find(
    (task) => task.id === currentSessionTaskId
  );

  // Fetch transport jobs data
  useEffect(() => {
    const fetchTransportJobs = async () => {
      try {
        setIsLoading(true);
        const supabase = createClient();

        // Calling the RPC function
        const { data: ordersData, error: ordersError } = (await supabase.rpc(
          "get_pending_purchase_orders"
        )) as { data: unknown; error: unknown };

        if (ordersError) {
          console.error("Error fetching purchase orders:", ordersError);
          setTransportJobs([]);
          return;
        }

        if (!ordersData) {
          setTransportJobs([]);
          return;
        }

        // Convert the data to our format and fetch drums for each PO
        const jobsPromises = (ordersData as Record<string, unknown>[]).map(
          async (po) => {
            // Fetch drums for this purchase order
            const { data: drumsData, error: drumsError } = (await supabase.rpc(
              "get_purchase_order_drums",
              { p_po_id: po.po_id as string }
            )) as { data: unknown; error: unknown };

            if (drumsError) {
              console.error(
                `Error fetching drums for PO ${po.po_id}:`,
                drumsError
              );
              return null;
            }

            const drums = ((drumsData as Record<string, unknown>[]) || []).map(
              (drum) => ({
                pod_id: (drum.pod_id as string) || "",
                pol_id: (drum.pol_id as string) || "",
                serial_number: (drum.serial_number as string) || "",
                is_received: !!drum.is_received,
              })
            );

            const receivedCount = drums.filter((d) => d.is_received).length;
            const progress =
              drums.length > 0 ? (receivedCount / drums.length) * 100 : 0;

            return {
              id: (po.po_id as string) || "",
              title: (po.po_number as string) || "",
              supplier: (po.supplier as string) || "",
              orderDate: (po.order_date as string) || "",
              progress: progress,
              status: (po.status as string) || "",
              etaDate: (po.eta_date as string) || null,
              item: (po.item as string) || "",
              quantity: typeof po.quantity === "number" ? po.quantity : 0,
              drums: drums,
            };
          }
        );

        const results = await Promise.all(jobsPromises);
        const validJobs = results.filter(
          (job): job is TransportJob => job !== null
        );

        console.log("Fetched transport jobs:", validJobs);
        setTransportJobs(validJobs);
      } catch (err) {
        console.error("Unexpected error fetching transport jobs:", err);
        setTransportJobs([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransportJobs();
  }, [refreshTrigger]);

  // Update job progress based on scanned drums
  const updatedJobs = useMemo(() => {
    console.log("Recomputing job progress with scanned drums:", scannedDrums);

    return transportJobs.map((job) => {
      // Count how many drums from this job are in the scanned list
      const updatedDrums = job.drums.map((drum) => {
        // If the drum is in our scannedDrums list, mark it as received
        if (scannedDrums.includes(drum.serial_number)) {
          return { ...drum, is_received: true };
        }
        return drum;
      });

      const receivedCount = updatedDrums.filter((d) => d.is_received).length;
      const progress =
        updatedDrums.length > 0
          ? (receivedCount / updatedDrums.length) * 100
          : 0;

      return {
        ...job,
        progress,
        drums: updatedDrums,
      };
    });
  }, [transportJobs, scannedDrums]);

  // Function to reload page
  const handleRefresh = () => {
    window.location.reload();
  };

  // Function to open job details
  const handleStartScanning = (job: TransportJob) => {
    if (isScanning) {
      // If already scanning, show the job details
      setJobDetail(job);
      setScanMode("bulk");
    } else {
      // If not scanning, start a new session
      startSession();
    }
  };

  // Function to close job details modal
  const closeJobDetail = () => {
    setJobDetail(null);
  };

  // Function to render drum ID chips
  const renderDrumChips = (
    drums: PurchaseOrderDrumData[],
    processedDrums: string[]
  ) => {
    const displayDrums = drums.slice(0, 8);
    return (
      <div className="grid grid-cols-4 gap-2">
        {displayDrums.map((drum) => (
          <div
            key={drum.pod_id}
            className={`${
              processedDrums.includes(drum.serial_number)
                ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            } text-sm py-1 px-2 rounded text-center`}
          >
            {drum.serial_number}
          </div>
        ))}
        {drums.length > 8 && (
          <div className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm py-1 px-2 rounded text-center">
            +{drums.length - 8} more
          </div>
        )}
      </div>
    );
  };

  // Function to display location
  const renderLocation = (location: string | string[]) => {
    if (Array.isArray(location)) {
      return (
        <div className="flex flex-col">
          {location.map((loc, index) => (
            <span
              key={`location-${loc}-${index}`}
              className="flex items-center"
            >
              <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
              {loc}
            </span>
          ))}
        </div>
      );
    }
    return location;
  };

  return (
    <div className="container max-w-lg mx-auto p-4 space-y-4">
      <TaskSelectionModal />

      {!isScanning ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <Truck className="h-12 w-12 text-muted-foreground" />
          <div className="text-center space-y-2">
            <h2 className="text-lg font-semibold">Start Transport Session</h2>
            <p className="text-sm text-muted-foreground">
              Select a purchase order to start receiving drums into stock.
            </p>
          </div>
          <Button onClick={startSession} className="w-full max-w-xs">
            Select Task
          </Button>
        </div>
      ) : currentTask ? (
        <div className="space-y-4">
          {/* Task Header */}
          <Card>
            <CardHeader className="p-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Truck className="h-5 w-5" />
                  <span>PO #{currentTask.poNumber}</span>
                </CardTitle>
                <Button variant="outline" size="sm" onClick={endSession}>
                  End Session
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Supplier:</span>
                  <span className="font-medium">{currentTask.supplier}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Item:</span>
                  <span className="font-medium">{currentTask.item}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress:</span>
                    <Badge
                      variant={
                        scannedDrums.length === currentTask.totalQuantity
                          ? "default"
                          : "secondary"
                      }
                    >
                      {scannedDrums.length} / {currentTask.totalQuantity} drums
                    </Badge>
                  </div>
                  <Progress
                    value={
                      (scannedDrums.length / currentTask.totalQuantity) * 100
                    }
                    className="h-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scanned Drums List */}
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-base flex items-center space-x-2">
                <ScanBarcode className="h-4 w-4" />
                <span>Scanned Drums</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[300px]">
                {scannedDrums.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-center p-4">
                    <Package className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No drums scanned yet. Start scanning barcodes to receive
                      drums.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {scannedDrums.map((serialNumber, index) => (
                      <div
                        key={serialNumber}
                        className="flex items-center justify-between p-4"
                      >
                        <div className="flex items-center space-x-3">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="font-mono">{serialNumber}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          #{index + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
