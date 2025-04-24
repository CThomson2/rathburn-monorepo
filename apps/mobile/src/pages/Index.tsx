import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  //   Scan,
  //   User,
  //   BarChart,
  //   Settings,
  ChevronDown,
  ChevronUp,
  Calendar,
  Users,
  MapPin,
  Forklift,
  Atom,
  Settings,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logout } from "@/services/auth";
import FloatingNavMenu from "@/components/layout/FloatingNavMenu";
import TopNavbar from "@/components/layout/TopNavbar";

const statusColors = {
  transport: {
    pending: "#03045e",
    inProgress: "##0077B6",
  },
  production: {
    pending: "##82E3FC",
    inProgress: "#00b4d8",
  },
  shared: {
    completed: "#358600",
  },
};

/**
 * Inventory component that displays a list of production jobs with
 * expandable details. Each job includes information such as name,
 * manufacturer, container details, progress status, and assigned
 * workers. The component allows toggling of expanded views to
 * reveal additional job details like creation and scheduled dates,
 * assigned workers, still assignments, locations, and drum IDs.
 * It also includes a search input for raw materials and a bottom
 * navigation bar for quick access to stats, team, and settings.
 */
const Index = () => {
  const navigate = useNavigate();

  // Sample production jobs data
  const [productionJobs, setProductionJobs] = useState([
    {
      id: 1,
      name: "Pentane",
      manufacturer: "Caldic",
      containers: 2,
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
    },
    {
      id: 2,
      name: "Acetic Acid",
      manufacturer: "Univar",
      containers: 1,
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
    },
  ]);

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

  // Navigation handler for the floating menu
  const handleNavigation = (itemId: string) => {
    // Handle navigation based on the item ID
    switch (itemId) {
      case "stats":
        navigate("/");
        break;
      case "team":
        navigate("/team");
        break;
      case "scan":
        navigate("/scan");
        break;
      case "inventory":
        // Already on the inventory page, stay here
        break;
      case "settings":
        navigate("/settings");
        break;
      default:
        navigate("/");
    }
  };

  const toggleExpand = (id: number) => {
    setProductionJobs((jobs) =>
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

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navLinks = [
    { name: "Inventory", path: "/inventory", icon: Forklift },
    { name: "Production", path: "/production", icon: Atom },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50 dark:bg-gray-900 dark:text-gray-100">
      {/* Header */}
      {/* Logout button */}
      <button
        className="text-white font-medium hover:shadow-md"
        onClick={handleLogout}
      >
        Logout
      </button>

      {/* Main Content */}
      <div className="flex-1 overflow-auto pb-20">
        <TopNavbar navLinks={navLinks} />
        {/* Section Header */}
        <div className="flex justify-between items-center px-6 py-4">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
            Goods in Transport
          </h2>
          <button className="text-blue-600 font-medium">View All</button>
        </div>

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
                    />
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
                          className="bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm py-1 px-3 rounded-full"
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
                    <div className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 inline-block text-sm py-1 px-3 rounded-md font-medium">
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
                        <span className="text-gray-500">Ordered:</span>{" "}
                        {item.order_date}
                      </div>
                      <div>
                        <span className="text-gray-500">ETA:</span>{" "}
                        {item.eta_date}
                      </div>
                      <div className="ml-auto">
                        <span className="text-gray-500">Status:</span>{" "}
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
          <div className="px-6 py-4 text-center text-gray-500">
            Loading goods inwards data...
          </div>
        )}

        {/* Quick Lookup */}
        <div className="px-6 py-4 mt-4">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3">
            Quick Lookup
          </h2>
          <div className="relative">
            <input
              type="text"
              placeholder="Search raw materials..."
              className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg py-3 px-4 pl-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-gray-100 dark:placeholder-gray-400"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-400 dark:text-gray-500"
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

      {/* Replace bottom navigation with our floating nav menu */}
      <FloatingNavMenu onNavigate={handleNavigation} />
    </div>
  );
};

export default Index;
