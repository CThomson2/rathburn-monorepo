import { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
  Truck,
  Factory,
  ClipboardList,
  ScanBarcode,
  Play,
  StopCircle,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/supabase";
import { logout } from "@/services/auth";
import { FloatingNavGroup } from "@/components/buttons/nav-group";
import TopNavbar from "@/components/navbar/top-navbar";
import { TransportView } from "@/views/TransportView";
import { ProductionView } from "@/views/ProductionView";
import { TransportSettingsView } from "@/views/TransportSettingsView";
// import { SettingsView } from "@/components/views/SettingsView";
import { motion, AnimatePresence } from "framer-motion";
import { useSwipeable } from "react-swipeable";
import { ScanInput } from "@/features/transport/ScanInput";
import { useScan } from "@/hooks/use-scan";
import { useStockTake } from "@/hooks/use-stock-take";
import { useToast, type ToastProps } from "@/components/ui/use-toast";
// import { useModal } from "@/hooks/use-modal";
// import { ModalProvider } from "@/contexts/modal-context";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

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

type Location = Database["inventory"]["Enums"]["location_type"];

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
  const [currentView, setCurrentView] = useState("transport");
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchTimeoutRef = useRef<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [userInfo, setUserInfo] = useState<Record<string, string | null>>({
    userId: null,
    userName: null,
    sessionToken: null,
    email: null,
  });
  const { toast } = useToast();
  const transportScan = useScan();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [location, setLocation] = useState<Location | null>(null);

  // Call useStockTake hook without passing the location directly
  const stockTake = useStockTake();

  // Update stockTake's location when our location state changes
  useEffect(() => {
    // Location changes are tracked within the hook internally
    if (stockTake.currentLocation !== location && stockTake.currentSessionId) {
      // If we had an API endpoint to update location for an active session, we'd call it here
      console.log(
        `[Index] Location changed during active session: ${location}`
      );
      // This could trigger a location update API call if needed
    }
  }, [location, stockTake.currentLocation, stockTake.currentSessionId]);

  const shouldActivateScanInput = useMemo(() => {
    const isActive = !!stockTake.currentSessionId;
    console.log(
      `[Index] ScanInput isActive: ${isActive}, Session ID: ${stockTake.currentSessionId}`
    );
    return isActive;
  }, [stockTake.currentSessionId]);

  useEffect(() => {
    if (shouldActivateScanInput) {
      console.log(
        "[Index] ScanInput should be active, triggering focus events"
      );

      // First attempt - simulate a click to trigger focus handlers
      const triggerFocus = () => {
        try {
          // Dispatch both click and focus events to maximize chances of focus
          document.dispatchEvent(
            new MouseEvent("click", {
              view: window,
              bubbles: true,
              cancelable: true,
            })
          );

          // Also dispatch a focus event on window
          window.dispatchEvent(
            new FocusEvent("focus", {
              bubbles: true,
              cancelable: true,
            })
          );
        } catch (err) {
          console.error("[Index] Error dispatching focus events:", err);
        }
      };

      // Call immediately and then set up repeated attempts
      triggerFocus();

      // Try a series of focus attempts at increasing intervals
      const timeoutIds: number[] = [];
      [100, 300, 600, 1000].forEach((delay) => {
        const id = window.setTimeout(triggerFocus, delay);
        timeoutIds.push(id);
      });
      return () => {
        // Clean up all timeouts
        timeoutIds.forEach((id) => window.clearTimeout(id));
      };
    }
  }, [shouldActivateScanInput]);

  const handleGlobalScan = useCallback(
    (barcode: string) => {
      console.log(
        `[IndexPage] handleGlobalScan CALLED with barcode: ${barcode}`
      );
      try {
        console.log(
          `[IndexPage] Global scan received: ${barcode}, Current View: ${currentView}`
        );
        if (!barcode || barcode.length < 3) {
          console.warn(`[IndexPage] Ignoring invalid barcode: ${barcode}`);
          return;
        }
        if (stockTake.currentSessionId) {
          console.log(
            "[IndexPage] Routing scan to useStockTake (Session Active)"
          );
          stockTake.processStocktakeScan(barcode).catch((err) => {
            console.error("[IndexPage] Error processing stocktake scan:", err);
            toast({
              title: "Scan Error",
              description: "Failed to process stocktake scan",
              variant: "destructive",
            });
          });
        } else if (currentView === "transport") {
          console.log(
            "[IndexPage] Routing scan to useScan (Transport, No Stocktake Session)"
          );
          transportScan.handleDrumScan(barcode);
        } else {
          console.log(
            `[IndexPage] Scan ignored: View ${currentView} does not handle scans and no stocktake session active.`
          );
        }
      } catch (error) {
        console.error("[IndexPage] Unexpected error handling scan:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred processing the scan",
          variant: "destructive",
        });
      }
    },
    [currentView, stockTake, transportScan, toast]
  );

  const handleNavigation = (itemId: string) => {
    console.log(`Navigation action: ${itemId}`);

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
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 100);
        startSearchTimeout();
        break;
      case "settings":
        console.log("Opening settings modal");
        break;
      default:
        navigate("/");
    }
  };

  // Get user session data for debugging
  // useEffect(() => {
  //   const fetchSession = async () => {
  //     const supabase = createClient();
  //     const { data } = await supabase.auth.getSession();
  //     console.log("[INDEX] Auth session data:", data);

  //     setUserInfo({
  //       userId: data.session?.user?.id || null,
  //       userName: data.session?.user?.user_metadata?.name || null,
  //       sessionToken: data.session?.access_token || null,
  //       email: data.session?.user?.email || null,
  //     });
  //   };
  //   fetchSession();
  // }, []);

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
    setIsMenuOpen(isOpen);
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

  // Handle location change from the LocationButton
  const handleLocationChange = (newLocation: Location) => {
    console.log(`Location change requested: ${newLocation}`);
    setLocation(newLocation);

    // Show toast notification for location change
    toast({
      title: "Location Updated",
      description: `Current location set to: ${newLocation.replace("_", " ").toUpperCase()}`,
    });

    // If we have an active stock take session, we could trigger a location update here
    // or this could be handled internally by the useStockTake hook since we're passing location to it
  };

  const navLinks = [
    { name: "Transport", value: "transport", icon: Forklift },
    { name: "Production", value: "production", icon: Atom },
    { name: "Transport Settings", value: "transportsettings", icon: Settings },
  ];

  // Track previous view for animation direction
  const [prevView, setPrevView] = useState(currentView);

  // Update prevView whenever currentView changes
  useEffect(() => {
    if (prevView !== currentView) {
      setPrevView(currentView);
    }
  }, [currentView, prevView]);

  // Handle view changes from the top navbar
  const handleViewChange = (viewName: string) => {
    console.log(`View change requested: ${viewName}`);

    // Skip view change if it's just opening settings
    if (viewName.toLowerCase() === "settings") {
      console.log("Opening settings modal instead of changing view");
      return;
    }

    // Find the matching nav item and use its value
    const navItem = navLinks.find((item) => item.name === viewName);
    if (navItem) {
      console.log(`Setting current view to: ${navItem.value}`);
      setCurrentView(navItem.value);
    } else {
      console.log(`Setting current view directly to: ${viewName}`);
      setCurrentView(viewName.toLowerCase().replace(/\s+/g, ""));
    }

    if (isMenuOpen) {
      handleMenuToggle(false);
    }
    setSearchQuery("");
  };

  // State to track the swipe direction
  const [swipeDirection, setSwipeDirection] = useState(0);

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      const currentIndex = navLinks.findIndex(
        (link) => link.value === currentView
      );
      const nextIndex = (currentIndex + 1) % navLinks.length;
      const nextView = navLinks[nextIndex].value;

      // Set direction for left swipe (positive - move right)
      setSwipeDirection(1);
      setCurrentView(nextView);
    },
    onSwipedRight: () => {
      const currentIndex = navLinks.findIndex(
        (link) => link.value === currentView
      );
      const nextIndex = (currentIndex - 1 + navLinks.length) % navLinks.length;
      const nextView = navLinks[nextIndex].value;

      // Set direction for right swipe (negative - move left)
      setSwipeDirection(-1);
      setCurrentView(nextView);
    },
  });

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
    console.log(`Rendering view: ${currentView}`);
    switch (currentView) {
      case "transport":
        return <TransportView />;
      case "production":
        return <ProductionView />;
      case "transportsettings":
        return <TransportSettingsView />;
      default:
        console.log(
          `No matching view for "${currentView}", showing default TransportView`
        );
        return <TransportView />;
    }
  };

  // Use a callback to safely show toast notifications - Add correct type
  const showToast = useCallback(
    (props: ToastProps) => {
      try {
        console.log(`[Index] Showing toast: ${props.title}`);
        toast(props);
      } catch (err) {
        console.error("[Index] Error showing toast:", err);
      }
    },
    [toast]
  ); // Add toast as dependency

  return (
    <div
      className="h-screen w-full flex flex-col pt-2 bg-gray-50 dark:bg-gray-900 dark:text-gray-100"
      {...handlers}
    >
      <ScanInput onScan={handleGlobalScan} isActive={shouldActivateScanInput} />

      <TopNavbar
        navLinks={navLinks}
        activeView={currentView}
        onViewChange={handleViewChange}
        extraActions={[]}
      />

      {/* Display current location as a badge if set */}
      {location && (
        <div className="px-4 py-1">
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 border-green-300 flex items-center gap-1"
          >
            <MapPin size={14} />
            <span className="capitalize">
              {location.replace("_", " ").toUpperCase()}
            </span>
          </Badge>
        </div>
      )}

      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence initial={false} mode="wait" custom={swipeDirection}>
          <motion.div
            key={currentView}
            custom={swipeDirection}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="w-full h-[100%] overflow-auto pb-24"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating Navigation Group - contains both menu and stocktake buttons */}
      <FloatingNavGroup
        onMenuNavigate={handleNavigation}
        onMenuToggle={handleMenuToggle}
        onLocationChange={handleLocationChange}
        activeLocation={location}
        isStockTakeActive={Boolean(stockTake.currentSessionId)}
      />
    </div>
  );
};

const Index = () => <IndexContent />;

export default Index;
