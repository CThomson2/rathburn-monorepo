import { useEffect, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Calendar,
  Users,
  MapPin,
  RefreshCw,
  X,
  ChevronRight,
  ScanBarcode,
  Truck,
  Package,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/core/components/ui/card";
import { Button } from "@/core/components/ui/button";
import { Progress } from "@/core/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/core/components/ui/alert-dialog";
import { Badge } from "@/core/components/ui/badge";
import {
  useSessionStore,
  PurchaseOrderLineTask,
} from "@/core/stores/session-store";
import { TaskSelectionModal } from "@/features/scanner/components/task-selection-modal";
import { ScrollArea } from "@/core/components/ui/scroll-area";

/**
 * Transport view that displays goods in transport
 * Extracted from the original Index component
 */
export function TransportView() {
  const {
    isScanning,
    startSession,
    endSession,
    currentSessionId,
    currentSessionTaskId,
    availableTasks,
    scannedDrumsForCurrentTask,
  } = useSessionStore();

  const currentActiveTaskDetails = useMemo(() => {
    if (!currentSessionTaskId) return null;
    return (
      availableTasks.find((task) => task.id === currentSessionTaskId) || null
    );
  }, [currentSessionTaskId, availableTasks]);

  return (
    <div className="container max-w-lg mx-auto p-4 space-y-4">
      <TaskSelectionModal />

      {!currentSessionId && (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <Truck className="h-12 w-12 text-muted-foreground" />
          <div className="text-center space-y-2">
            <h2 className="text-lg font-semibold">Start Goods In Session</h2>
            <p className="text-sm text-muted-foreground">
              Select a Purchase Order Line to start receiving drums.
            </p>
          </div>
          <Button onClick={startSession} className="w-full max-w-xs">
            Select Task
          </Button>
        </div>
      )}

      {currentSessionId && currentActiveTaskDetails && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="p-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Truck className="h-5 w-5" />
                  <span>
                    PO #{currentActiveTaskDetails.poNumber} - Item:{" "}
                    {currentActiveTaskDetails.item}
                  </span>
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={endSession}
                  disabled={isScanning && !currentSessionId}
                >
                  End Session
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Supplier:</span>
                  <span className="font-medium">
                    {currentActiveTaskDetails.supplier}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress:</span>
                    <Badge
                      variant={
                        scannedDrumsForCurrentTask.length ===
                        currentActiveTaskDetails.totalQuantity
                          ? "default"
                          : "secondary"
                      }
                    >
                      {scannedDrumsForCurrentTask.length} /{" "}
                      {currentActiveTaskDetails.totalQuantity} drums
                    </Badge>
                  </div>
                  <Progress
                    value={
                      (scannedDrumsForCurrentTask.length /
                        currentActiveTaskDetails.totalQuantity) *
                      100
                    }
                    className="h-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-base flex items-center space-x-2">
                <ScanBarcode className="h-4 w-4" />
                <span>Scanned Drums for this Task</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-450px)] min-h-[200px]">
                {scannedDrumsForCurrentTask.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-center p-4">
                    <Package className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No drums scanned for this task yet. Active scanning input
                      below.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {scannedDrumsForCurrentTask.map((serialNumber, index) => (
                      <div
                        key={`${currentActiveTaskDetails.id}-${serialNumber}-${index}`}
                        className="flex items-center justify-between p-4"
                      >
                        <div className="flex items-center space-x-3">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="font-mono text-sm">
                            {serialNumber}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          #{index + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}

      {currentSessionId && !currentActiveTaskDetails && (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <Package className="h-12 w-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Session active, but task details are unavailable. Please check logs
            or try ending and restarting the session.
          </p>
          <Button variant="outline" size="sm" onClick={endSession}>
            End Session
          </Button>
        </div>
      )}
    </div>
  );
}
