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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useScan } from "@/hooks/use-scan";
// import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

const statusColors = {
  transport: {
    pending: "#03045e",
    inProgress: "#0077B6",
  },
  production: {
    pending: "#82E3FC",
    inProgress: "#00b4d8",
  },
  shared: {
    completed: "#358600",
  },
};

// Define the interface for our purchase order data from the RPC function
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

// Define the interface for purchase order drums from the RPC function
interface PurchaseOrderDrumData {
  pod_id: string;
  pol_id: string;
  serial_number: string;
  is_received: boolean;
}

interface ProductionJob {
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

// Custom badge variants for our UI
const statusVariants = {
  complete: "default",
  "in-progress": "default",
  pending: "secondary",
} as const;

/**
 * Transport view that displays goods in transport
 * Extracted from the original Index component
 */
export function TransportView() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [jobDetail, setJobDetail] = useState<ProductionJob | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { scannedDrums, resetScannedDrums, scanMode, setScanMode } = useScan();

  // // Test data in case the RPC call fails
  // const testProductionJobs = [
  //   {
  //     id: "1",
  //     title: "PO-2024-001",
  //     supplier: "Supplier A",
  //     orderDate: "2024-06-01",
  //     progress: 60,
  //     status: "in-progress",
  //     etaDate: "2024-06-10",
  //     item: "Material X",
  //     quantity: 5,
  //     drums: [
  //       {
  //         pod_id: "d1",
  //         pol_id: "l1",
  //         serial_number: "DR-0001",
  //         is_received: true,
  //       },
  //       {
  //         pod_id: "d2",
  //         pol_id: "l1",
  //         serial_number: "DR-0002",
  //         is_received: true,
  //       },
  //       {
  //         pod_id: "d3",
  //         pol_id: "l1",
  //         serial_number: "DR-0003",
  //         is_received: true,
  //       },
  //       {
  //         pod_id: "d4",
  //         pol_id: "l1",
  //         serial_number: "DR-0004",
  //         is_received: false,
  //       },
  //       {
  //         pod_id: "d5",
  //         pol_id: "l1",
  //         serial_number: "DR-0005",
  //         is_received: false,
  //       },
  //     ],
  //   },
  //   {
  //     id: "2",
  //     title: "PO-2024-002",
  //     supplier: "Supplier B",
  //     orderDate: "2024-06-02",
  //     progress: 33,
  //     status: "pending",
  //     etaDate: "2024-06-15",
  //     item: "Material Y",
  //     quantity: 3,
  //     drums: [
  //       {
  //         pod_id: "d6",
  //         pol_id: "l2",
  //         serial_number: "DR-0006",
  //         is_received: true,
  //       },
  //       {
  //         pod_id: "d7",
  //         pol_id: "l2",
  //         serial_number: "DR-0007",
  //         is_received: false,
  //       },
  //       {
  //         pod_id: "d8",
  //         pol_id: "l2",
  //         serial_number: "DR-0008",
  //         is_received: false,
  //       },
  //     ],
  //   },
  // ];

  const [productionJobs, setProductionJobs] = useState<ProductionJob[]>([]);

  // Fetch production jobs data
  useEffect(() => {
    const fetchProductionJobs = async () => {
      try {
        setIsLoading(true);
        const supabase = createClient();

        // Calling the RPC function
        const { data: ordersData, error: ordersError } = (await supabase.rpc(
          "get_pending_purchase_orders"
        )) as { data: unknown; error: unknown };

        if (ordersError) {
          console.error("Error fetching purchase orders:", ordersError);
          // Fallback to test data
          setProductionJobs([]);
          return;
        }

        if (!ordersData) {
          setProductionJobs([]);
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
          (job): job is ProductionJob => job !== null
        );

        console.log("Fetched production jobs:", validJobs);
        setProductionJobs(validJobs);
      } catch (err) {
        console.error("Unexpected error fetching production jobs:", err);
        // Fallback to test data
        setProductionJobs([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductionJobs();
  }, [refreshTrigger]);

  // Update job progress based on scanned drums
  const updatedJobs = useMemo(() => {
    console.log("Recomputing job progress with scanned drums:", scannedDrums);

    return productionJobs.map((job) => {
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
  }, [productionJobs, scannedDrums]);

  // Function to reload page
  const handleRefresh = () => {
    window.location.reload();
    // resetScannedDrums();
    // setRefreshTrigger((prev) => prev + 1);
    // setJobDetail(null);
  };

  // Function to open job details
  const openJobDetail = (job: ProductionJob) => {
    setJobDetail(job);
    // Set the scan mode to bulk for receiving drums
    // We know from the type definition that ScanMode is 'single' | 'bulk'
    setScanMode("bulk");
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
    <div className="container py-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Goods In</h2>
        <Button variant="ghost" onClick={handleRefresh} disabled={isLoading}>
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <p>Loading...</p>
        </div>
      ) : updatedJobs.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            No pending purchase orders found
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {updatedJobs.map((job) => (
            <Card key={`job-${job.id}-${job.item}`} className="relative">
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <div>
                    <CardTitle>{job.title}</CardTitle>
                    <CardDescription>{job.supplier}</CardDescription>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        job.progress === 100
                          ? "default" // Use default variant for completed
                          : job.progress > 0
                            ? "default" // Use default variant for in-progress
                            : "secondary" // Use secondary variant for pending
                      }
                    >
                      {job.progress === 100
                        ? "Complete"
                        : job.progress > 0
                          ? "In Progress"
                          : "Pending"}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(job.orderDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{job.item}</span>
                    <span>
                      {job.drums.filter((d) => d.is_received).length} of{" "}
                      {job.drums.length} drums received
                    </span>
                  </div>
                  <Progress value={job.progress} className="h-2" />
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => openJobDetail(job)}
                >
                  <ScanBarcode className="h-4 w-4 mr-2" />
                  Scan Drums
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Job Detail Modal */}
      <AlertDialog
        open={!!jobDetail}
        onOpenChange={(open) => !open && closeJobDetail()}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {jobDetail?.title} - {jobDetail?.supplier}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {jobDetail?.item} - {jobDetail?.quantity} drums
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>
                  {jobDetail?.drums.filter((d) => d.is_received).length} of{" "}
                  {jobDetail?.drums.length} drums
                </span>
              </div>
              <Progress value={jobDetail?.progress} className="h-2" />
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Drums</h4>
              <div className="flex flex-wrap gap-2">
                {jobDetail?.drums.map((drum) => (
                  <Badge
                    key={`drum-${drum.pod_id}`}
                    variant={
                      drum.is_received ||
                      scannedDrums.includes(drum.serial_number)
                        ? "default" // Use default variant instead of success
                        : "outline"
                    }
                    className="text-xs"
                  >
                    {drum.serial_number}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Recently Scanned</h4>
              <div className="flex flex-wrap gap-2">
                {scannedDrums.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No drums scanned yet
                  </p>
                ) : (
                  scannedDrums.map((serial: string) => (
                    <Badge
                      key={`scanned-${serial}`}
                      variant="default"
                      className="text-xs"
                    >
                      {serial}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="default" onClick={handleRefresh}>
                Refresh Data
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
