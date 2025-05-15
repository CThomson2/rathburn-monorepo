import { useEffect } from "react";
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
} from "@/core/components/ui/card";
import { Truck, Package, ChevronRight, Zap, RefreshCw } from "lucide-react";
import { formatDate } from "@/core/utils/format-date";

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
  } = useSessionStore();

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

  const handleTaskSelect = (id: string) => {
    if (taskSelectionModalType === "transport") {
      selectTask(id);
    } else if (taskSelectionModalType === "production") {
      selectProductionJob(id);
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
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <AlertDialogFooter className="flex-shrink-0 pt-4 border-t">
          <AlertDialogCancel onClick={closeTaskSelectionModal}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => confirmStartSession()}
            disabled={!currentSelection || isLoading}
          >
            Start Session
          </AlertDialogAction>
        </AlertDialogFooter>
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
