// App.tsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("stats");
  const [scannerActive, setScannerActive] = useState(false);
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

  // Check if we're in the inventory route
  const isInventoryView = location.pathname === "/inventory";

  // Update activeTab based on current route when component mounts
  useEffect(() => {
    if (location.pathname === "/scan") {
      setActiveTab("scan");
    } else if (location.pathname === "/inventory") {
      setActiveTab("inventory");
    }
  }, [location.pathname]);

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

  // // Toggle scanner function
  // const toggleScanner = () => {
  //   setScannerActive(!scannerActive);
  //   navigate("/scan");
  // };

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

  // Handle tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);

    // Navigate based on tab
    if (tab === "inventory") {
      navigate("/inventory");
    } else if (tab === "scan") {
      navigate("/scan");
    } else if (isInventoryView || location.pathname === "/scan") {
      // If we're on a specific view and switching to a different tab,
      // go back to the home page
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Main content - renders different sections based on activeTab */}
      <div className="flex-1 pb-24">
        {/* Content varies based on active tab */}
        {/* ... existing content ... */}
        <h3 className="text-center text-2xl font-bold text-white">Logout</h3>
      </div>

      {/* Toast notification for feedback */}
      {toast.visible && (
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, visible: false })}
        />
      )}
    </div>
  );
};

export default Index;
