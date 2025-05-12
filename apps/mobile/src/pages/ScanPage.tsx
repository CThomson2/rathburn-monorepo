import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Scan, StopCircle, LogOut, Bell } from "lucide-react";
import { cn } from "@/core/lib/utils";
import { useStockTake } from "@/features/scanner/hooks/stocktake/use-stocktake";
import { useToast } from "@/core/components/ui/use-toast";
import { useAuth } from "@/core/hooks/use-auth";
import { supabase } from "@/core/lib/supabase/client";
import { FloatingDrumSVG } from "@/components/animations/floating-drum";

// Define type for scanned items
interface ScannedItem {
  id: string;
  raw_barcode: string;
  created_at: string;
}

// CentralStocktakeButton Component
interface CentralStocktakeButtonProps {
  isActive: boolean;
  onClick: () => void;
  isScanning: boolean;
  isDisabled: boolean;
}

/**
 * A large, centered button for starting and stopping stock take sessions.
 *
 * Conditionally renders a Scan or StopCircle icon, and changes the button's
 * background color and shape depending on whether a session is active.
 *
 * Also adds a pulsing animation when a session is active and being scanned.
 *
 * @param isActive - Whether the stock take session is currently active.
 * @param onClick - A function to call when the button is clicked.
 * @param isScanning - Whether the device is currently scanning.
 * @param isDisabled - Whether the button should be disabled.
 */
const CentralStocktakeButton: React.FC<CentralStocktakeButtonProps> = ({
  isActive,
  onClick,
  isScanning,
  isDisabled,
}) => {
  return (
    <motion.button
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        "flex flex-col items-center justify-center w-48 h-48 shadow-xl transition-all duration-300 ease-in-out",
        "text-white focus:outline-none focus:ring-4 rounded-full",
        isActive
          ? "bg-red-700 hover:bg-red-800 focus:ring-red-500"
          : "bg-red-600 hover:bg-red-700 focus:ring-red-400",
        isScanning && isActive && "animate-pulse",
        isDisabled && "opacity-50 cursor-not-allowed"
      )}
      aria-label={
        isActive ? "End stock take session" : "Start stock take session"
      }
      whileTap={isDisabled ? {} : { scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 10 }}
    >
      {isActive ? (
        <StopCircle className="h-20 w-20 mb-2" />
      ) : (
        <Scan className="h-20 w-20 mb-2" />
      )}
      <span className="text-lg font-semibold">
        {isActive ? "STOP" : "START SESSION"}
      </span>
    </motion.button>
  );
};

const ScanPage = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const stockTake = useStockTake();
  const { toast } = useToast();
  const isSessionActive = !!stockTake.currentSessionId;
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [isFetchingScans, setIsFetchingScans] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Logout Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const fetchScans = async () => {
      if (isSessionActive && stockTake.currentSessionId) {
        setIsFetchingScans(true);
        try {
          const { data, error } = await supabase
            .from("stocktake_scans")
            .select("id, raw_barcode, created_at")
            .eq("stocktake_session_id", stockTake.currentSessionId)
            .order("created_at", { ascending: false });

          if (error) {
            throw error;
          }
          setScannedItems(data as ScannedItem[]);
        } catch (error) {
          console.error("Error fetching scanned items:", error);
          toast({
            title: "Error",
            description: "Could not fetch scanned items.",
            variant: "destructive",
          });
          setScannedItems([]);
        } finally {
          setIsFetchingScans(false);
        }
      } else {
        setScannedItems([]);
      }
    };

    fetchScans();
  }, [
    isSessionActive,
    stockTake.currentSessionId,
    stockTake.lastScanId,
    toast,
  ]);

  const handleToggleSession = async () => {
    console.log("[ScanPage] Toggling stock take session");
    try {
      if (isSessionActive) {
        await stockTake.endStocktakeSession();
        toast({
          title: "Stock Take Ended",
          description: "Your stock take session has been ended.",
          variant: "default",
        });
      } else {
        if (!user) {
          toast({
            title: "Authentication Required",
            description: "Please log in to start a stock take session.",
            variant: "destructive",
          });
          return;
        }
        await stockTake.startStocktakeSession();
        toast({
          title: "Stock Take Started",
          description: "Your stock take session is now active.",
          variant: "default",
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      console.error(
        "[ScanPage] Error toggling session (handled in hook, displaying toast):",
        errorMessage
      );
      toast({
        title: "Error",
        description:
          stockTake.lastScanMessage ||
          `Failed to ${isSessionActive ? "end" : "start"} stock take session. ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 text-white p-4">
        <p className="text-2xl">Loading authentication...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 text-white p-4 relative">
      {user && (
        <motion.button
          onClick={handleLogout}
          className="absolute top-6 right-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md flex items-center space-x-2 transition-colors duration-200"
          whileTap={{ scale: 0.95 }}
        >
          <LogOut className="h-5 w-5" />
          <span>Log Out</span>
        </motion.button>
      )}

      {!isSessionActive ? (
        <>
          <motion.h1
            className="text-6xl font-extrabold mb-12 text-gray-100 z-10"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
            style={{
              textShadow:
                "0 0 10px rgba(255,255,255,0.3), 0 0 20px rgba(255,255,255,0.2)",
            }}
          >
            WELCOME
          </motion.h1>

          <div
            className="absolute opacity-70"
            style={{
              top: "40%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 0,
            }}
          >
            <FloatingDrumSVG
              active={!stockTake.isScanning && !isSessionActive}
              width={300}
              height={300}
            />
          </div>

          <div className="z-10">
            <CentralStocktakeButton
              isActive={isSessionActive}
              onClick={handleToggleSession}
              isScanning={stockTake.isScanning}
              isDisabled={!user || stockTake.isInitializing}
            />
          </div>

          <motion.p
            className="mt-10 text-2xl text-gray-300 z-10"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              delay: 0.3,
              type: "spring",
              stiffness: 100,
            }}
          >
            {stockTake.isInitializing
              ? "Initializing..."
              : !user
                ? "Please Log In"
                : isSessionActive
                  ? "Session Active"
                  : "Start Session"}
          </motion.p>
        </>
      ) : (
        <div className="w-full max-w-md flex flex-col items-center h-full pt-16">
          <motion.h2
            className="text-3xl font-bold mb-6 text-gray-200"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {stockTake.currentSessionName || "Active Session"}
          </motion.h2>

          {isFetchingScans && <p className="text-gray-400">Loading scans...</p>}

          {!isFetchingScans && scannedItems.length === 0 && (
            <p className="text-gray-400 text-lg mt-4">
              No items scanned yet in this session.
            </p>
          )}

          <div
            className="w-full space-y-3 overflow-y-auto flex-grow"
            style={{ maxHeight: "calc(100vh - 200px)" }}
          >
            {scannedItems.map((item) => (
              <motion.div
                key={item.id}
                className="bg-gray-700 p-4 rounded-lg shadow-md w-full flex items-center justify-between"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center">
                  <Bell className="h-5 w-5 mr-3 text-blue-400" />
                  <span
                    className="text-lg text-gray-200 truncate"
                    title={item.raw_barcode}
                  >
                    {item.raw_barcode.length > 20
                      ? `${item.raw_barcode.substring(0, 20)}...`
                      : item.raw_barcode}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(item.created_at).toLocaleTimeString()}
                </span>
              </motion.div>
            ))}
          </div>

          <motion.button
            onClick={handleToggleSession}
            className="mt-8 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg flex items-center space-x-2 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-red-500"
            whileTap={{ scale: 0.95 }}
            disabled={stockTake.isScanning}
          >
            <StopCircle className="h-6 w-6" />
            <span>End Session</span>
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default ScanPage;
