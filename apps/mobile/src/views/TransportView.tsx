import { useEffect, useMemo, useState } from "react";
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
  FileScan,
  BookText,
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
import { Input } from "@/core/components/ui/input";
import {
  useSessionStore,
  PurchaseOrderLineTask,
  DrumDetail,
} from "@/core/stores/session-store";
import { TaskSelectionModal } from "@/features/scanner/components/task-selection-modal";
import { ScrollArea } from "@/core/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/core/components/ui/collapsible";

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
    activeTaskDrumDetails,
    sessionType,
    currentTaskBatchCodeInput,
    isCurrentTaskBatchCodeSubmitted,
    setCurrentTaskBatchCodeInput,
    createBatchForCurrentTask,
    lastScanMessage,
    lastScanStatus,
    selectedTaskId,
  } = useSessionStore();

  const [isDrumListOpen, setIsDrumListOpen] = useState(false);
  const [isSubmittingBatchCode, setIsSubmittingBatchCode] = useState(false);

  useEffect(() => {
    console.log("[TransportView] Relevant state changed:", {
      currentSessionId,
      sessionType,
      currentSessionTaskId,
      selectedTaskId,
      isCurrentTaskBatchCodeSubmitted,
      lastScanMessage,
      lastScanStatus,
    });
  }, [
    currentSessionId,
    sessionType,
    currentSessionTaskId,
    selectedTaskId,
    isCurrentTaskBatchCodeSubmitted,
    lastScanMessage,
    lastScanStatus,
  ]);

  const currentActiveTaskDetails = useMemo(() => {
    const taskIdToUse = currentSessionId
      ? currentSessionTaskId
      : selectedTaskId;
    if (!taskIdToUse) return null;
    const task = availableTasks.find((task) => task.id === taskIdToUse) || null;
    return task;
  }, [currentSessionTaskId, selectedTaskId, availableTasks, currentSessionId]);

  const handleBatchCodeSubmit = async () => {
    console.log(
      "[TransportView] handleBatchCodeSubmit called. Batch Code:",
      currentTaskBatchCodeInput
    );
    if (!currentTaskBatchCodeInput.trim()) {
      useSessionStore.setState({
        lastScanStatus: "error",
        lastScanMessage: "Batch code cannot be empty.",
      });
      return;
    }
    setIsSubmittingBatchCode(true);
    console.log("[TransportView] Calling createBatchForCurrentTask...");
    const result = await createBatchForCurrentTask(
      currentTaskBatchCodeInput.trim()
    );
    console.log("[TransportView] createBatchForCurrentTask result:", result);
    if (!result.success) {
      console.error("[TransportView] Failed to create batch:", result.error);
    }
    setIsSubmittingBatchCode(false);
  };

  const showTaskSelection = !currentSessionId && !selectedTaskId;
  const showBatchCodeInput =
    !currentSessionId &&
    sessionType === "task" &&
    selectedTaskId &&
    !isCurrentTaskBatchCodeSubmitted;
  const showScanningInterface =
    currentSessionId &&
    sessionType === "task" &&
    currentActiveTaskDetails &&
    isCurrentTaskBatchCodeSubmitted;
  const showFreeScanInterface = currentSessionId && sessionType === "free_scan";
  const showTaskDetailsUnavailable =
    currentSessionId &&
    sessionType === "task" &&
    !currentActiveTaskDetails &&
    isCurrentTaskBatchCodeSubmitted;

  console.log("[TransportView] Rendering with UI states:", {
    showTaskSelection,
    showBatchCodeInput,
    showScanningInterface,
    showFreeScanInterface,
    showTaskDetailsUnavailable,
    currentActiveTaskDetails,
  });

  return (
    <div className="container max-w-lg mx-auto p-4 space-y-4">
      <TaskSelectionModal />

      {showTaskSelection && (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <Truck className="h-12 w-12 text-muted-foreground" />
          <div className="text-center space-y-2">
            <h2 className="text-lg font-semibold">Start Goods In Session</h2>
            <p className="text-sm text-muted-foreground">
              Select a Purchase Order Line to start receiving drums.
            </p>
          </div>
          <Button
            onClick={() => startSession("task")}
            className="w-full max-w-xs"
          >
            Select Task
          </Button>
          <Button
            variant="outline"
            onClick={() => startSession("free_scan")}
            className="w-full max-w-xs"
          >
            <FileScan className="mr-2 h-4 w-4" />
            Start Free Scan
          </Button>
        </div>
      )}

      {showBatchCodeInput && currentActiveTaskDetails && (
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-lg flex items-center space-x-2">
              <BookText className="h-5 w-5" />
              <span>
                Enter Batch Code for PO #{currentActiveTaskDetails.poNumber}
              </span>
            </CardTitle>
            <CardDescription>
              Item: {currentActiveTaskDetails.item}. Please enter the supplier's
              batch code found on the drum labels.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <Input
              placeholder="Enter Batch Code"
              value={currentTaskBatchCodeInput}
              onChange={(e) => setCurrentTaskBatchCodeInput(e.target.value)}
              disabled={isSubmittingBatchCode}
            />
            {lastScanStatus === "error" && lastScanMessage && (
              <p className="text-sm text-red-500 dark:text-red-400">
                {lastScanMessage}
              </p>
            )}
          </CardContent>
          <CardFooter className="p-4 flex flex-col space-y-2">
            <Button
              onClick={handleBatchCodeSubmit}
              disabled={
                isSubmittingBatchCode || !currentTaskBatchCodeInput.trim()
              }
              className="w-full"
            >
              {isSubmittingBatchCode
                ? "Submitting..."
                : "Submit Batch Code & Start Session"}
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                useSessionStore.setState({
                  selectedTaskId: null,
                  sessionType: null,
                  currentTaskBatchCodeInput: "",
                  isCurrentTaskBatchCodeSubmitted: false,
                  currentBatchTableId: null,
                })
              }
              className="w-full"
              disabled={isSubmittingBatchCode}
            >
              Cancel
            </Button>
          </CardFooter>
        </Card>
      )}

      {showScanningInterface && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="p-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Truck className="h-5 w-5" />
                  <span>
                    PO #{currentActiveTaskDetails.poNumber} - Batch:{" "}
                    {currentTaskBatchCodeInput}
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
              <CardDescription>
                Item: {currentActiveTaskDetails.item}
              </CardDescription>
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
                        currentActiveTaskDetails.receivedQuantity ===
                        currentActiveTaskDetails.totalQuantity
                          ? "default"
                          : "secondary"
                      }
                    >
                      {currentActiveTaskDetails.receivedQuantity} /{" "}
                      {currentActiveTaskDetails.totalQuantity} drums
                    </Badge>
                  </div>
                  <Progress
                    value={
                      currentActiveTaskDetails.totalQuantity > 0
                        ? (currentActiveTaskDetails.receivedQuantity /
                            currentActiveTaskDetails.totalQuantity) *
                          100
                        : 0
                    }
                    className="h-2"
                  />
                </div>
              </div>

              <Collapsible
                open={isDrumListOpen}
                onOpenChange={setIsDrumListOpen}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between px-0 hover:bg-transparent"
                  >
                    <span>Show Drums ({activeTaskDrumDetails.length})</span>
                    {isDrumListOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <ScrollArea className="h-[150px] border rounded-md p-2">
                    {activeTaskDrumDetails.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No drums associated with this task line yet.
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {activeTaskDrumDetails.map((drum: DrumDetail) => (
                          <Badge
                            key={drum.pod_id}
                            variant={
                              drum.is_received ||
                              (drum.serial_number !== null &&
                                scannedDrumsForCurrentTask.includes(
                                  drum.serial_number
                                ))
                                ? "default"
                                : "outline"
                            }
                            className={`w-full justify-start truncate ${
                              drum.is_received ||
                              (drum.serial_number !== null &&
                                scannedDrumsForCurrentTask.includes(
                                  drum.serial_number
                                ))
                                ? "bg-green-100 text-green-700 border-green-300 dark:bg-green-700 dark:text-white dark:border-green-500"
                                : "bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                            }`}
                          >
                            {drum.serial_number}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-base flex items-center space-x-2">
                <ScanBarcode className="h-4 w-4" />
                <span>Drums Scanned This Session</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-600px)] min-h-[100px]">
                {scannedDrumsForCurrentTask.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-24 text-center p-4">
                    <Package className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Scan barcodes to receive drums.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {scannedDrumsForCurrentTask.map((serialNumber, index) => (
                      <div
                        key={`${currentActiveTaskDetails?.id}-scanned-${serialNumber}-${index}`}
                        className="flex items-center justify-between p-3"
                      >
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="font-mono text-xs">
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

      {showFreeScanInterface && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="p-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <FileScan className="h-5 w-5" />
                  <span>Free Scanning Session</span>
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
              <p className="text-sm text-muted-foreground">
                You are in a free scanning session. All scanned barcodes will be
                recorded without linking to a specific task.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-base flex items-center space-x-2">
                <ScanBarcode className="h-4 w-4" />
                <span>Barcodes Scanned This Session</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-450px)] min-h-[100px]">
                {scannedDrumsForCurrentTask.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-24 text-center p-4">
                    <Package className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Scan any barcode to record it.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {scannedDrumsForCurrentTask.map((serialNumber, index) => (
                      <div
                        key={`free-scan-${currentSessionId}-${serialNumber}-${index}`}
                        className="flex items-center justify-between p-3"
                      >
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="font-mono text-xs">
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

      {showTaskDetailsUnavailable && (
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
