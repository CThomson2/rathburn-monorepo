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
import { Button } from "@/core/components/ui/button";
import { Progress } from "@/core/components/ui/progress";
import { useSessionStore } from "@/core/stores/session-store";
import { Badge } from "@/core/components/ui/badge";
import { ScrollArea } from "@/core/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/core/components/ui/card";
import { Truck, Package, ChevronRight } from "lucide-react";

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
  // Get relevant state and actions from the session store
  const {
    showTaskSelectionModal,
    closeTaskSelectionModal,
    availableTasks,
    selectedTaskId,
    selectTask,
    confirmStartSession,
    isFetchingTasks,
    fetchPurchaseOrderTasks,
  } = useSessionStore();

  // Fetch tasks when modal opens
  useEffect(() => {
    if (showTaskSelectionModal) {
      fetchPurchaseOrderTasks();
    }
  }, [showTaskSelectionModal, fetchPurchaseOrderTasks]);

  return (
    <AlertDialog
      open={showTaskSelectionModal}
      onOpenChange={closeTaskSelectionModal}
    >
      <AlertDialogContent className="sm:max-w-[425px] flex flex-col h-[calc(100vh-80px)] max-h-[600px]">
        <AlertDialogHeader className="flex-shrink-0">
          <AlertDialogTitle>Select Transport Task</AlertDialogTitle>
          <AlertDialogDescription>
            Choose a purchase order to start receiving drums into stock.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ScrollArea className="flex-grow h-full w-full pr-4 my-4 min-h-[200px]">
          {isFetchingTasks ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : availableTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <Package className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No pending purchase orders found.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableTasks.map((task) => (
                <Card
                  key={task.id}
                  className={`cursor-pointer transition-colors hover:bg-accent ${
                    selectedTaskId === task.id ? "border-primary" : ""
                  }`}
                  onClick={() => selectTask(task.id)}
                >
                  <CardHeader className="p-4">
                    <CardTitle className="text-base flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Truck className="h-4 w-4" />
                        <span>PO #{task.poNumber}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Supplier:</span>
                        <span className="font-medium">{task.supplier}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Item:</span>
                        <span className="font-medium">{task.item}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Progress:
                          </span>
                          <Badge
                            variant={
                              task.receivedQuantity === task.totalQuantity
                                ? "default"
                                : "secondary"
                            }
                          >
                            {task.receivedQuantity} / {task.totalQuantity} drums
                          </Badge>
                        </div>
                        <Progress
                          value={
                            (task.receivedQuantity / task.totalQuantity) * 100
                          }
                          className="h-2"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        <AlertDialogFooter className="flex-shrink-0">
          <AlertDialogCancel onClick={closeTaskSelectionModal}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmStartSession}
            disabled={!selectedTaskId || isFetchingTasks}
          >
            Start Session
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
