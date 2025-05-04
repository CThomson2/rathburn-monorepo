import React from "react";
import { Scan, StopCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { FloatingNavBase } from "@/components/buttons/nav-base";
import { useStockTake } from "@/hooks/use-stock-take";
import { useToast } from "@/components/ui/use-toast";

interface StocktakeButtonProps {
  className?: string;
}

/**
 * A prominent action button for starting and managing stocktake scanning sessions.
 *
 * Uses the FloatingNavBase component for consistent styling with other floating buttons.
 * When active, the button appears as a rounded square instead of a circle.
 *
 * This button directly controls the stocktake session:
 * - When inactive, clicking starts a new stocktake session
 * - When active, clicking ends the current stocktake session
 */
export function StocktakeButton({ className }: StocktakeButtonProps) {
  const stockTake = useStockTake();
  const { toast } = useToast();
  const isActive = !!stockTake.currentSessionId;

  const handleToggle = async () => {
    console.log("[StocktakeButton] Toggling stock take session");
    try {
      if (isActive) {
        // End existing session
        stockTake.endStocktakeSession();
        toast({
          title: "Stock Take Ended",
          description: "Your stock take session has been ended",
        });
      } else {
        // Start new session
        await stockTake.startStocktakeSession();
        toast({
          title: "Stock Take Started",
          description: "Your stock take session is now active",
        });
      }
    } catch (error) {
      console.error("[StocktakeButton] Error toggling session:", error);
      toast({
        title: "Error",
        description: `Failed to ${isActive ? "end" : "start"} stock take session`,
        variant: "destructive",
      });
    }
  };

  return (
    <FloatingNavBase
      onClick={handleToggle}
      isActive={isActive}
      baseColor="bg-red-600"
      className={cn(
        isActive && "rounded-2xl border-2 border-red-700",
        !isActive && "border-2 border-red-700",
        stockTake.isScanning && "animate-pulse",
        className
      )}
      aria-label={
        isActive ? "End stock take session" : "Start stock take session"
      }
    >
      <div className="flex flex-col items-center justify-center">
        {isActive ? (
          <StopCircle className="h-7 w-7" />
        ) : (
          <Scan className="h-7 w-7" />
        )}
      </div>
    </FloatingNavBase>
  );
}
