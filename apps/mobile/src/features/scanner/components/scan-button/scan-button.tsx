import { Scan, StopCircle } from "lucide-react";
import { cn } from "@/core/lib/utils";
import { FloatingNavBase } from "@/core/components/layout/nav-base";
import { useStockTake } from "@/features/scanner/hooks/stocktake/use-stocktake";
import { useToast } from "@/core/components/ui/use-toast";

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
  const isVisuallyActive = !!stockTake.currentSessionId;

  const handleToggle = async () => {
    console.log("[StocktakeButton] Toggling stock take session");
    try {
      if (isVisuallyActive) {
        await stockTake.endStocktakeSession();
        toast({
          title: "Stock Take Ended",
          description: "Your stock take session has been ended",
        });
      } else {
        await stockTake.startStocktakeSession();
        toast({
          title: "Stock Take Started",
          description: "Your stock take session is now active",
        });
      }
    } catch (error) {
      console.error(
        "[StocktakeButton] Error toggling session (handled in hook)"
      );
      toast({
        title: "Error",
        description:
          stockTake.lastScanMessage ||
          `Failed to ${isVisuallyActive ? "end" : "start"} stock take session`,
        variant: "destructive",
      });
    }
  };

  return (
    <FloatingNavBase
      onClick={handleToggle}
      isActive={isVisuallyActive}
      baseColor="bg-red-600"
      className={cn(
        isVisuallyActive && "rounded-2xl border-2 border-red-700",
        !isVisuallyActive && "border-2 border-red-700",
        stockTake.isScanning && "animate-pulse",
        className
      )}
      aria-label={
        isVisuallyActive ? "End stock take session" : "Start stock take session"
      }
    >
      <div className="flex flex-col items-center justify-center">
        {isVisuallyActive ? (
          <StopCircle className="h-7 w-7" />
        ) : (
          <Scan className="h-7 w-7" />
        )}
      </div>
    </FloatingNavBase>
  );
}
