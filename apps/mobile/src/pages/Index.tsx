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
  Zap,
} from "lucide-react";
import { createClient, createAuthClient } from "@/lib/supabase/client";
import { logout } from "@/services/auth";
import FloatingNavMenu from "@/components/layout/FloatingNavMenu";
import TopNavbar from "@/components/navbar/top-navbar";
import { TransportView } from "@/components/views/TransportView";
import { ProductionView } from "@/components/views/ProductionView";
import { TransportSettingsView } from "@/components/views/TransportSettingsView";
import { SettingsView } from "@/components/views/SettingsView";
import { motion, AnimatePresence } from "framer-motion";
import { useSwipeable } from "react-swipeable";
import { ModalProvider, useModal } from "@/contexts/modal-context";
import { ScanInput } from "@/features/transport/ScanInput";
import { useScan } from "@/contexts/scan-context";
import { useToast } from "@/components/ui/use-toast";

// Import the ScanProvider instead of just the context
//

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
const IndexContent = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("Transport");
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchTimeoutRef = useRef<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { isSettingsModalOpen, openSettingsModal } = useModal();
  const { handleDrumScan, isProcessing } = useScan();
  const { toast } = useToast();
  const [userInfo, setUserInfo] = useState<Record<string, string | null>>({
    userId: null,
    userName: null,
    sessionToken: null,
    email: null,
  });

  // Handle barcode scan
  const handleBarcodeScan = (barcode: string) => {
    console.log("Barcode scanned:", barcode);

    // Show toast notification for the scan
    toast({
      title: "Barcode Scanned",
      description: `Processing barcode: ${barcode}`,
      duration: 3000,
    });

    // Always forward to scan context handler
    handleDrumScan(barcode);
  };

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
        openSettingsModal();
        break;
      default:
        navigate("/");
    }
  };

  // Get user session data for debugging
  useEffect(() => {
    const fetchSession = async () => {
      const supabase = createAuthClient();
      const { data } = await supabase.auth.getSession();
      console.log("[INDEX] Auth session data:", data);

      setUserInfo({
        userId: data.session?.user?.id || null,
        userName: data.session?.user?.user_metadata?.name || null,
        sessionToken: data.session?.access_token || null,
        email: data.session?.user?.email || null,
      });
    };
    fetchSession();
  }, []);

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

  const navLinks = [
    { name: "Transport", icon: Forklift },
    { name: "Production", icon: Atom },
    { name: "Transport Settings", icon: Settings },
  ];

  // Track previous view for animation direction
  const [prevView, setPrevView] = useState(activeView);

  // Update prevView whenever activeView changes
  useEffect(() => {
    if (prevView !== activeView) {
      setPrevView(activeView);
    }
  }, [activeView, prevView]);

  const handleViewChange = (viewName: string) => {
    // Calculate direction before changing the view
    const oldIndex = navLinks.findIndex((link) => link.name === activeView);
    const newIndex = navLinks.findIndex((link) => link.name === viewName);
    const direction = newIndex - oldIndex;

    // Store the swipe direction in state
    setSwipeDirection(direction);

    // Update the active view
    setActiveView(viewName);
  };

  // State to track the swipe direction
  const [swipeDirection, setSwipeDirection] = useState(0);

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      const currentIndex = navLinks.findIndex(
        (link) => link.name === activeView
      );
      const nextIndex = (currentIndex + 1) % navLinks.length;
      const nextView = navLinks[nextIndex].name;

      // Set direction for left swipe (positive - move right)
      setSwipeDirection(1);
      setActiveView(nextView);
    },
    onSwipedRight: () => {
      const currentIndex = navLinks.findIndex(
        (link) => link.name === activeView
      );
      const nextIndex = (currentIndex - 1 + navLinks.length) % navLinks.length;
      const nextView = navLinks[nextIndex].name;

      // Set direction for right swipe (negative - move left)
      setSwipeDirection(-1);
      setActiveView(nextView);
    },
  });

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

  /**
   * Renders the currently active view.
   *
   * Uses AnimatePresence and motion.div to animate the view transitions.
   * The direction of the swipe is determined by the old and new view index,
   * and is passed to the custom property of the AnimatePresence component.
   *
   * @returns {JSX.Element}
   */
  const renderView = () => {
    return (
      <AnimatePresence initial={false} mode="wait" custom={swipeDirection}>
        <motion.div
          key={activeView}
          custom={swipeDirection}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
          className="w-full h-[100%] overflow-auto pb-20"
        >
          {activeView === "Transport" && <TransportView />}
          {activeView === "Production" && <ProductionView />}
          {activeView === "Transport Settings" && <TransportSettingsView />}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div
      className="h-screen w-full flex flex-col pt-10 bg-gray-50 dark:bg-gray-900 dark:text-gray-100"
      {...handlers}
    >
      {/* Invisible Scan Input - Always active */}
      <ScanInput onScan={handleBarcodeScan} />

      {/* Navigation Bar */}
      <TopNavbar
        navLinks={navLinks}
        activeView={activeView}
        onViewChange={handleViewChange}
      />

      {/* Main Content - View Container */}
      <div className="flex-1 overflow-hidden relative">
        {renderView()}

        {/* User Info Display */}
        {/* <div className="absolute top-2 right-2 z-50">
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-3 w-full max-w-md flex gap-2">
            <div className="flex-1">
              <p className="text-sm font-medium">User ID:</p>
              <p className="text-sm">{userInfo.userId || "Not available"}</p>
              <p className="text-sm">{userInfo.userName || "Not available"}</p>
              <p className="text-sm">{userInfo.email || "Not available"}</p>
              <p className="text-sm">
                {userInfo.sessionToken || "Not available"}
              </p>
            </div>
          </div>
        </div> */}

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

        {/* Settings Modal */}
        <AnimatePresence>
          {isSettingsModalOpen && <SettingsView />}
        </AnimatePresence>
      </div>

      {/* Floating navigation menu */}
      {/* <div className="fixed w-16 h-16 bottom-1 left-1 right-0 z-50 border-b-2 rounded-[50%] bg-slate-200 dark:bg-gray-800"> */}
      <FloatingNavMenu
        onNavigate={handleNavigation}
        onMenuToggle={handleMenuToggle}
      />
      {/* </div> */}
    </div>
  );
};

// Wrapper component to provide the modal context
const Index = () => {
  return (
    <ModalProvider>
      <IndexContent />
    </ModalProvider>
  );
};

export default Index;
