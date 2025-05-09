import React from "react";
import { motion } from "framer-motion";
import { Scan, StopCircle } from "lucide-react";
import { cn } from "@/core/lib/utils";
import { useStockTake } from "@/features/scanner/hooks/use-stocktake";
import { useToast } from "@/core/components/ui/use-toast";

// CentralStocktakeButton Component
interface CentralStocktakeButtonProps {
  isActive: boolean;
  onClick: () => void;
  isScanning: boolean;
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
 */
const CentralStocktakeButton: React.FC<CentralStocktakeButtonProps> = ({
  isActive,
  onClick,
  isScanning,
}) => {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center w-40 h-40 shadow-xl transition-all duration-300 ease-in-out",
        "text-white focus:outline-none focus:ring-4",
        isActive
          ? "bg-red-700 hover:bg-red-800 focus:ring-red-500 rounded-lg" // Square when active
          : "bg-red-600 hover:bg-red-700 focus:ring-red-400 rounded-full", // Circle when inactive
        isScanning && isActive && "animate-pulse"
      )}
      aria-label={
        isActive ? "End stock take session" : "Start stock take session"
      }
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {isActive ? (
        <StopCircle className="h-20 w-20" />
      ) : (
        <Scan className="h-20 w-20" />
      )}
    </motion.button>
  );
};

// ScanPage Component
const ScanPage = () => {
  const stockTake = useStockTake();
  const { toast } = useToast();
  const isSessionActive = !!stockTake.currentSessionId;

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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <motion.h1
        className="text-4xl font-bold mb-8 text-gray-200"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Welcome
      </motion.h1>

      <CentralStocktakeButton
        isActive={isSessionActive}
        onClick={handleToggleSession}
        isScanning={stockTake.isScanning}
      />

      <motion.p
        className="mt-8 text-xl text-gray-400"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {isSessionActive ? "Session Active" : "Start Session"}
      </motion.p>
    </div>
  );
};

export default ScanPage;
