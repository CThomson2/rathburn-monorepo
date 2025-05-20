import { fetchProductionJobById } from "@/app/actions/production";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { notFound } from "next/navigation";
import {
  Briefcase, // For Job ID
  CalendarDays,
  CheckCircle,
  Clock,
  Layers, // For Item Name
  ListChecks, // For Tasks/Operations
  Package, // For Batch Code
  Thermometer, // For Still
  TrendingUp, // For Priority
  Users, // For Supplier (if shown)
  Zap, // For Status
  MoreHorizontal, // For generic details icon
  FileText, // For notes or generic info
} from "lucide-react";
import { OrderStatus, Order as JobOrder } from "@/features/production/types"; // Use the aliased import if needed
import { Progress } from "@/components/ui/progress"; // Assuming you have this
import { Separator } from "@/components/ui/separator";
import { formatDate, formatDateTime } from "@/utils/format-date";
import { cn } from "@/lib/utils";

interface JobDetailsPageProps {
  params: {
    "job-id": string;
  };
}

// Helper to get badge variant based on operation status (can be expanded)
function getOperationStatusVariant(
  status: string | undefined
): "default" | "secondary" | "destructive" | "outline" {
  switch (status?.toLowerCase()) {
    case "completed":
      return "default";
    case "in_progress":
    case "active":
      return "outline";
    case "pending":
    case "scheduled":
      return "secondary";
    case "error":
    case "failed":
      return "destructive";
    default:
      return "secondary";
  }
}

// Helper for overall job status badge
function getJobStatusBadgeVariant(
  status: OrderStatus | undefined
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "complete":
      return "default";
    case "distillation": // Represents in_progress for the main job
    case "qc": // QC is also an active phase
      return "outline";
    case "preparing": // Represents scheduled/pending
      return "secondary";
    case "error":
      return "destructive";
    default:
      return "secondary";
  }
}

interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number | undefined | null;
  valueClassName?: string;
}

function InfoItem({ icon, label, value, valueClassName }: InfoItemProps) {
  if (value === null || value === undefined || String(value).trim() === "")
    return null;
  return (
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0 text-muted-foreground pt-1">{icon}</div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p
          className={cn(
            "text-md font-semibold text-foreground",
            valueClassName
          )}
        >
          {String(value)}
        </p>
      </div>
    </div>
  );
}

/**
 * Page component for displaying a production job's details.
 *
 * Fetches the specific job with the given ID from the database and displays
 * its details, including the item name, supplier, scheduled date, priority,
 * and progress. Also displays specific details for the distillation operation
 * if available. If the job is not found, will serve a 404 page.
 *
 * @param {object} params - Page parameters, including the job ID.
 * @param {string} params.job-id - The ID of the production job to display.
 * @returns {JSX.Element} The production job details page.
 */
export default async function ProductionJobDetailsPage({
  params,
}: JobDetailsPageProps) {
  const jobId = params["job-id"];
  const job = await fetchProductionJobById(jobId);

  if (!job) {
    notFound();
  }

  const {
    id,
    itemName,
    supplier,
    scheduledDate,
    status,
    progress,
    priority,
    drums,
    tasks,
    timeline,
    // Extract more specific details if available from the enhanced fetch
    // e.g. batch_code from job.batches?.batch_code
    // e.g. still_code from operations -> distillation_details -> stills
  } = job;

  // Attempt to find the distillation operation to display its specific details
  const distillationOp = tasks?.find((task) => task.name === "distillation");
  const batchCode = (job as any).batches?.batch_code || "N/A"; // Temporary any cast

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-5xl">
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/50 p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <CardTitle className="text-2xl font-semibold flex items-center">
                <Briefcase className="mr-3 h-7 w-7 text-primary" />
                Job Details: {id.slice(0, 8).toUpperCase()}
              </CardTitle>
              <CardDescription className="mt-1 text-md">
                Production job for: {itemName}
              </CardDescription>
            </div>
            <Badge
              variant={getJobStatusBadgeVariant(status)}
              className="text-sm px-3 py-1 self-start sm:self-center"
            >
              {status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-8">
          {/* Main Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
            <InfoItem icon={<Layers />} label="Item Name" value={itemName} />
            <InfoItem icon={<Users />} label="Supplier" value={supplier} />
            <InfoItem
              icon={<Package />}
              label="Input Batch Code"
              value={batchCode}
            />
            <InfoItem
              icon={<CalendarDays />}
              label="Scheduled Start"
              value={formatDate(scheduledDate)}
            />
            <InfoItem icon={<TrendingUp />} label="Priority" value={priority} />
            {distillationOp?.details && (
              <InfoItem
                icon={<Thermometer />}
                label="Distillation Details"
                value={distillationOp.details}
              />
            )}
          </div>

          <Separator />

          {/* Progress */}
          <div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              Overall Progress
            </h3>
            <Progress value={progress || 0} className="h-3 mb-1" />
            <p className="text-sm text-muted-foreground">
              {progress || 0}% complete
            </p>
          </div>

          <Separator />

          {/* Operations/Tasks Section */}
          <div>
            <h3 className="text-lg font-medium text-foreground mb-3 flex items-center">
              <ListChecks className="mr-2 h-5 w-5" /> Operations
            </h3>
            {tasks && tasks.length > 0 ? (
              <div className="space-y-4">
                {tasks.map((task, index) => (
                  <Card key={index} className="bg-muted/30">
                    <CardHeader className="p-4">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-md font-semibold capitalize flex items-center">
                          {task.name === "distillation" && (
                            <Zap className="mr-2 h-4 w-4 text-blue-500" />
                          )}
                          {task.name === "qc" && (
                            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                          )}
                          {task.name !== "distillation" &&
                            task.name !== "qc" && (
                              <MoreHorizontal className="mr-2 h-4 w-4 text-gray-500" />
                            )}
                          {task.name.replace("_", " ")}
                        </CardTitle>
                        <Badge
                          variant={getOperationStatusVariant(
                            task.status as string | undefined
                          )}
                          className="text-sm"
                        >
                          {task.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    {(task.details ||
                      (task.name === "distillation" &&
                        (job as any).operations?.[index]
                          ?.distillation_details)) && (
                      <CardContent className="p-4 pt-0 text-sm">
                        <InfoItem
                          icon={<FileText className="h-4 w-4" />}
                          label="Details"
                          value={
                            task.details ||
                            `Still: ${(job as any).operations?.[index]?.distillation_details?.stills?.code}, Raw Vol: ${(job as any).operations?.[index]?.distillation_details?.raw_volume}L`
                          }
                        />
                        {(job as any).operations?.[index]?.started_at && (
                          <InfoItem
                            icon={<Clock className="h-4 w-4" />}
                            label="Started"
                            value={formatDateTime(
                              (job as any).operations?.[index]?.started_at
                            )}
                          />
                        )}
                        {(job as any).operations?.[index]?.ended_at && (
                          <InfoItem
                            icon={<Clock className="h-4 w-4" />}
                            label="Ended"
                            value={formatDateTime(
                              (job as any).operations?.[index]?.ended_at
                            )}
                          />
                        )}
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">
                No specific operations detailed for this job yet.
              </p>
            )}
          </div>

          <Separator />

          {/* Drums Section - Placeholder/Simplified */}
          <div>
            <h3 className="text-lg font-medium text-foreground mb-3 flex items-center">
              <Package className="mr-2 h-5 w-5" /> Associated Drums
            </h3>
            {drums && drums.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {drums.map((drum) => (
                  <Badge
                    key={drum.id}
                    variant="secondary"
                    className="py-2 justify-start"
                  >
                    <span className="font-mono text-xs truncate">
                      {drum.serial} ({drum.volume}L)
                    </span>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No drums currently associated or tracked for this job stage.
              </p>
            )}
          </div>

          <Separator />

          {/* Timeline Section */}
          <div>
            <h3 className="text-lg font-medium text-foreground mb-3 flex items-center">
              <Clock className="mr-2 h-5 w-5" /> Event Timeline
            </h3>
            {timeline && timeline.length > 0 ? (
              <ul className="space-y-3">
                {timeline.map((event, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 pt-1">
                      {event.event.includes("completed") ||
                      event.event.includes("received") ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {event.event}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(new Date(event.timestamp))}{" "}
                        {event.user && `by ${event.user}`}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">
                No timeline events recorded for this job yet.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
