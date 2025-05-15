import { Scan, StopCircle } from "lucide-react";
import { cn } from "@/core/lib/utils";
import { FloatingNavBase } from "@/core/components/layout/nav-base";
import { useToast } from "@/core/components/ui/use-toast";
import { useSessionStore } from "@/core/stores/session-store";

interface ScanButtonProps {
  className?: string;
}

/**
 * A prominent action button for starting and managing stocktake scanning sessions.
 *
 * Uses the FloatingNavBase component for consistent styling with other floating buttons.
 * When active, the button appears as a rounded square instead of a circle.
 *
 * This button directly controls the stocktake session by using the Zustand store.
 */
export function ScanButton({ className }: ScanButtonProps) {
  const { toast } = useToast();

  const {
    currentSessionId,
    isScanning,
    lastScanMessage,
    startSession,
    endSession,
  } = useSessionStore();

  const isVisuallyActive = !!currentSessionId;

  const handleToggle = async () => {
    console.log("[ScanButton] Toggling stock take session via Zustand...");
    try {
      if (isVisuallyActive) {
        await endSession();
        toast({
          title: "Session Ended",
          description: "Session end initiated.",
        });
      } else {
        await startSession("free_scan");
        toast({
          title: "Session Started",
          description: "Session start initiated.",
        });
      }
    } catch (error) {
      console.error(
        "[ScanButton] Error toggling session (error should be in store state):",
        error
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
