import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Forklift, Atom, Clock } from "lucide-react";
// import { logout } from "@/core/services/auth"; // No longer needed here
import { FloatingNavGroup } from "@/core/components/layout/nav-group";
import TopNavbar from "@/core/components/layout/top-navbar";
import { TransportView } from "@/views/TransportView";
import { ProductionView } from "@/views/ProductionView";
// import { SettingsView } from "@/components/views/SettingsView";
import { motion, AnimatePresence } from "framer-motion";
import { useSwipeable } from "react-swipeable";
import { ScanInput } from "@/features/scanner/components/scan-input/scan-input";
// import { useScan } from "@/core/hooks/use-scan"; // Removed import
import { useSessionStore } from "@/core/stores/session-store"; // IMPORT: Zustand store
import { useScanStore } from "@/core/stores/use-scan"; // IMPORT: New scan store
import { useToast, type ToastProps } from "@/core/components/ui/use-toast";
// import { useModal } from "@/hooks/use-modal"; // This was already commented
// import { ModalProvider } from "@/contexts/modal-context"; // This was already commented
import { ScanSuccessIndicator } from "@/features/scanner/components/scan-success-indicator";
import { SessionReportDialog } from "@/features/scanner/components/success-report/session-report";
// import { ScanResponse } from "@/features/scanner/services/stocktake-scan"; // This seems unused now, removing
import { HistoryView } from "@/views/HistoryView";
import { DebugLogPanel } from "@/core/components/debug/DebugLogPanel";
// import { StocktakeButton } from "@/components/buttons/scan-button";
import { useDebugLogStore } from "../core/stores/debug-log-store";

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
  const [currentView, setCurrentView] = useState("transport");
  // const [isLoading, setIsLoading] = useState(true); // This might be covered by store.isInitializing
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchTimeoutRef = useRef<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  // const transportScan = useScan(); // Removed transportScan from useScan
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  // const [location, setLocation] = useState<Location | null>(null); // This was already commented
  const [scanCount, setScanCount] = useState(0); // Local count for UI, reset by session changes

  // Add state for showing the successful scan indicator
  const [successfulScan, setSuccessfulScan] = useState<string | null>(null);
  const successTimeoutRef = useRef<number | null>(null);

  // Buffer and timing refs for global barcode scanner detection (re-added here)
  // These are now managed within ScanInput.tsx and useScanStore.ts
  // const barcodeBufferRef = useRef<string>("");
  // const lastKeyTimeRef = useRef<number>(0);

  // Use Zustand store for stocktake state and actions
  const {
    currentSessionId,
    // isScanning, // isScanning from session-store is for session logic, scan-store has its own activity state
    showSessionReport,
    sessionReportData,
    syncSessionStateOnMount,
    // startSession, // No longer needed here for scan input activation
    // endSession, // No longer needed here for scan input deactivation
    processScan, // This is the callback we'll provide to useScanStore
    closeSessionReport,
    lastScanStatus,
    lastScanMessage,
  } = useSessionStore();

  // Get actions from the new scan store
  const { setScanInputGloballyActive, setOnScanCallback } = useScanStore();

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

  // NEW: Determine scan input global activity based on session store's currentSessionId
  useEffect(() => {
    const isActive = !!currentSessionId;
    console.log(
      `[Index] Setting ScanInput global activity: ${isActive} (Session ID: ${currentSessionId})`
    );
    setScanInputGloballyActive(isActive);
  }, [currentSessionId, setScanInputGloballyActive]);

  // This effect now primarily sets the callback for the scan store
  useEffect(() => {
    console.log("[IndexPage] Setting onScan callback in useScanStore");
    const scanCallback = async (barcode: string) => {
      useDebugLogStore
        .getState()
        .addLog("[IndexPage] OnScanCallback invoked", { barcode });
      console.log(
        `[IndexPage] ScanInput processed barcode: ${barcode}. Triggering sessionStore.processScan.`
      );

      if (!barcode || barcode.length < 3) {
        console.warn(`[IndexPage] Ignoring invalid barcode: ${barcode}`);
        toast({
          title: "Scan Error",
          description: `Invalid barcode: ${barcode}`,
          variant: "destructive",
        });
        // Ensure we don't proceed further if barcode is invalid
        return;
      }

      if (currentSessionId) {
        // Double check session is still active before processing
        try {
          useDebugLogStore
            .getState()
            .addLog(
              "[IndexPage] Attempting to await sessionStore.processScan",
              { barcode }
            );
          await processScan(barcode);
          useDebugLogStore
            .getState()
            .addLog(
              "[IndexPage] Successfully awaited sessionStore.processScan",
              { barcode }
            );

          // Update UI based on new state from sessionStore after processScan completes
          const { scannedDrumsForCurrentTask } = useSessionStore.getState();
          setScanCount(scannedDrumsForCurrentTask.length);
          useDebugLogStore
            .getState()
            .addLog("[IndexPage] UI scanCount updated", {
              count: scannedDrumsForCurrentTask.length,
            });

          setSuccessfulScan(barcode);
          if (successTimeoutRef.current) {
            window.clearTimeout(successTimeoutRef.current);
          }
          successTimeoutRef.current = window.setTimeout(() => {
            setSuccessfulScan(null);
            successTimeoutRef.current = null;
          }, 2500);
          useDebugLogStore
            .getState()
            .addLog("[IndexPage] UI successfulScan indicator triggered", {
              barcode,
            });
        } catch (error) {
          console.error(
            "[IndexPage] Error during processScan execution:",
            error
          );
          useDebugLogStore
            .getState()
            .addLog("[IndexPage] Error awaiting sessionStore.processScan", {
              barcode,
              error: error instanceof Error ? error.message : String(error),
            });
          toast({
            title: "Processing Error",
            description: "Failed to process scan. Check logs.",
            variant: "destructive",
          });
        }
      } else {
        console.log(
          `[IndexPage] Scan callback triggered, but no active session. Scan for ${barcode} ignored.`
        );
        useDebugLogStore
          .getState()
          .addLog("[IndexPage] Scan ignored in callback, no active session", {
            barcode,
          });
        toast({
          title: "Scan Error",
          description: "No active session to process scan.",
          variant: "destructive",
        });
      }
    };
    setOnScanCallback(scanCallback);

    // Cleanup: remove the callback when the component unmounts or dependencies change
    return () => {
      setOnScanCallback(null);
      useDebugLogStore
        .getState()
        .addLog("[IndexPage] OnScanCallback cleared from useScanStore");
    };
  }, [processScan, currentSessionId, toast, setOnScanCallback]);

  const shouldActivateScanInput = useMemo(() => {
    const isActive = !!currentSessionId;
    console.log(
      `[Index] ScanInput active: ${isActive} (Session ID: ${currentSessionId})`
    );
    return isActive;
  }, [currentSessionId]);

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

  // Effect to show toast based on lastScanStatus and lastScanMessage from the store
  useEffect(() => {
    if (lastScanMessage) {
      if (lastScanStatus === "success") {
        toast({ title: "Scan Success", description: lastScanMessage });
      } else if (lastScanStatus === "error") {
        toast({
          title: "Scan Error",
          description: lastScanMessage,
          variant: "destructive",
        });
      } else if (
        lastScanStatus === "idle" &&
        lastScanMessage !== "Initializing..." &&
        lastScanMessage !== "Ready." &&
        lastScanMessage !== "Resumed active session." &&
        !lastScanMessage.startsWith("Session") && // Adjusted to be more specific
        !lastScanMessage.startsWith("Ending session...") && // Adjusted
        !lastScanMessage.startsWith("No active session") // Adjusted
      ) {
        // Catch other general messages from the store to display as info
        toast({ title: "Info", description: lastScanMessage });
      }
      // Optionally, reset lastScanMessage in the store after showing toast
      // useSessionStore.setState({ lastScanMessage: null, lastScanStatus: 'idle' });
      // Be cautious with auto-resetting, might hide important subsequent states if not handled carefully
    }
  }, [lastScanStatus, lastScanMessage, toast]);

  const handleNavigation = (itemId: string) => {
    console.log(`Navigation action: ${itemId}`);

    switch (itemId) {
      // case "stats": // Removed obsolete case
      //   navigate("/");
      //   break;
      // case "team": // Removed obsolete case
      //   navigate("/team");
      //   break;
      // case "scan": // Removed obsolete case
      //   navigate("/scan");
      //   break;
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
    { name: "History", value: "history", icon: Clock },
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
      case "history":
        return <HistoryView />;
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
      {/* ScanInput is now a self-managing component using the store */}
      <ScanInput />
      <DebugLogPanel />

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
        // Pass actions from the store, aliasing startSession if needed for clarity in FloatingNavGroup/StocktakeButton if they were to use it directly
        // However, StocktakeButton now uses the store directly, so these specific props might not be needed by FloatingNavGroup itself
        // For now, keeping them as they were, assuming FloatingNavGroup might pass them or use them.
        // If StocktakeButton is the only consumer and uses the store, these become redundant on FloatingNavGroup.
        // currentSessionId={currentSessionId} // Provided by isStockTakeActive logic
        // isScanning={isScanning} // StocktakeButton gets from store
        // lastScanMessage={useSessionStore.getState().lastScanMessage}
        // startSession={startSession} // Alias for clarity if preferred in this component
        // endStocktakeSession={endSession} // StocktakeButton gets from store
      />
    </div>
  );
};

const Index = () => <IndexContent />;

export default Index;
