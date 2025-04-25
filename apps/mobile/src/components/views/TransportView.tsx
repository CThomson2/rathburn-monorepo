import { useState, useEffect, useContext } from "react";
import {
  ChevronDown,
  ChevronUp,
  Calendar,
  Users,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ScanContext } from "@/pages/Index";

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

  useEffect(() => {
    // Use IIFE for async operation
    (async () => {
      try {
        const supabase = createClient();
        // Use simpler string approach with any type to bypass TypeScript checking
        // This will work at runtime even if TypeScript complains
        const { data, error } = (await supabase
          .from("ui.v_goods_in")
          .select("*")) as { data: GoodsInData[] | null; error: Error };

        if (error) {
          console.error("Error fetching goods inwards:", error);
        } else if (data) {
          console.log("Goods inwards data:", data);
          setGoodsInwards(data);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const toggleExpand = (id: number) => {
    setProductionJobs((jobs) =>
      jobs.map((job) =>
        job.id === id ? { ...job, expanded: !job.expanded } : job
      )
    );
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
          >
            <div className="p-4">
              <div className="flex justify-between items-start mb-1">
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-gray-100">
                    {job.name}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {job.manufacturer}
                  </p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full flex items-center space-x-1">
                  <span className="text-gray-700 dark:text-gray-300 text-sm">
                    {job.containerType} × {job.containers}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3 relative">
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

            <div className="flex justify-end px-4 py-2 border-t border-gray-100 dark:border-gray-700">
              <button
                className="text-gray-500 hover:text-gray-700 transition-colors"
                onClick={() => toggleExpand(job.id)}
                aria-label={
                  job.expanded ? "Collapse details" : "Expand details"
                }
              >
                {job.expanded ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </button>
            </div>

            {/* Expanded Details */}
            {job.expanded && (
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center">
                    <Calendar
                      size={16}
                      className="text-gray-500 dark:text-gray-400 mr-2"
                    />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Created
                      </p>
                      <p className="text-sm">{job.dateCreated}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Calendar
                      size={16}
                      className="text-gray-500 dark:text-gray-400 mr-2"
                    />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Scheduled
                      </p>
                      <p className="text-sm font-bold text-blue-700 dark:text-blue-400">
                        {job.dateScheduled}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <Users
                      size={16}
                      className="text-gray-500 dark:text-gray-400 mr-2"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Assigned Workers
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {job.assignedWorkers.map((worker, index) => (
                      <div
                        key={index}
                        className="bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm py-1 px-3 rounded-full"
                      >
                        {worker}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Still Assignment
                  </p>
                  <div className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 inline-block text-sm py-1 px-3 rounded-md font-medium">
                    {job.still}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <MapPin
                      size={16}
                      className="text-gray-500 dark:text-gray-400 mr-2"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Location
                    </p>
                  </div>
                  <p className="text-sm">{renderLocation(job.location)}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Drum IDs
                  </p>
                  {renderDrumChips(job.drumIds, job.processedDrums)}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

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
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4"
              >
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-100">
                      {item.item}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      {item.supplier}
                    </p>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                    <span className="text-gray-700 dark:text-gray-300 text-sm">
                      Qty: {item.quantity}
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-sm">
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
        <div className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
          Loading goods inwards data...
        </div>
      )}
    </div>
  );
}
