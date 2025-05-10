import { Scan, StopCircle } from "lucide-react";
import { cn } from "@/core/lib/utils";
import { FloatingNavBase } from "@/core/components/layout/nav-base";
import { useToast } from "@/core/components/ui/use-toast";

// Define props for controlling the stocktake button
interface StocktakeControlProps {
  currentSessionId: string | null;
  isScanning: boolean;
  lastScanMessage: string | null;
  startStocktakeSession: () => Promise<void>;
  endStocktakeSession: () => Promise<void>;
}

interface StocktakeButtonProps extends StocktakeControlProps {
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
export function StocktakeButton({
  className,
  currentSessionId,
  isScanning,
  lastScanMessage,
  startStocktakeSession,
  endStocktakeSession,
}: StocktakeButtonProps) {
  const { toast } = useToast();
  const isVisuallyActive = !!currentSessionId;

  const handleToggle = async () => {
    console.log("[StocktakeButton] Toggling stock take session");
    try {
      if (isVisuallyActive) {
        await endStocktakeSession();
        toast({
          title: "Stock Take Ended",
          description: "Your stock take session has been ended",
        });
      } else {
        await startStocktakeSession();
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
          lastScanMessage ||
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
        isScanning && "animate-pulse",
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
