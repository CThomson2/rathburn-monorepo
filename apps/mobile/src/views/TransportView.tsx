import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  MessageCircle,
  RefreshCw,
  ScanBarcode,
  Truck,
  Package,
  CheckCircle2,
  XCircle,
  FileScan,
  BookText,
  Send,
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
import { Textarea } from "@/core/components/ui/textarea";
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
import { useComments } from "@/features/scanner/hooks/use-comments";
import { useScanStore } from "@/core/stores/use-scan";
import { formatDistance } from "date-fns";

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
    isCurrentTaskBatchCodeSubmitted,
    lastScanMessage,
    lastScanStatus,
    selectedTaskId,
    isCheckingBatchCode,
  } = useSessionStore();

  const [isDrumListOpen, setIsDrumListOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [showCommentInput, setShowCommentInput] = useState(false);

  // Get the active task ID, whether in session or selected
  const activeTaskId = currentSessionId ? currentSessionTaskId : selectedTaskId;

  // Only call useComments when we have an active task ID
  const {
    comments,
    isLoading: isLoadingComments,
    isSubmitting: isSubmittingComment,
    submitComment,
    refreshComments,
  } = useComments({
    taskType: "transport",
    taskId: activeTaskId,
  });

  const { pauseScanInputTemporarily, resumeScanInputAfterPause } =
    useScanStore();

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

  useEffect(() => {
    console.log("[TransportView Scan] Scanning state changed:", {
      isScanning,
      currentSessionId,
    });
  }, [isScanning, currentSessionId]);

  // TODO: The active task details **are not resetting to null** when ending a session, or even switching views
  // Only by beginning a new session does this state reset.
  // Is this due to memoization?
  const currentActiveTaskDetails = useMemo(() => {
    const taskIdToUse = currentSessionId
      ? currentSessionTaskId
      : selectedTaskId;
    if (!taskIdToUse) return null;
    const task = availableTasks.find((task) => task.id === taskIdToUse) || null;
    return task;
  }, [currentSessionTaskId, selectedTaskId, availableTasks, currentSessionId]);

  // Add debugging info to see exactly what's happening with these UI conditions
  const showTaskSelection =
    !currentSessionId && !selectedTaskId && !isCheckingBatchCode;
  const showScanningInterface =
    currentSessionId &&
    sessionType === "task" &&
    currentActiveTaskDetails &&
    isCurrentTaskBatchCodeSubmitted &&
    !isCheckingBatchCode;
  const showFreeScanInterface =
    currentSessionId && sessionType === "free_scan" && !isCheckingBatchCode;
  const showTaskDetailsUnavailable =
    currentSessionId &&
    sessionType === "task" &&
    !currentActiveTaskDetails &&
    isCurrentTaskBatchCodeSubmitted &&
    !isCheckingBatchCode;

  useEffect(() => {
    console.log("[TransportView] Rendering with UI states:", {
      showTaskSelection,
      showScanningInterface,
      showFreeScanInterface,
      showTaskDetailsUnavailable,
      currentActiveTaskDetails,
      currentSessionId,
      sessionType,
      selectedTaskId,
      isCurrentTaskBatchCodeSubmitted,
      isCheckingBatchCode,
    });
  }, [
    showTaskSelection,
    showScanningInterface,
    showFreeScanInterface,
    showTaskDetailsUnavailable,
    currentActiveTaskDetails,
    currentSessionId,
    sessionType,
    selectedTaskId,
    isCurrentTaskBatchCodeSubmitted,
    isCheckingBatchCode,
  ]);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    const result = await submitComment(newComment.trim());
    if (result.success) {
      setNewComment("");
      setShowCommentInput(false);
      resumeScanInputAfterPause();
    }
  };

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
          {/* <Button
            variant="outline"
            onClick={() => startSession("free_scan")}
            className="w-full max-w-xs"
          >
            <FileScan className="mr-2 h-4 w-4" />
            Start Free Scan
          </Button> */}
        </div>
      )}

      {isCheckingBatchCode && (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <RefreshCw className="h-12 w-12 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">
            Checking batch information...
          </p>
        </div>
      )}

      {showScanningInterface && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="p-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Truck className="h-5 w-5" />
                  <span>PO #{currentActiveTaskDetails.poNumber}</span>
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

          {/* Comments for task */}
          <Card>
            <CardHeader className="p-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base flex items-center space-x-2">
                  <MessageCircle className="h-4 w-4" />
                  <span>Comments</span>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    refreshComments();
                    setShowCommentInput(!showCommentInput);
                    if (!showCommentInput) {
                      pauseScanInputTemporarily();
                    } else {
                      resumeScanInputAfterPause();
                    }
                  }}
                >
                  {showCommentInput ? "Cancel" : "Add Comment"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {showCommentInput && (
                <div className="mb-4 space-y-2">
                  <Textarea
                    placeholder="Add your comment here..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[80px] w-full"
                    disabled={isSubmittingComment}
                    onFocus={pauseScanInputTemporarily}
                  />
                  <Button
                    onClick={handleSubmitComment}
                    className="w-full"
                    disabled={!newComment.trim() || isSubmittingComment}
                  >
                    {isSubmittingComment ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Submit Comment
                  </Button>
                </div>
              )}

              {isLoadingComments ? (
                <div className="flex justify-center py-4">
                  <RefreshCw className="animate-spin h-5 w-5 text-primary" />
                </div>
              ) : comments && comments.length > 0 ? (
                <ScrollArea className="h-[200px] pr-4">
                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="border rounded-lg p-3 text-sm"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-medium">
                            {/* Can replace with user info if available */}
                            {comment.username}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistance(
                              new Date(comment.created_at),
                              new Date(),
                              { addSuffix: true }
                            )}
                          </span>
                        </div>
                        <p className="text-sm">{comment.comment}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No comments yet</p>
                </div>
              )}
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
