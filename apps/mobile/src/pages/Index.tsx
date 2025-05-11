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
// import { createClient } from "@/core/lib/supabase/client"; // No longer needed here
import { Database } from "@/core/types/supabase";
// import { logout } from "@/core/services/auth"; // No longer needed here
import { FloatingNavGroup } from "@/core/components/layout/nav-group";
import TopNavbar from "@/components/navbar/top-navbar";
import { TransportView } from "@/views/TransportView";
import { ProductionView } from "@/views/ProductionView";
import { TransportSettingsView } from "@/views/TransportSettingsView";
// import { SettingsView } from "@/components/views/SettingsView";
import { motion, AnimatePresence } from "framer-motion";
import { useSwipeable } from "react-swipeable";
import { ScanInput } from "@/features/scanner/components/scan-input/scan-input";
import { useScan } from "@/core/hooks/use-scan"; // This is for non-stocktake scans, keep it
import { useStocktakeStore } from "@/core/stores/stocktake-store"; // IMPORT: Zustand store
import { useToast, type ToastProps } from "@/core/components/ui/use-toast";
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
} from "@/core/components/ui/sheet";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/core/components/ui/alert";
import { Badge } from "@/core/components/ui/badge";
import { ScanSuccessIndicator } from "@/features/scanner/components/scan-success-indicator";
import { SessionReportDialog } from "@/features/scanner/components/success-report/session-report"; // Import SessionReportDialog
// import { StocktakeButton } from "@/components/buttons/scan-button";

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
  // const [isLoading, setIsLoading] = useState(true); // This might be covered by store.isInitializing
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchTimeoutRef = useRef<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const transportScan = useScan(); // For non-stocktake transport scans
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  // const [location, setLocation] = useState<Location | null>(null);
  const [scanCount, setScanCount] = useState(0); // Local count for UI, reset by session changes

  // Add state for showing the successful scan indicator
  const [successfulScan, setSuccessfulScan] = useState<string | null>(null);
  const successTimeoutRef = useRef<number | null>(null);

  // Buffer and timing refs for global barcode scanner detection (re-added here)
  const barcodeBufferRef = useRef<string>("");
  const lastKeyTimeRef = useRef<number>(0);

  // Use Zustand store for stocktake state and actions
  const {
    currentSessionId,
    isScanning,
    // lastScanMessage, // Not directly used in this component, toast can show store messages
    // lastScanStatus, // Not directly used here
    showSessionReport,
    sessionReportData,
    syncSessionStateOnMount,
    startStocktakeSession, // Renamed for clarity if used directly
    endStocktakeSession, // Renamed for clarity if used directly
    processStocktakeScan, // Renamed for clarity if used directly
    closeSessionReport,
  } = useStocktakeStore();

  // Sync session state on mount using the store action
  useEffect(() => {
    syncSessionStateOnMount();
  }, [syncSessionStateOnMount]);

  // Reset scan count when a session starts or ends (via Zustand state change)
  useEffect(() => {
    console.log(
      "[IndexContent] currentSessionId from store changed to:",
      currentSessionId
    );
    if (currentSessionId) {
      // Potentially reset scanCount based on fetched session data if needed
      // For now, assuming scanCount is for *this* UI interaction with the active session
    } else {
      setScanCount(0); // Reset when session ends or there isn't one
    }
  }, [currentSessionId]);

  // Clean up the success indicator timeout on unmount
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        window.clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  const shouldActivateScanInput = useMemo(() => {
    const isActive = !!currentSessionId;
    console.log(
      `[Index] ScanInput active: ${isActive} (Session ID: ${currentSessionId}, IsScanning: ${isScanning})`
    );
    return isActive;
  }, [currentSessionId, isScanning]);

  useEffect(() => {
    if (shouldActivateScanInput) {
      const triggerFocus = () => {
        try {
          document.dispatchEvent(
            new MouseEvent("click", {
              view: window,
              bubbles: true,
              cancelable: true,
            })
          );
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
      triggerFocus();
      const timeoutIds: number[] = [];
      [100, 300, 600, 1000].forEach((delay) => {
        const id = window.setTimeout(triggerFocus, delay);
        timeoutIds.push(id);
      });
      return () => {
        timeoutIds.forEach((id) => window.clearTimeout(id));
      };
    }
  }, [shouldActivateScanInput]);

  // Moved handleGlobalScan definition earlier to resolve linter error
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
        // Use currentSessionId from store
        if (currentSessionId) {
          console.log(
            "[IndexPage] Routing scan to useStocktakeStore (Session Active)"
          );
          processStocktakeScan(barcode) // Use action from store
            .then((response) => {
              if (response?.success) {
                setScanCount((prevCount) => prevCount + 1);
                setSuccessfulScan(barcode);
                if (successTimeoutRef.current) {
                  window.clearTimeout(successTimeoutRef.current);
                }
                successTimeoutRef.current = window.setTimeout(() => {
                  setSuccessfulScan(null);
                  successTimeoutRef.current = null;
                }, 2500);
              }
              // Toast for scan result can be handled here based on response.message or response.error
              if (response && response.message) {
                toast({
                  title: response.success ? "Scan Success" : "Scan Info",
                  description: response.message,
                  variant: response.success ? "default" : "default",
                });
              } else if (response && response.error) {
                toast({
                  title: "Scan Error",
                  description: response.error,
                  variant: "destructive",
                });
              }
            })
            .catch((err) => {
              console.error(
                "[IndexPage] Error processing stocktake scan:",
                err
              );
              toast({
                title: "Scan Error",
                description: err.message || "Failed to process stocktake scan",
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
    // Add dependencies from the store that are used in the callback
    [currentView, processStocktakeScan, currentSessionId, transportScan, toast]
  );

  // Global keydown listener for barcode scanner
  useEffect(() => {
    if (!shouldActivateScanInput) {
      barcodeBufferRef.current = ""; // Clear buffer when not active
      return;
    }

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // If an input field, textarea, or select is focused, don't interfere
      // Allows normal typing in other potential input fields on the page.
      const targetElement = e.target as HTMLElement;
      if (
        targetElement.tagName === "INPUT" ||
        targetElement.tagName === "TEXTAREA" ||
        targetElement.tagName === "SELECT"
      ) {
        // Exception: allow our own hidden scan input to still be "typed into" by the global handler
        // if it somehow did get focus, though it's unlikely and not the primary mechanism.
        // The main goal here is to NOT interfere with visible, user-typable inputs.
        if (targetElement.getAttribute("data-testid") !== "barcode-input") {
          return;
        }
      }

      const now = Date.now();
      // Reset buffer if pause between keys is too long (e.g., > 100ms)
      // Adjust timeout as needed for your scanner's speed
      if (lastKeyTimeRef.current && now - lastKeyTimeRef.current > 100) {
        barcodeBufferRef.current = "";
      }
      lastKeyTimeRef.current = now;

      if (e.key === "Enter") {
        const code = barcodeBufferRef.current.trim();
        barcodeBufferRef.current = ""; // Reset buffer
        if (code.length >= 3) {
          console.log(
            "[IndexPage] Global KeyDown 'Enter' detected, processing code:",
            code
          );
          handleGlobalScan(code);
        } else if (code.length > 0) {
          console.warn(
            "[IndexPage] Global KeyDown 'Enter', but code too short:",
            code
          );
        }
        e.preventDefault(); // Prevent default action for Enter if it was a scan
      } else if (e.key.length === 1) {
        // Append single characters
        barcodeBufferRef.current += e.key;
      }
      // console.log(`[IndexPage] Global KeyDown: key='${e.key}', buffer='${barcodeBufferRef.current}'`); // Verbose log
    };

    console.log("[IndexPage] Adding global keydown listener (scan active)");
    window.addEventListener("keydown", handleGlobalKeyDown, true); // Use capture phase

    return () => {
      console.log(
        "[IndexPage] Removing global keydown listener (scan inactive or component unmount)"
      );
      window.removeEventListener("keydown", handleGlobalKeyDown, true);
      barcodeBufferRef.current = ""; // Clear buffer on cleanup
    };
  }, [shouldActivateScanInput, handleGlobalScan]); // Dependency: handleGlobalScan

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

  // const handleLocationChange = (newLocation: Location) => {
  //   console.log(`Location change requested: ${newLocation}`);
  //   // setLocation(newLocation); // setLocation was removed
  //   toast({
  //     title: "Location Updated",
  //     description: `Current location set to: ${newLocation.replace("_", " ").toUpperCase()}`,
  //   });
  // };

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
    if (viewName.toLowerCase() === "settings") {
      console.log("Opening settings modal instead of changing view");
      return;
    }
    const navItem = navLinks.find((item) => item.name === viewName);
    if (navItem) {
      console.log(`Setting current view to: ${navItem.value}`);
      setCurrentView(navItem.value);
    } else {
      console.log(`Setting current view directly to: ${viewName}`);
      setCurrentView(viewName.toLowerCase().replace(/\s+/g, ""));
    }
    if (isMenuOpen) handleMenuToggle(false);
    setSearchQuery("");
  };

  const [swipeDirection, setSwipeDirection] = useState(0);
  const handlers = useSwipeable({
    onSwipedLeft: () => {
      const currentIndex = navLinks.findIndex(
        (link) => link.value === currentView
      );
      const nextIndex = (currentIndex + 1) % navLinks.length;
      setSwipeDirection(1);
      setCurrentView(navLinks[nextIndex].value);
    },
    onSwipedRight: () => {
      const currentIndex = navLinks.findIndex(
        (link) => link.value === currentView
      );
      const nextIndex = (currentIndex - 1 + navLinks.length) % navLinks.length;
      setSwipeDirection(-1);
      setCurrentView(navLinks[nextIndex].value);
    },
  });

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  const renderView = () => {
    switch (currentView) {
      case "transport":
        return <TransportView />;
      case "production":
        return <ProductionView />;
      case "transportsettings":
        return <TransportSettingsView />;
      default:
        return <TransportView />;
    }
  };

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
  );

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

      {/* <h1>
        {stockTake.currentSessionId
          ? "Stocktake Session Active: " +
            stockTake.currentSessionId.slice(0, 8)
          : "No Stocktake Session Active"}
      </h1> */}

      {/* Display current location as a badge if set */}
      {/* {location && (
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
      )} */}

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

      <AnimatePresence>
        {successfulScan && <ScanSuccessIndicator barcode={successfulScan} />}
      </AnimatePresence>

      {/* Session Report Dialog using Zustand state */}
      {sessionReportData && (
        <SessionReportDialog
          isOpen={showSessionReport}
          onClose={closeSessionReport} // Use action from store
          sessionData={sessionReportData}
        />
      )}

      <FloatingNavGroup
        onMenuNavigate={handleNavigation}
        onMenuToggle={handleMenuToggle}
        // onLocationChange={handleLocationChange} // Removed
        // activeLocation={location} // Removed
        isStockTakeActive={Boolean(currentSessionId)} // From store
        scanCount={scanCount} // Local scan count for the UI
        // currentSessionId={currentSessionId} // From store
        // isScanning={isScanning} // From store
        // lastScanMessage={useStocktakeStore.getState().lastScanMessage} // Directly get for props if not destructured above for re-render reasons
        // startStocktakeSession={startStocktakeSession} // From store
        // endStocktakeSession={endStocktakeSession} // From store
      />
    </div>
  );
};

const Index = () => <IndexContent />;

export default Index;
