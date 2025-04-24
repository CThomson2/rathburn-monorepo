// App.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Scan,
  User,
  BarChart,
  Settings,
  ChevronDown,
  ChevronUp,
  Calendar,
  Users,
  MapPin,
  Play,
  Package,
  Beaker,
} from "lucide-react";
import BottomNavBar from "@/components/layout/BottomNavBar";
import JobCard, { JobStatus } from "@/components/inventory/JobCard";
import SearchBar from "@/components/inventory/SearchBar";
import MaterialDetail from "@/components/inventory/MaterialDetail";
import Toast from "@/components/ui/toast-notification";
// database
import { supabase } from "@/lib/supabase/client-auth";
import { logout } from "@/services/auth";

// Status colors for different job types
const statusColors = {
  transport: {
    pending: "#03045e",
    inProgress: "#0077B6",
  },
  production: {
    pending: "#82E3FC",
    inProgress: "#00b4d8",
  },
  goodsInwards: {
    pending: "#ffd166",
    inProgress: "#ef8354",
    arriving: "#06d6a0",
  },
  shared: {
    completed: "#358600",
  },
};

// Sample data
const sampleJobs = [
  {
    id: "1",
    title: "Ethyl Acetate",
    supplier: "Sigma Aldrich",
    status: "preparation" as JobStatus,
    progress: 25,
    quantity: 5,
    scheduledDate: "Apr 25, 2025",
    priority: "high" as const,
  },
  {
    id: "2",
    title: "Methanol USP",
    supplier: "Fisher Scientific",
    status: "distillation" as JobStatus,
    progress: 60,
    quantity: 12,
    scheduledDate: "Apr 28, 2025",
    priority: "medium" as const,
  },
  {
    id: "3",
    title: "Acetone",
    supplier: "VWR International",
    status: "qcPending" as JobStatus,
    progress: 85,
    quantity: 8,
    scheduledDate: "Apr 30, 2025",
    priority: "low" as const,
  },
  {
    id: "4",
    title: "Toluene",
    supplier: "Merck",
    status: "complete" as JobStatus,
    progress: 100,
    quantity: 3,
    scheduledDate: "Apr 22, 2025",
    priority: "medium" as const,
  },
];

// Using the Material interface from SearchBar.tsx
interface Material {
  id: string;
  name: string;
  casNumber: string;
  color: string;
  scans: number;
}

const sampleMaterials: Material[] = [
  {
    id: "m1",
    name: "Ethyl Acetate",
    casNumber: "141-78-6",
    color: "#1EAEDB",
    scans: 7,
  },
  {
    id: "m2",
    name: "Methanol",
    casNumber: "67-56-1",
    color: "#FEC6A1",
    scans: 12,
  },
  {
    id: "m3",
    name: "Acetone",
    casNumber: "67-64-1",
    color: "#F2FCE2",
    scans: 5,
  },
  {
    id: "m4",
    name: "Toluene",
    casNumber: "108-88-3",
    color: "#8E9196",
    scans: 3,
  },
  {
    id: "m5",
    name: "Hexane",
    casNumber: "110-54-3",
    color: "#1EAEDB",
    scans: 2,
  },
];

// Interface for production job data
interface ProductionJob {
  id: number;
  name: string;
  manufacturer: string;
  containers: number;
  containerType: string;
  progress: number;
  color: string;
  expanded: boolean;
  dateCreated: string;
  dateScheduled: string;
  assignedWorkers: string[];
  drumIds: string[];
  still: string;
  location: string | string[];
}

// Interface for goods inwards job data
interface GoodsInwardsJob {
  id: number;
  name: string;
  supplier: string;
  containers: number;
  containerType: string;
  progress: number;
  color: string;
  expanded: boolean;
  dateOrdered: string;
  etaDate: string;
  status: "pending" | "inProgress" | "arriving" | "completed";
  purchaseOrderNumber: string;
  deliveryLocation: string;
  receivedDrumIds: string[];
}

interface ViewGoodsInwards {
  order_date: string | null;
  eta_date: string | null;
  item: string | null;
  po_number: string | null;
  quantity: number | null;
  status: string | null;
  supplier: string | null;
}

/**
 * The Index component is the main entry point of the application, managing
 * the active tab state and rendering the appropriate view based on the selected tab.
 *
 * - It provides a barcode scanning functionality through the BarcodeScannerInput component,
 *   where the scanned barcode is processed by the handleBarcodeScan function.
 * - The component includes a tab navigation system allowing the user to switch
 *   between different views: Scan, History, and Inventory.
 *
 * Note: The HistoryView and InventoryView components are currently commented out,
 * indicating they may be under development or not needed for the current release.
 */

const Index = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("stats");
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(
    null
  );
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({
    visible: false,
    message: "",
    type: "info",
  });

  // Production jobs data
  const [productionJobs, setProductionJobs] = useState<ProductionJob[]>([
    {
      id: 1,
      name: "Ethyl Acetate",
      manufacturer: "Sigma Aldrich",
      containers: 5,
      containerType: "Drums",
      progress: 40,
      color: statusColors.production.inProgress,
      expanded: false,
      dateCreated: "2025-04-21",
      dateScheduled: "2025-04-24",
      assignedWorkers: ["Michael Chen", "Sarah Johnson"],
      drumIds: ["15001", "15002", "15003", "15004", "15005"],
      still: "Still B",
      location: "Old Site",
    },
    {
      id: 2,
      name: "Methanol USP",
      manufacturer: "Fisher Scientific",
      containers: 12,
      containerType: "Drums",
      progress: 75,
      color: statusColors.production.inProgress,
      expanded: false,
      dateCreated: "2025-04-20",
      dateScheduled: "2025-04-23",
      assignedWorkers: ["David Miller", "Amanda Lopez"],
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
    },
  ]);

  // Goods inwards jobs data
  const [goodsInwardsJobs, setGoodsInwardsJobs] = useState<GoodsInwardsJob[]>([
    {
      id: 101,
      name: "Acetone",
      supplier: "VWR International",
      containers: 24,
      containerType: "Drums",
      progress: 12,
      color: statusColors.goodsInwards.inProgress,
      expanded: false,
      dateOrdered: "2025-04-19",
      etaDate: "2025-04-25",
      status: "inProgress",
      purchaseOrderNumber: "PO-2025-0423",
      deliveryLocation: "New Site",
      receivedDrumIds: ["12453", "12454", "12455"],
    },
    {
      id: 102,
      name: "Toluene",
      supplier: "Merck",
      containers: 18,
      containerType: "Drums",
      progress: 0,
      color: statusColors.goodsInwards.pending,
      expanded: false,
      dateOrdered: "2025-04-22",
      etaDate: "2025-05-03",
      status: "pending",
      purchaseOrderNumber: "PO-2025-0427",
      deliveryLocation: "Old Site",
      receivedDrumIds: [],
    },
    {
      id: 103,
      name: "Hexane",
      supplier: "Alfa Aesar",
      containers: 8,
      containerType: "Drums",
      progress: 100,
      color: statusColors.shared.completed,
      expanded: false,
      dateOrdered: "2025-04-10",
      etaDate: "2025-04-18",
      status: "completed",
      purchaseOrderNumber: "PO-2025-0412",
      deliveryLocation: "New Site",
      receivedDrumIds: [
        "17701",
        "17702",
        "17703",
        "17704",
        "17705",
        "17706",
        "17707",
        "17708",
      ],
    },
  ]);

  const toggleScanner = () => {
    navigate("/scan");
  };

  const handleLogout = async () => {
    try {
      const result = await logout();
      if (result.success) {
        navigate("/sign-in");
      } else {
        showToast(result.message || "Failed to logout", "error");
      }
    } catch (error) {
      console.error("Logout error:", error);
      showToast("An error occurred during logout", "error");
    }
  };

  const handleBarcodeScan = (barcode: string) => {
    console.log("Barcode scanned:", barcode);
    // Process the barcode data here
    // This could include API calls to Supabase
  };

  const showToast = (message: string, type: "success" | "error" | "info") => {
    setToast({
      visible: true,
      message,
      type,
    });
  };

  /**
   * Handle the selection of a material from the MaterialList.
   *
   * @param {Material} material The selected material
   */
  const handleSelectMaterial = (material: Material) => {
    setSelectedMaterial(material);
  };

  // Start scanning for a job
  const startJobScan = (
    jobType: "production" | "goodsInwards",
    jobId: number
  ) => {
    // Here you could store the job information in localStorage or state
    // before navigating to the scan view
    localStorage.setItem("currentScanJobType", jobType);
    localStorage.setItem("currentScanJobId", jobId.toString());

    // Navigate to scan view
    navigate("/scan");
  };

  // Toggle expand function for production jobs
  const toggleExpandProduction = (id: number) => {
    setProductionJobs((jobs) =>
      jobs.map((job) =>
        job.id === id ? { ...job, expanded: !job.expanded } : job
      )
    );
  };

  // Toggle expand function for goods inwards jobs
  const toggleExpandGoodsInwards = (id: number) => {
    setGoodsInwardsJobs((jobs) =>
      jobs.map((job) =>
        job.id === id ? { ...job, expanded: !job.expanded } : job
      )
    );
  };

  // Function to render drum ID chips
  const renderDrumChips = (drums: string[]) => {
    const displayDrums = drums.slice(0, 8);
    return (
      <div className="grid grid-cols-4 gap-2">
        {displayDrums.map((drum, index) => (
          <div
            key={index}
            className="bg-gray-100 text-gray-700 text-sm py-1 px-2 rounded text-center"
          >
            {drum}
          </div>
        ))}
        {drums.length > 8 && (
          <div className="bg-gray-200 text-gray-700 text-sm py-1 px-2 rounded text-center">
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
    <div className="h-screen w-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white py-4 px-6 shadow-md flex justify-between items-center">
        <h1 className="text-xl font-bold">Production & Inventory</h1>
        <button
          onClick={handleLogout}
          className="text-sm text-white hover:text-blue-200"
        >
          Logout
        </button>
      </div>

      {/* Toast notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={() => setToast({ ...toast, visible: false })}
      />

      {/* Main Content - Scrollable area */}
      <div className="flex-1 overflow-auto pb-20">
        {/* Production Jobs Section */}
        <div className="flex justify-between items-center px-6 py-4">
          <div className="flex items-center">
            <Beaker size={18} className="text-blue-600 mr-2" />
            <h2 className="text-lg font-bold text-gray-800">Production Jobs</h2>
          </div>
          <button className="text-blue-600 font-medium text-sm">
            View All
          </button>
        </div>

        {/* Production Jobs List */}
        <div className="px-4 space-y-3">
          {productionJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden"
              style={{ borderLeftWidth: "4px", borderLeftColor: job.color }}
            >
              <div className="p-4">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="font-bold text-gray-800">{job.name}</h3>
                    <p className="text-gray-500 text-sm">{job.manufacturer}</p>
                  </div>
                  <div className="bg-gray-100 px-3 py-1 rounded-full flex items-center space-x-1">
                    <span className="text-gray-700 text-sm">
                      {job.containerType} × {job.containers}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3 relative">
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${job.progress}%`,
                        backgroundColor: job.color,
                      }}
                    />
                  </div>
                </div>

                {/* Action Button Row */}
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => startJobScan("production", job.id)}
                    className="flex items-center space-x-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
                  >
                    <Play size={16} />
                    <span>Start</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-end px-4 py-2 border-t border-gray-100">
                <button
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                  onClick={() => toggleExpandProduction(job.id)}
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
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center">
                      <Calendar size={16} className="text-gray-500 mr-2" />
                      <div>
                        <p className="text-xs text-gray-500">Created</p>
                        <p className="text-sm">{job.dateCreated}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Calendar size={16} className="text-gray-500 mr-2" />
                      <div>
                        <p className="text-xs text-gray-500">Scheduled</p>
                        <p className="text-sm font-bold text-blue-700">
                          {job.dateScheduled}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center mb-2">
                      <Users size={16} className="text-gray-500 mr-2" />
                      <p className="text-xs text-gray-500">Assigned Workers</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {job.assignedWorkers.map((worker, index) => (
                        <div
                          key={index}
                          className="bg-blue-50 text-blue-700 text-sm py-1 px-3 rounded-full"
                        >
                          {worker}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">
                      Still Assignment
                    </p>
                    <div className="bg-indigo-50 text-indigo-700 inline-block text-sm py-1 px-3 rounded-md font-medium">
                      {job.still}
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center mb-2">
                      <MapPin size={16} className="text-gray-500 mr-2" />
                      <p className="text-xs text-gray-500">Location</p>
                    </div>
                    <p className="text-sm">{renderLocation(job.location)}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-2">Drum IDs</p>
                    {renderDrumChips(job.drumIds)}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Goods Inwards Section */}
        <div className="flex justify-between items-center px-6 py-4 mt-4">
          <div className="flex items-center">
            <Package size={18} className="text-amber-600 mr-2" />
            <h2 className="text-lg font-bold text-gray-800">Goods Inwards</h2>
          </div>
          <button className="text-blue-600 font-medium text-sm">
            View All
          </button>
        </div>

        {/* Goods Inwards Jobs List */}
        <div className="px-4 space-y-3">
          {goodsInwardsJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden"
              style={{ borderLeftWidth: "4px", borderLeftColor: job.color }}
            >
              <div className="p-4">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="font-bold text-gray-800">{job.name}</h3>
                    <p className="text-gray-500 text-sm">{job.supplier}</p>
                  </div>
                  <div className="bg-gray-100 px-3 py-1 rounded-full flex items-center space-x-1">
                    <span className="text-gray-700 text-sm">
                      {job.containerType} × {job.containers}
                    </span>
                  </div>
                </div>

                {/* Status Chip */}
                <div className="mt-2">
                  <span
                    className={`inline-block px-2 py-1 rounded-md text-xs ${
                      job.status === "pending"
                        ? "bg-amber-100 text-amber-800"
                        : job.status === "inProgress"
                          ? "bg-orange-100 text-orange-800"
                          : job.status === "arriving"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-green-100 text-green-800"
                    }`}
                  >
                    {job.status === "pending" && "Awaiting Delivery"}
                    {job.status === "inProgress" && "Partially Received"}
                    {job.status === "arriving" && "Arriving Today"}
                    {job.status === "completed" && "Fully Received"}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mt-2 relative">
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${job.progress}%`,
                        backgroundColor: job.color,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{job.receivedDrumIds.length} received</span>
                    <span>{job.containers} total</span>
                  </div>
                </div>

                {/* Action Button Row */}
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => startJobScan("goodsInwards", job.id)}
                    className="flex items-center space-x-1 bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
                    disabled={job.status === "completed"}
                  >
                    <Play size={16} />
                    <span>Start</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-end px-4 py-2 border-t border-gray-100">
                <button
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                  onClick={() => toggleExpandGoodsInwards(job.id)}
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
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center">
                      <Calendar size={16} className="text-gray-500 mr-2" />
                      <div>
                        <p className="text-xs text-gray-500">Date Ordered</p>
                        <p className="text-sm">{job.dateOrdered}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Calendar size={16} className="text-gray-500 mr-2" />
                      <div>
                        <p className="text-xs text-gray-500">ETA</p>
                        <p className="text-sm font-bold text-amber-700">
                          {job.etaDate}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Purchase Order</p>
                    <div className="bg-amber-50 text-amber-700 inline-block text-sm py-1 px-3 rounded-md font-medium">
                      {job.purchaseOrderNumber}
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center mb-2">
                      <MapPin size={16} className="text-gray-500 mr-2" />
                      <p className="text-xs text-gray-500">Delivery Location</p>
                    </div>
                    <p className="text-sm">{job.deliveryLocation}</p>
                  </div>

                  {job.receivedDrumIds.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">
                        Received Drums
                      </p>
                      {renderDrumChips(job.receivedDrumIds)}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Quick Lookup */}
        <div className="px-6 py-4 mt-4">
          <h2 className="text-lg font-bold text-gray-800 mb-3">Quick Lookup</h2>
          <div className="relative">
            <input
              type="text"
              placeholder="Search raw materials..."
              className="w-full bg-white border border-gray-300 rounded-lg py-3 px-4 pl-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg rounded-t-lg">
        <div className="flex items-center justify-around relative">
          <button
            className={`flex flex-col items-center justify-center py-3 px-5 ${activeTab === "stats" ? "text-blue-600" : "text-gray-600"}`}
            onClick={() => setActiveTab("stats")}
          >
            <BarChart size={24} />
            <span className="text-xs mt-1">Stats</span>
          </button>

          <button
            className={`flex flex-col items-center justify-center py-3 px-5 ${activeTab === "team" ? "text-blue-600" : "text-gray-600"}`}
            onClick={() => setActiveTab("team")}
          >
            <User size={24} />
            <span className="text-xs mt-1">Team</span>
          </button>

          {/* Centered Scan Button */}
          <div className="relative">
            <button
              className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg"
              onClick={toggleScanner}
              aria-label="Scan"
            >
              <Scan size={28} />
            </button>
          </div>

          <button className="flex flex-col items-center justify-center py-3 px-5 text-gray-600 invisible">
            <span>Placeholder</span>
          </button>

          <button
            className={`flex flex-col items-center justify-center py-3 px-5 ${activeTab === "settings" ? "text-blue-600" : "text-gray-600"}`}
            onClick={() => setActiveTab("settings")}
          >
            <Settings size={24} />
            <span className="text-xs mt-1">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Index;
