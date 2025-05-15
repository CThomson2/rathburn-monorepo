import { useEffect, useMemo, useState, cloneElement } from "react";
import {
  Zap, // Production icon
  ChevronDown,
  ChevronUp,
  ScanBarcode,
  Package,
  CheckCircle2,
  XCircle,
  Settings2, // General settings/config icon for still
  Calendar, // For planned date
  FlaskConical, // For item/batch
  Info, // For status
  RefreshCw,
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
import { Badge } from "@/core/components/ui/badge";
import {
  useSessionStore,
  ProductionTask,
  // DrumDetail, // This was for transport tasks, might need a similar one for production drums
} from "@/core/stores/session-store";
import { TaskSelectionModal } from "@/features/scanner/components/task-selection-modal"; // Re-used
import { ScrollArea } from "@/core/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/core/components/ui/collapsible";
import { formatDate } from "@/core/utils/format-date";

export function ProductionView() {
  const {
    isScanning,
    startSession,
    endSession,
    currentSessionId,
    selectedProductionJobId, // Using this for the active production job
    availableProductionTasks,
    activeProductionJobDrums, // Drums assigned to the current production job/op
    sessionType,
    openTaskSelectionModal, // To open the modal for production tasks
    fetchActiveProductionJobDrums,
    scannedDrumsForCurrentTask, // Will represent drums scanned IN THIS SESSION for this job
  } = useSessionStore();

  const [isDrumListOpen, setIsDrumListOpen] = useState(false);

  const currentActiveProductionJob = useMemo(() => {
    if (!selectedProductionJobId || sessionType !== "production_task")
      return null;
    return (
      availableProductionTasks.find(
        (job) => job.job_id === selectedProductionJobId
      ) || null
    );
  }, [selectedProductionJobId, availableProductionTasks, sessionType]);

  // Fetch assigned drums when the active job changes
  useEffect(() => {
    if (currentActiveProductionJob?.job_id) {
      // We might need to pass an operation_id if scans are per-operation
      fetchActiveProductionJobDrums(currentActiveProductionJob.job_id);
    }
  }, [currentActiveProductionJob, fetchActiveProductionJobDrums]);

  // For display, merge already assigned drums (activeProductionJobDrums)
  // with those scanned just now in this PWA session (scannedDrumsForCurrentTask)
  // This is a simplified view; a more robust one might fetch all assigned drums directly.
  const displayDrums = useMemo(() => {
    if (!currentActiveProductionJob) return [];

    const sessionScannedSerials = new Set(scannedDrumsForCurrentTask);
    const combinedDrums: Array<{ serial_number: string; status: string }> = [];

    // Drums already linked (from DB, via fetchActiveProductionJobDrums)
    activeProductionJobDrums.forEach((drum) => {
      combinedDrums.push({
        serial_number: drum.serial_number,
        status: "Assigned",
      });
      sessionScannedSerials.delete(drum.serial_number); // Avoid duplication
    });

    // Drums scanned in this PWA session but maybe not yet in activeProductionJobDrums (if store updates async)
    sessionScannedSerials.forEach((serial) => {
      combinedDrums.push({
        serial_number: serial,
        status: "Scanned this session",
      });
    });
    return combinedDrums.sort((a, b) =>
      a.serial_number.localeCompare(b.serial_number)
    );
  }, [
    activeProductionJobDrums,
    scannedDrumsForCurrentTask,
    currentActiveProductionJob,
  ]);

  const estimatedTotalDrums = currentActiveProductionJob?.totalQuantity || 0;
  const processedDrumsCount = displayDrums.length; // Simplified: count of all drums associated/scanned

  return (
    <div className="container max-w-lg mx-auto p-4 space-y-4">
      <TaskSelectionModal /> {/* This modal is now multi-purpose */}
      {!currentSessionId || sessionType !== "production_task" ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <Zap className="h-12 w-12 text-muted-foreground" />
          <div className="text-center space-y-2">
            <h2 className="text-lg font-semibold">Production Operations</h2>
            <p className="text-sm text-muted-foreground">
              Select a Production Job to start assigning input drums.
            </p>
          </div>
          <Button
            onClick={() => startSession("production_task")}
            className="w-full max-w-xs"
          >
            Select Production Job
          </Button>
          {/* Optional: Button for a "Free Scan" within production context if needed */}
        </div>
      ) : currentActiveProductionJob ? (
        <div className="space-y-4">
          <Card>
            <CardHeader className="p-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>
                    Job:{" "}
                    {currentActiveProductionJob.job_id
                      .slice(0, 8)
                      .toUpperCase()}{" "}
                    - {currentActiveProductionJob.item_name}
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
            <CardContent className="p-4 pt-0 space-y-3">
              <InfoLine
                icon={<FlaskConical />}
                label="Item"
                value={currentActiveProductionJob.item_name}
              />
              <InfoLine
                icon={<Package />}
                label="Batch Code"
                value={currentActiveProductionJob.batch_code || "N/A"}
              />
              <InfoLine
                icon={<Settings2 />}
                label="Still"
                value={currentActiveProductionJob.still_code || "N/A"}
              />
              <InfoLine
                icon={<Calendar />}
                label="Planned Start"
                value={formatDate(currentActiveProductionJob.planned_start)}
              />
              <InfoLine
                icon={<Info />}
                label="Status"
                value={currentActiveProductionJob.status}
              />

              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Drum Assignment Progress:
                  </span>
                  <Badge
                    variant={
                      processedDrumsCount === estimatedTotalDrums
                        ? "default"
                        : "secondary"
                    }
                  >
                    {processedDrumsCount} / {estimatedTotalDrums} drums
                  </Badge>
                </div>
                <Progress
                  value={
                    estimatedTotalDrums > 0
                      ? (processedDrumsCount / estimatedTotalDrums) * 100
                      : 0
                  }
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-base flex items-center space-x-2">
                <ScanBarcode className="h-4 w-4" />
                <span>Drums Assigned/Scanned for this Job</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-550px)] min-h-[100px]">
                {displayDrums.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-24 text-center p-4">
                    <Package className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Scan drum barcodes to assign them to this job.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {displayDrums.map((drum, index) => (
                      <div
                        key={`${currentActiveProductionJob.job_id}-drum-${drum.serial_number}-${index}`}
                        className="flex items-center justify-between p-3"
                      >
                        <div className="flex items-center space-x-2">
                          {
                            drum.status === "Assigned" ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
                            ) // Indicates scanned this session, pending full sync
                          }
                          <span className="font-mono text-xs truncate max-w-[180px]">
                            {drum.serial_number}
                          </span>
                        </div>
                        <Badge
                          variant={
                            drum.status === "Assigned" ? "outline" : "secondary"
                          }
                          className="text-xs"
                        >
                          {drum.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <Zap className="h-12 w-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Session active, but production job details are unavailable. Try
            re-selecting the job.
          </p>
          <Button variant="outline" size="sm" onClick={endSession}>
            End Session
          </Button>
        </div>
      )}
    </div>
  );
}

// Helper for info lines
interface InfoLineProps {
  icon: React.ReactElement;
  label: string;
  value: string | number | undefined | null;
}
function InfoLine({ icon, label, value }: InfoLineProps) {
  if (value === null || value === undefined) return null;
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground flex items-center">
        {cloneElement(icon, { className: "mr-2 h-4 w-4" })}
        {label}:
      </span>
      <span className="font-medium truncate max-w-[180px]">
        {String(value)}
      </span>
    </div>
  );
}
