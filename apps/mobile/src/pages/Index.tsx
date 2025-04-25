import { useState, useEffect, useRef, createContext } from "react";
import { useNavigate } from "react-router-dom";
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
  Search,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logout } from "@/services/auth";
import FloatingNavMenu from "@/components/layout/FloatingNavMenu";
import TopNavbar from "@/components/navbar/top-navbar";
import { TransportView } from "@/components/views/TransportView";
import { ProductionView } from "@/components/views/ProductionView";
import { SettingsView } from "@/components/views/SettingsView";
import { motion, AnimatePresence } from "framer-motion";
// import { IntegratedNav } from "@/components/navbar/integrated-nav";
// import { BottomTabBar } from "@/components/navbar/bottom-tab-bar";
// import { CombinedNavigation } from "@/components/layout/combined-navigation";

// Create a context for sharing the scanned drums state
export interface ScanContextType {
  scannedDrums: string[];
  handleDrumScan: (scannedValue: string) => void;
  resetScannedDrums: () => void;
}

export const ScanContext = createContext<ScanContextType>({
  scannedDrums: [],
  handleDrumScan: () => {},
  resetScannedDrums: () => {},
});

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
 * Uses view-switching navigation rather than route changes
 */
const Index = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("Transport");
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scannedDrums, setScannedDrums] = useState<string[]>([]);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [lastScannedValue, setLastScannedValue] = useState("");
  const [showScanFeedback, setShowScanFeedback] = useState(false);
  const searchTimeoutRef = useRef<number | null>(null);
  const scanFeedbackTimeoutRef = useRef<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Handle barcode scan input
  const handleBarcodeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log("Barcode input changed:", value);

    setBarcodeInput(value);
    setLastScannedValue(value);
    setShowScanFeedback(true);

    // Clear previous timeout if exists
    if (scanFeedbackTimeoutRef.current) {
      window.clearTimeout(scanFeedbackTimeoutRef.current);
    }

    // Set timeout to hide the feedback after 3 seconds
    scanFeedbackTimeoutRef.current = window.setTimeout(() => {
      setShowScanFeedback(false);
    }, 3000);

    // Process the scan when input contains a complete barcode
    // This is a simple implementation that processes on every change
    // Real implementation might want to detect a complete scan (e.g., by enter key)
    processBarcodeScan(value);
  };

  // Handle keydown events for the barcode input
  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    console.log("Barcode key pressed:", e.key, "Current value:", barcodeInput);

    // If Enter key is pressed, process the current input
    if (e.key === "Enter") {
      console.log("Enter key pressed, processing scan:", barcodeInput);
      processBarcodeScan(barcodeInput);
    }
  };

  // Process the scanned barcode to find matching drum IDs
  const processBarcodeScan = (scannedValue: string) => {
    console.log("Processing barcode scan:", scannedValue);

    // For this demo, we'll process immediately on any input
    handleDrumScan(scannedValue);

    // Clear the input field after processing
    setTimeout(() => {
      console.log("Clearing input field");
      setBarcodeInput("");
      // Re-focus the input for the next scan
      barcodeInputRef.current?.focus();
    }, 100);
  };

  // Check if scanned value contains any of the drum IDs and update state
  const handleDrumScan = (scannedValue: string) => {
    console.log("Handling drum scan for value:", scannedValue);

    // All potential drum IDs to check against
    const pentaneDrumIds = ["17583", "17584", "17585", "17586", "17587"];
    const aceticAcidDrumIds = [
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
    ];

    // Check if the scanned value contains any drum IDs
    const allDrumIds = [...pentaneDrumIds, ...aceticAcidDrumIds];
    console.log("Checking against all drum IDs:", allDrumIds);

    const foundDrumId = allDrumIds.find((drumId) =>
      scannedValue.includes(drumId)
    );

    if (foundDrumId) {
      console.log(`Found matching drum ID: ${foundDrumId}`);

      if (scannedDrums.includes(foundDrumId)) {
        console.log(`Drum ID ${foundDrumId} already scanned, skipping`);
      } else {
        // Add the drum ID to the scanned list
        console.log(`Adding drum ID ${foundDrumId} to scanned list`);
        setScannedDrums((prev) => [...prev, foundDrumId]);
      }
    } else {
      console.log("No matching drum ID found in scanned value");
    }
  };

  // Auto-focus the barcode input when component mounts
  useEffect(() => {
    console.log("Mounting Index component, focusing barcode input");
    barcodeInputRef.current?.focus();

    // Handle clicks anywhere on the document to refocus the barcode input
    const handleDocumentClick = () => {
      console.log("Document clicked, refocusing barcode input");
      barcodeInputRef.current?.focus();
    };

    // Add event listener for clicks
    document.addEventListener("click", handleDocumentClick);

    // Clean up scan feedback timeout and event listener on unmount
    return () => {
      if (scanFeedbackTimeoutRef.current) {
        window.clearTimeout(scanFeedbackTimeoutRef.current);
      }
      document.removeEventListener("click", handleDocumentClick);
    };
  }, []);

  // Navigation handler for the floating menu
  const handleNavigation = (itemId: string) => {
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
      case "search":
        setIsSearchVisible(true);
        // Focus the search input after it's visible
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 100);
        startSearchTimeout();
        break;
      case "settings":
        setActiveView("Settings");
        break;
      default:
        navigate("/");
    }
  };

  const startSearchTimeout = () => {
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current);
    }

    // Set a new timeout to hide the search after 5 seconds if empty
    searchTimeoutRef.current = window.setTimeout(() => {
      if (!searchQuery) {
        setIsSearchVisible(false);
      }
    }, 5000);
  };

  // Reset the timeout when user types
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    // If there's text, clear the timeout (don't auto-hide)
    if (value) {
      if (searchTimeoutRef.current) {
        window.clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
    } else {
      // If field is emptied, start the timeout again
      startSearchTimeout();
    }
  };

  // Hide search when menu opens
  const handleMenuToggle = (isOpen: boolean) => {
    if (isOpen && isSearchVisible) {
      setIsSearchVisible(false);
    }
  };

  // Clear timeout on component unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        window.clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navLinks = [
    { name: "Transport", icon: Forklift },
    { name: "Production", icon: Atom },
    { name: "Settings", icon: Settings },
  ];

  const handleViewChange = (viewName: string) => {
    setActiveView(viewName);
  };

  // Animation variants for the view transitions
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  // Get the direction of the swipe based on the old and new view index
  const getDirection = (newView: string) => {
    const oldIndex = navLinks.findIndex((link) => link.name === activeView);
    const newIndex = navLinks.findIndex((link) => link.name === newView);
    return newIndex - oldIndex;
  };

  // Function to reset scanned drums
  const resetScannedDrums = () => {
    console.log("Resetting scanned drums");
    setScannedDrums([]);
  };

  // Reset scanned drums when component mounts (page reload)
  useEffect(() => {
    resetScannedDrums();
  }, []);

  const renderView = () => {
    const direction = getDirection(activeView);

    return (
      <AnimatePresence initial={false} mode="wait" custom={direction}>
        <motion.div
          key={activeView}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
          className="w-full h-[75%] overflow-auto pb-20"
        >
          <ScanContext.Provider
            value={{
              scannedDrums,
              handleDrumScan,
              resetScannedDrums,
            }}
          >
            {activeView === "Transport" && <TransportView />}
            {activeView === "Production" && <ProductionView />}
            {activeView === "Settings" && <SettingsView />}
          </ScanContext.Provider>
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className="h-screen w-full flex flex-col pt-10 bg-gray-50 dark:bg-gray-900 dark:text-gray-100">
      {/* Barcode input field - visible for testing */}
      <div className="fixed bottom-28 left-0 right-0 px-4 z-50 flex flex-col items-center gap-2">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-3 w-full max-w-md flex gap-2">
          <input
            ref={barcodeInputRef}
            type="text"
            value={barcodeInput}
            onChange={handleBarcodeInput}
            onKeyDown={handleBarcodeKeyDown}
            className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type or scan barcode here"
            autoFocus
            aria-label="Barcode Scanner Input"
          />
          <button
            onClick={() => processBarcodeScan(barcodeInput)}
            className="bg-blue-500 text-white px-4 py-2 rounded-md"
          >
            Scan
          </button>
        </div>
        <div className="text-sm text-center text-gray-500 dark:text-gray-400">
          Try typing "17583" or "16120" and press Enter or click Scan
        </div>
      </div>

      {/* Navigation Bar */}
      <TopNavbar
        navLinks={navLinks}
        activeView={activeView}
        onViewChange={handleViewChange}
      />

      {/* Main Content - View Container */}
      <div className="flex-1 overflow-hidden relative">
        {renderView()}

        {/* Scan Feedback Overlay */}
        <AnimatePresence>
          {showScanFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-20 left-0 right-0 flex justify-center z-50"
            >
              <div className="bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center max-w-md">
                <Zap size={20} className="mr-2 text-yellow-300" />
                <div>
                  <p className="font-medium">Scan Detected</p>
                  <p className="text-sm text-blue-100 truncate max-w-xs">
                    {lastScannedValue || "Empty scan"}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Overlay */}
        <AnimatePresence>
          {isSearchVisible && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="absolute top-0 left-0 right-0 p-4 z-50 bg-gray-800 bg-opacity-90"
            >
              <div className="relative flex items-center">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchInput}
                  placeholder="Search raw materials..."
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-3 px-4 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-gray-100 dark:placeholder-gray-400"
                />
                <button
                  className="absolute right-3 p-1 rounded-full bg-blue-500 text-white"
                  aria-label="Search"
                >
                  <Search size={18} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating navigation menu */}
      <FloatingNavMenu
        onNavigate={handleNavigation}
        onMenuToggle={handleMenuToggle}
      />
    </div>
  );
};

export default Index;
