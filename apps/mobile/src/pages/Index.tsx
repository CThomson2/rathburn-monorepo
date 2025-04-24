import { useState, useEffect, useRef } from "react";
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
  const searchTimeoutRef = useRef<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
          {activeView === "Transport" && <TransportView />}
          {activeView === "Production" && <ProductionView />}
          {activeView === "Settings" && <SettingsView />}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className="h-screen w-full flex flex-col pt-10 bg-gray-50 dark:bg-gray-900 dark:text-gray-100">
      {/* Header */}
      {/* <div className="flex items-center justify-between p-4">
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
          Tubelight
        </h1>
      
        <button
          className="text-blue-600 dark:text-blue-400 font-medium hover:shadow-md"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div> */}

      {/* Navigation Bar */}
      <TopNavbar
        navLinks={navLinks}
        activeView={activeView}
        onViewChange={handleViewChange}
      />

      {/* Main Content - View Container */}
      <div className="flex-1 overflow-hidden relative">
        {renderView()}

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
