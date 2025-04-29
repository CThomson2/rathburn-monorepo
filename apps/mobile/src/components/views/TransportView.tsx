import { useState, useEffect, useContext } from "react";
import {
  ChevronDown,
  ChevronUp,
  Calendar,
  Users,
  MapPin,
  RefreshCw,
  X,
} from "lucide-react";
import { ScanContext } from "@/contexts/scan-context";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

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

/**
 * Transport view that displays goods in transport
 * Extracted from the original Index component
 */
export function TransportView() {
  // Get the scanned drums from context
  const { scannedDrums, resetScannedDrums } = useContext(ScanContext);
  // State for the selected job to display in modal
  const [selectedJob, setSelectedJob] = useState<number | null>(null);

  // Sample production jobs data with properly typed processedDrums
  const [productionJobs, setProductionJobs] = useState([
    {
      id: 1,
      name: "Pentane",
      manufacturer: "Caldic",
      containers: 5,
      containerType: "Drums",
      progress: 0,
      color: statusColors.transport.pending,
      expanded: false,
      dateCreated: "2025-03-31",
      dateScheduled: "2025-04-24",
      assignedWorkers: ["James Doherty"],
      drumIds: ["17583", "17584", "17585", "17586", "17587"],
      still: "Still B",
      location: "Old Site",
      processedDrums: [] as string[],
    },
    {
      id: 2,
      name: "Acetic Acid",
      manufacturer: "Univar",
      containers: 12,
      containerType: "Drums",
      progress: 0,
      color: statusColors.transport.pending,
      expanded: false,
      dateCreated: "2025-04-20",
      dateScheduled: "2025-04-23",
      assignedWorkers: ["Alistair Nottman"],
      drumIds: [
        "16120",
        "16121",
        "16122",
        "16123",
        "16124",
        "16125",
        "16126",
        "16127",
        "16128",
        "16129",
        "16130",
        "16131",
      ],
      still: "Still G",
      location: "New Site",
      processedDrums: [] as string[],
    },
  ]);

  // Add debug info to track state changes
  useEffect(() => {
    console.log("Current production jobs state:", productionJobs);
  }, [productionJobs]);

  // Update progress when scannedDrums changes
  useEffect(() => {
    if (scannedDrums.length === 0) {
      // Reset all progress if scannedDrums is empty
      setProductionJobs((prev) =>
        prev.map((job) => ({
          ...job,
          progress: 0,
          color: statusColors.transport.pending,
          processedDrums: [],
        }))
      );
      return;
    }

    console.log("TransportView: scannedDrums changed:", scannedDrums);

    // Create a fresh copy of the production jobs array to ensure state update
    const updatedJobs = [...productionJobs];
    let hasChanges = false;

    // Map over jobs and update them
    const newJobs = updatedJobs.map((job) => {
      // Get list of drums that are in scannedDrums but not yet in processedDrums
      const newScannedDrums = scannedDrums.filter(
        (drumId) =>
          job.drumIds.includes(drumId) && !job.processedDrums.includes(drumId)
      );

      // If no new scans for this job, leave it unchanged
      if (newScannedDrums.length === 0) {
        return job;
      }

      // Mark that we have changes to apply
      hasChanges = true;
      console.log(
        `TransportView: Job ${job.id} (${job.name}) - found ${newScannedDrums.length} newly scanned drums:`,
        newScannedDrums
      );

      // Calculate new processed drums
      const processedDrums = [...job.processedDrums, ...newScannedDrums];

      // Calculate progress percentage based on containers
      const progressPercentage = Math.min(
        100,
        Math.round((processedDrums.length / job.containers) * 100)
      );

      console.log(
        `TransportView: Job ${job.id} - progress updated from ${job.progress}% to ${progressPercentage}%`
      );

      // Determine color based on progress
      let color = job.color;
      if (progressPercentage === 100) {
        color = statusColors.shared.completed;
      } else if (progressPercentage > 0) {
        color = statusColors.transport.inProgress;
      }

      // Return updated job
      return {
        ...job,
        progress: progressPercentage,
        color,
        processedDrums,
      };
    });

    // Only update state if changes were made
    if (hasChanges) {
      console.log("TransportView: Updating state with new jobs:", newJobs);
      setProductionJobs(newJobs);
    }
  }, [scannedDrums]);

  // Define the type for goods inwards
  type GoodsInData = {
    eta_date: string | null;
    item: string | null;
    order_date: string | null;
    po_number: string | null;
    quantity: number | null;
    status: string | null;
    supplier: string | null;
  };

  const [goodsInwards, setGoodsInwards] = useState<GoodsInData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataFetchError, setDataFetchError] = useState<string | null>(null);

  // Fetch goods inwards data from Supabase
  useEffect(() => {
    console.log("[DATA] Fetching goods inwards data from Supabase...");
    setIsLoading(true);
    setDataFetchError(null);
    
    // Create a flag to avoid state updates after unmount
    let isMounted = true;
    
    // Use async function for data fetching
    const fetchData = async () => {
      try {
        const supabase = createClient();
        console.log("[DATA] Supabase client created, querying v_goods_in table...");
        
        // Query the v_goods_in view
        const { data, error } = await supabase
          .from("v_goods_in")
          .select("*")
          .order('eta_date', { ascending: true });

        // Check for errors
        if (error) {
          console.error("[DATA] Supabase query error:", error);
          
          if (isMounted) {
            setDataFetchError(`Error fetching data: ${error.message}`);
            
            // Fall back to mock data if we can't get real data
            console.log("[DATA] Using fallback mock data due to error");
            setGoodsInwards(generateMockGoodsInData());
          }
        } 
        // Check for no data
        else if (!data || data.length === 0) {
          console.log("[DATA] No goods inwards data returned, using mock data");
          
          if (isMounted) {
            setGoodsInwards(generateMockGoodsInData());
          }
        } 
        // Success case
        else {
          console.log(`[DATA] Successfully fetched ${data.length} goods inwards records:`, data);
          
          if (isMounted) {
            setGoodsInwards(data);
          }
        }
      } catch (err) {
        console.error("[DATA] Unexpected error during data fetch:", err);
        
        if (isMounted) {
          setDataFetchError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
          setGoodsInwards(generateMockGoodsInData());
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Execute the fetch
    fetchData();
    
    // Cleanup function
    return () => {
      console.log("[DATA] Cleaning up goods inwards data fetch");
      isMounted = false;
    };
  }, []);

  // Helper function to generate mock goods inwards data for fallback
  const generateMockGoodsInData = (): GoodsInData[] => {
    console.log("[DATA] Generating mock goods inwards data");
    return [
      {
        eta_date: "2025-04-25",
        item: "Methanol",
        order_date: "2025-04-10",
        po_number: "PO-2025-0042",
        quantity: 1000,
        status: "In Transit",
        supplier: "Fisher Scientific"
      },
      {
        eta_date: "2025-04-27",
        item: "Acetone",
        order_date: "2025-04-12",
        po_number: "PO-2025-0043",
        quantity: 500,
        status: "Processing",
        supplier: "Sigma Aldrich"
      },
      {
        eta_date: "2025-04-30",
        item: "Toluene",
        order_date: "2025-04-15",
        po_number: "PO-2025-0044",
        quantity: 200,
        status: "Shipped",
        supplier: "VWR Chemicals"
      }
    ];
  };

  // Open job details modal
  const openJobDetails = (id: number) => {
    setSelectedJob(id);
  };

  // Close job details modal
  const closeJobDetails = () => {
    setSelectedJob(null);
  };

  // Function to render drum ID chips
  const renderDrumChips = (drums: string[], processedDrums: string[]) => {
    const displayDrums = drums.slice(0, 8);
    return (
      <div className="grid grid-cols-4 gap-2">
        {displayDrums.map((drum, index) => (
          <div
            key={index}
            className={`${
              processedDrums.includes(drum)
                ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            } text-sm py-1 px-2 rounded text-center`}
          >
            {drum}
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
            <span key={index} className="flex items-center">
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
    <div className="w-full">
      {/* Section Header with Reset Button */}
      <div className="flex justify-between items-center px-6 py-4">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
          Goods in Transport
        </h2>
        <div className="flex gap-2">
          <button
            onClick={resetScannedDrums}
            className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1"
            title="Reset scanned drums"
          >
            <RefreshCw size={18} />
            <span className="text-sm">Reset</span>
          </button>
          <button className="text-blue-600 dark:text-blue-400 font-medium">
            View All
          </button>
        </div>
      </div>

      {/* Progress Indicator */}
      {scannedDrums.length > 0 && (
        <div className="px-6 mb-4">
          <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 p-2 rounded-md">
            <p className="text-sm font-medium">
              Scanned drums: {scannedDrums.length}
            </p>
          </div>
        </div>
      )}

      {/* Production Jobs List */}
      <div className="px-4 space-y-3">
        {productionJobs.map((job) => (
          <div
            key={job.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
            style={{ borderLeftWidth: "4px", borderLeftColor: job.color }}
            onClick={() => openJobDetails(job.id)}
          >
            <div className="p-3">
              <div className="flex justify-between items-start mb-1">
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-gray-100">
                    {job.name}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">
                    {job.manufacturer}
                  </p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full flex items-center space-x-1">
                  <span className="text-gray-700 dark:text-gray-300 text-xs">
                    {job.containerType} × {job.containers}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-2 relative">
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${job.progress}%`,
                      backgroundColor: job.color,
                    }}
                  ></div>
                </div>
                {/* Progress percentage indicator */}
                <div className="text-right mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {job.processedDrums.length}/{job.containers} ({job.progress}
                    %)
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Job Details Modal */}
      <AnimatePresence>
        {selectedJob !== null && (
          <>
            {/* Modal Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={closeJobDetails}
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed left-[10%] top-[10%] right-[10%] bottom-[10%] bg-white dark:bg-gray-800 z-50 rounded-xl shadow-xl overflow-auto"
            >
              {/* Modal Header with Close Button */}
              <div className="sticky top-0 flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {productionJobs.find((job) => job.id === selectedJob)?.name}
                </h2>
                <button
                  onClick={closeJobDetails}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                  aria-label="Close details"
                  title="Close details"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4">
                {productionJobs
                  .filter((job) => job.id === selectedJob)
                  .map((job) => (
                    <div key={job.id} className="space-y-4">
                      {/* Progress Info */}
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-750 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            Progress
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {job.processedDrums.length} of {job.containers}{" "}
                            drums scanned
                          </p>
                        </div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {job.progress}%
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-start">
                          <Calendar
                            size={18}
                            className="text-gray-500 dark:text-gray-400 mt-0.5 mr-2 shrink-0"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                              Created
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {job.dateCreated}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <Calendar
                            size={18}
                            className="text-blue-500 dark:text-blue-400 mt-0.5 mr-2 shrink-0"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                              Scheduled
                            </p>
                            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                              {job.dateScheduled}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Assigned Workers */}
                      <div>
                        <div className="flex items-center mb-2">
                          <Users
                            size={18}
                            className="text-gray-500 dark:text-gray-400 mr-2"
                          />
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            Assigned Workers
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 ml-7">
                          {job.assignedWorkers.map((worker, index) => (
                            <div
                              key={index}
                              className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm py-1 px-3 rounded-full"
                            >
                              {worker}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Still Assignment */}
                      <div className="flex items-start">
                        <div className="bg-indigo-100 dark:bg-indigo-900/20 p-1 rounded-md mr-2">
                          <div className="w-5 h-5 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <span className="text-sm font-bold">S</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            Still Assignment
                          </p>
                          <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                            {job.still}
                          </p>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="flex items-start">
                        <MapPin
                          size={18}
                          className="text-gray-500 dark:text-gray-400 mt-0.5 mr-2 shrink-0"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            Location
                          </p>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {renderLocation(job.location)}
                          </div>
                        </div>
                      </div>

                      {/* Drum IDs */}
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                          Drum IDs
                        </p>
                        {renderDrumChips(job.drumIds, job.processedDrums)}
                      </div>

                      {/* Container Info */}
                      <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-750 rounded-lg mt-4">
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            Container Type
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {job.containerType}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            Quantity
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
                            {job.containers}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Display Goods Inwards data if available */}
      {goodsInwards.length > 0 && (
        <div className="px-6 py-4 mt-4">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3">
            Goods Inwards
          </h2>
          <div className="space-y-3">
            {goodsInwards.map((item, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-3"
              >
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-100">
                      {item.item}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">
                      {item.supplier}
                    </p>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                    <span className="text-gray-700 dark:text-gray-300 text-xs">
                      Qty: {item.quantity}
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-xs">
                  <div className="flex gap-4">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Ordered:
                      </span>{" "}
                      {item.order_date}
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        ETA:
                      </span>{" "}
                      {item.eta_date}
                    </div>
                    <div className="ml-auto">
                      <span className="text-gray-500 dark:text-gray-400">
                        Status:
                      </span>{" "}
                      {item.status}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Display loading state */}
      {isLoading && (
        <div className="px-6 py-12 text-center">
          <div className="inline-block animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mb-2"></div>
          <p className="text-gray-500 dark:text-gray-400">
            Loading goods inwards data...
          </p>
        </div>
      )}

      {/* Display error state */}
      {dataFetchError && !isLoading && (
        <div className="px-6 py-4 mx-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-center">
          <p className="text-red-600 dark:text-red-400 mb-2">
            {dataFetchError}
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Using fallback data for display
          </p>
        </div>
      )}
    </div>
  );
}
