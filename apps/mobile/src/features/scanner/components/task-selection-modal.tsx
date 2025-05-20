import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/core/components/ui/alert-dialog";
import { Progress } from "@/core/components/ui/progress";
import {
  useSessionStore,
  PurchaseOrderLineTask,
  ProductionTask,
} from "@/core/stores/session-store";
import { Badge } from "@/core/components/ui/badge";
import { ScrollArea } from "@/core/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/core/components/ui/card";
import {
  Truck,
  Package,
  ChevronRight,
  Zap,
  RefreshCw,
  X,
  MessageSquare,
  Play,
  Check,
} from "lucide-react";
import { formatDate } from "@/core/utils/format-date";
import { Textarea } from "@/core/components/ui/textarea";
import { Button } from "@/core/components/ui/button";
import { useToast } from "@/core/components/ui/use-toast";
import { createClient } from "@/core/lib/supabase/client";
import { TaskCommentsDialog } from "./task-comments-dialog";
import { Input } from "@/core/components/ui/input";

import { Database } from "@rathburn/types";
import { useScanStore } from "@/core/stores/use-scan";

type Batch = Database["inventory"]["Tables"]["batches"]["Row"];

/**
 * TODO: Add caching of tasks to avoid fetching from the database on every modal open.
 * Redis cache? SWR? React Query?
 *
 * TaskSelectionModal is a modal that allows the user to select a purchase order to start receiving drums into stock.
 * It displays a list of purchase orders with their status and a progress bar.
 * The user can select a purchase order to start receiving drums into stock.
 *
 * @returns
 */
export function TaskSelectionModal() {
  const {
    showTaskSelectionModal,
    closeTaskSelectionModal,
    availableTasks, // Use this for transport tasks from Zustand
    isFetchingTasks, // Use this for transport task loading state from Zustand
    availableProductionTasks,
    selectedTaskId,
    selectedProductionJobId,
    selectTask,
    selectProductionJob,
    confirmStartSession,
    isFetchingProductionTasks,
    fetchProductionTasks, // Keep for production tasks
    taskSelectionModalType,
    currentTaskBatchCodeInput,
    setCurrentTaskBatchCodeInput,
    createBatchForCurrentTask,
  } = useSessionStore();

  const [showCommentField, setShowCommentField] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [existingBatchCode, setExistingBatchCode] = useState<string | null>(
    null
  );
  const [isFetchingBatch, setIsFetchingBatch] = useState(false);
  const [batchCodeInput, setBatchCodeInput] = useState("");
  const [isSubmittingBatchCode, setIsSubmittingBatchCode] = useState(false);
  const { toast } = useToast();

  const { pauseScanInputTemporarily, resumeScanInputAfterPause } =
    useScanStore();

  useEffect(() => {
    // Fetch production tasks when modal is shown for production
    // The logic in openTaskSelectionModal in session-store now handles fetching transport tasks
    if (
      showTaskSelectionModal &&
      taskSelectionModalType === "production" &&
      !isFetchingProductionTasks &&
      availableProductionTasks.length === 0 // also check if list is empty
    ) {
      fetchProductionTasks();
    }
  }, [
    showTaskSelectionModal,
    taskSelectionModalType,
    fetchProductionTasks,
    isFetchingProductionTasks,
    availableProductionTasks.length,
  ]);

  // Reset comment field when modal is opened or closed
  useEffect(() => {
    if (showTaskSelectionModal) {
      setShowCommentField(false);
      setCommentText("");
      setBatchCodeInput("");
      setExistingBatchCode(null);
    }
  }, [showTaskSelectionModal]);

  const isLoading =
    taskSelectionModalType === "transport"
      ? isFetchingTasks
      : isFetchingProductionTasks;

  const tasksToDisplay =
    taskSelectionModalType === "transport"
      ? availableTasks
      : availableProductionTasks;

  const currentSelection =
    taskSelectionModalType === "transport"
      ? selectedTaskId
      : selectedProductionJobId;

  const checkForExistingBatch = async (taskId: string) => {
    setIsFetchingBatch(true);
    try {
      const supabase = createClient();
      const currentTask = availableTasks.find((t) => t.id === taskId);

      if (!currentTask) {
        throw new Error("Task not found in available tasks");
      }

      // Check if a batch already exists for this task's PO and item
      const { data: existingBatch, error: checkError } = await supabase
        .schema("inventory")
        .from("batches")
        .select("batch_id, batch_code, status")
        .eq("po_id", currentTask.po_id)
        .eq("item_id", currentTask.item_id)
        .limit(1);

      if (checkError) {
        throw checkError;
      }

      // If a batch already exists with a batch code, use it
      if (
        existingBatch &&
        existingBatch.length > 0 &&
        existingBatch[0].batch_code
      ) {
        setExistingBatchCode(existingBatch[0].batch_code);
        return true;
      }

      // No existing batch with a batch code
      setExistingBatchCode(null);
      return false;
    } catch (error) {
      console.error("Error checking for existing batch:", error);
      toast({
        title: "Error",
        description:
          "Failed to check existing batch information. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsFetchingBatch(false);
    }
  };

  const handleTaskSelect = async (id: string) => {
    if (taskSelectionModalType === "transport") {
      selectTask(id);
      if (currentSelection !== id) {
        // Only check for existing batch if selecting a different task
        await checkForExistingBatch(id);
      }
    } else if (taskSelectionModalType === "production") {
      selectProductionJob(id);
    }
  };

  const handleStartSessionClick = () => {
    if (taskSelectionModalType === "production") {
      console.log(
        "Starting production session with modal type:",
        taskSelectionModalType,
        "Selected job ID:",
        selectedProductionJobId
      );
      // Add a check to ensure we have a selected production job
      if (!selectedProductionJobId) {
        toast({
          title: "No production job selected",
          description:
            "Please select a production job before starting a session",
          variant: "destructive",
        });
        return;
      }
      confirmStartSession();
    } else if (taskSelectionModalType === "transport") {
      if (existingBatchCode) {
        // If we have an existing batch code, just start the session
        confirmStartSession();
      } else {
        // This should never happen as we now control batch code input in the modal
        closeTaskSelectionModal();
      }
    }
  };

  const handleShowCommentField = () => {
    setShowCommentField(true);
  };

  const handleBatchCodeSubmit = async () => {
    if (!batchCodeInput.trim()) {
      toast({
        title: "Empty batch code",
        description: "Please enter a batch code before submitting",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingBatchCode(true);

    try {
      // Set the current batch code input in the session store
      setCurrentTaskBatchCodeInput(batchCodeInput);

      // Call the existing session store function to create a batch
      const result = await createBatchForCurrentTask(batchCodeInput.trim());

      if (result.success) {
        toast({
          title: "Batch code saved",
          description: `Batch code ${batchCodeInput} has been saved successfully.`,
        });
        setExistingBatchCode(batchCodeInput);
        setBatchCodeInput("");
      } else {
        throw new Error(result.error || "Failed to create batch");
      }
    } catch (error) {
      console.error("Error submitting batch code:", error);
      toast({
        title: "Failed to save batch code",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingBatchCode(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) {
      toast({
        title: "Empty comment",
        description: "Please enter a comment before submitting",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingComment(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Only proceed if we have a valid task type
      if (!taskSelectionModalType) {
        throw new Error("No task type selected");
      }

      // Create the comment data object with required fields
      const commentData = {
        user_id: user.id,
        comment: commentText,
        ...(taskSelectionModalType === "transport"
          ? { pol_id: selectedTaskId }
          : { job_id: selectedProductionJobId }),
      };

      const { error } = await supabase
        .from("task_comments")
        .insert(commentData);

      if (error) throw error;

      toast({
        title: "Comment saved",
        description: "Your comment has been saved successfully",
      });

      setCommentText("");
      setShowCommentField(false);
      resumeScanInputAfterPause();
    } catch (error) {
      console.error("Error saving comment:", error);
      toast({
        title: "Failed to save comment",
        description:
          "There was an error saving your comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const title =
    taskSelectionModalType === "transport"
      ? "Select Transport Task"
      : "Select Production Job";
  const description =
    taskSelectionModalType === "transport"
      ? "Choose a purchase order line to start receiving drums."
      : "Choose a scheduled production job to start assigning drums.";

  return (
    <AlertDialog
      open={showTaskSelectionModal}
      onOpenChange={(isOpen) => {
        if (!isOpen) closeTaskSelectionModal();
      }}
    >
      <AlertDialogContent className="sm:max-w-md flex flex-col h-[calc(100vh-80px)] max-h-[700px]">
        <AlertDialogHeader className="flex-shrink-0">
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
          <X
            onClick={closeTaskSelectionModal}
            className="absolute top-4 right-6 cursor-pointer"
          />
        </AlertDialogHeader>

        <ScrollArea className="flex-grow h-full w-full pr-4 my-4 min-h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <RefreshCw className="animate-spin rounded-full h-8 w-8 text-primary" />
            </div>
          ) : tasksToDisplay.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <Package className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {taskSelectionModalType === "transport"
                  ? "No pending purchase order lines found."
                  : "No schedulable production jobs found."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasksToDisplay.map((task) => {
                const isSelected =
                  currentSelection ===
                  (taskSelectionModalType === "transport"
                    ? (task as PurchaseOrderLineTask).id
                    : (task as ProductionTask).job_id);
                const id =
                  taskSelectionModalType === "transport"
                    ? (task as PurchaseOrderLineTask).id
                    : (task as ProductionTask).job_id;

                const taskName =
                  taskSelectionModalType === "transport"
                    ? `PO #${(task as PurchaseOrderLineTask).poNumber}`
                    : `Job: ${(task as ProductionTask).job_id.slice(0, 8).toUpperCase()}`;

                return (
                  <Card
                    key={id}
                    className={`cursor-pointer transition-all hover:bg-accent active:scale-[0.98] ${
                      isSelected
                        ? "border-primary ring-2 ring-primary shadow-lg"
                        : "border-border"
                    }`}
                    onClick={() => handleTaskSelect(id)}
                  >
                    {taskSelectionModalType === "transport" ? (
                      <TransportTaskCardContent
                        task={task as PurchaseOrderLineTask}
                      />
                    ) : (
                      <ProductionTaskCardContent
                        task={task as ProductionTask}
                      />
                    )}

                    {isSelected && (
                      <CardFooter className="p-3 pt-0 flex-col space-y-2 border-t mt-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        {showCommentField ? (
                          <>
                            <Textarea
                              placeholder="Enter your comment about this task..."
                              className="w-full min-h-[80px]"
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              onFocus={pauseScanInputTemporarily}
                              onBlur={resumeScanInputAfterPause}
                            />
                            <div className="flex w-full justify-between space-x-2">
                              <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => {
                                  setShowCommentField(false);
                                  resumeScanInputAfterPause();
                                }}
                                disabled={isSubmittingComment}
                              >
                                Cancel
                              </Button>
                              <Button
                                className="flex-1"
                                onClick={handleSubmitComment}
                                disabled={isSubmittingComment}
                              >
                                {isSubmittingComment
                                  ? "Saving..."
                                  : "Save Comment"}
                              </Button>
                            </div>
                          </>
                        ) : (
                          <>
                            {taskSelectionModalType === "transport" &&
                            isFetchingBatch ? (
                              // Show loading spinner while checking for existing batch
                              <div className="flex justify-center py-2">
                                <RefreshCw className="animate-spin h-5 w-5 text-primary" />
                              </div>
                            ) : taskSelectionModalType === "transport" &&
                              !existingBatchCode ? (
                              // Show batch code input if no existing batch is found
                              <>
                                <div className="text-sm font-medium mb-1">
                                  Enter Batch Code
                                </div>
                                <div className="flex w-full space-x-2">
                                  <Input
                                    placeholder="Supplier batch code"
                                    value={batchCodeInput}
                                    onChange={(e) =>
                                      setBatchCodeInput(e.target.value)
                                    }
                                    className="flex-1"
                                    onFocus={pauseScanInputTemporarily}
                                    onBlur={resumeScanInputAfterPause}
                                  />
                                  <Button
                                    onClick={handleBatchCodeSubmit}
                                    disabled={
                                      !batchCodeInput.trim() ||
                                      isSubmittingBatchCode
                                    }
                                    className="whitespace-nowrap"
                                  >
                                    {isSubmittingBatchCode ? (
                                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                      <Check className="h-4 w-4 mr-2" />
                                    )}
                                    Save
                                  </Button>
                                </div>
                              </>
                            ) : (
                              // Show comment/start buttons if batch exists or for production tasks
                              <div className="flex w-full space-x-2">
                                <Button
                                  variant="outline"
                                  className="flex-1 justify-start"
                                  onClick={() => {
                                    setShowCommentField(true);
                                    pauseScanInputTemporarily();
                                  }}
                                >
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Comment
                                </Button>

                                <Button
                                  variant="default"
                                  className="flex-1 justify-start bg-green-600 hover:bg-green-700 text-black"
                                  onClick={handleStartSessionClick}
                                >
                                  <Play className="h-4 w-4 mr-2" />
                                  Start
                                </Button>
                              </div>
                            )}

                            {/* Always show batch code if it exists */}
                            {taskSelectionModalType === "transport" &&
                              existingBatchCode && (
                                <div className="w-full text-xs text-muted-foreground pt-2">
                                  Batch Code:{" "}
                                  <span className="font-medium">
                                    {existingBatchCode}
                                  </span>
                                </div>
                              )}

                            <div className="w-full pt-2">
                              {taskSelectionModalType && (
                                <TaskCommentsDialog
                                  taskType={taskSelectionModalType}
                                  taskId={id}
                                  taskName={taskName}
                                />
                              )}
                            </div>
                          </>
                        )}
                      </CardFooter>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {!currentSelection && (
          <AlertDialogFooter className="flex-shrink-0 pt-4 border-t">
            <AlertDialogCancel onClick={closeTaskSelectionModal}>
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Helper component for Transport Task Card Content
function TransportTaskCardContent({ task }: { task: PurchaseOrderLineTask }) {
  return (
    <>
      <CardHeader className="p-3">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Truck className="h-4 w-4 text-muted-foreground" />
            <span>PO #{task.poNumber}</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 text-xs">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Supplier:</span>
            <span className="font-medium truncate max-w-[150px]">
              {task.supplier}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Item:</span>
            <span className="font-medium truncate max-w-[150px]">
              {task.item}
            </span>
          </div>
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Progress:</span>
              <Badge
                variant={
                  task.receivedQuantity === task.totalQuantity
                    ? "default"
                    : "secondary"
                }
                className="text-xs"
              >
                {task.receivedQuantity} / {task.totalQuantity} drums
              </Badge>
            </div>
            <Progress
              value={(task.receivedQuantity / task.totalQuantity) * 100}
              className="h-1.5"
            />
          </div>
        </div>
      </CardContent>
    </>
  );
}

// Helper component for Production Task Card Content
function ProductionTaskCardContent({ task }: { task: ProductionTask }) {
  return (
    <>
      <CardHeader className="p-3">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 text-muted-foreground" />
            <span>Job: {task.job_id.slice(0, 8).toUpperCase()}</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 text-xs">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Item:</span>
            <span className="font-medium truncate max-w-[150px]">
              {task.item_name}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Batch:</span>
            <span className="font-medium truncate max-w-[150px]">
              {task.batch_code || "N/A"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Still:</span>
            <span className="font-medium">{task.still_code || "N/A"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Planned:</span>
            <span className="font-medium">
              {formatDate(task.planned_start)}
            </span>
          </div>
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Est. Drums:</span>
              <Badge variant="secondary" className="text-xs">
                {task.totalQuantity || 0} drums ({task.raw_volume || 0}L)
              </Badge>
            </div>
            {/* Progress for production can be added later based on assigned drums vs totalQuantity */}
            {/* <Progress value={(task.processedQuantity / task.totalQuantity) * 100} className="h-1.5" /> */}
          </div>
        </div>
      </CardContent>
    </>
  );
}
