"use client"; // This page now needs client-side interactivity

import { useState, useEffect, useCallback } from "react";
import {
  fetchProductionJobById,
  updateProductionJobStatus,
} from "@/app/actions/production";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button"; // For Confirm button
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { notFound, useRouter } from "next/navigation"; // useRouter for refresh
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
  FileEdit, // For Edit button/mode
  CheckSquare, // For Confirm Schedule
  Loader2,
  Edit,
  ArrowLeft,
} from "lucide-react";
import {
  ProductionJobViewData,
  JobDisplayStatus,
  JobStatus as DbJobStatus,
  OperationStatus, // Keep if getOperationStatusVariant is used for individual operations
} from "@/features/production/types";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { formatDate, formatDateTime } from "@/utils/format-date";
import { cn } from "@/lib/utils";
import { JobEditForm } from "@/features/production/schedule/components/job-edit-form"; // Import the new form
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

interface JobDetailsPageProps {
  params: {
    "job-id": string;
  };
}

// Helper to get badge variant based on JobDisplayStatus for the overall job
function getJobDisplayStatusBadgeVariant(
  status: JobDisplayStatus | undefined
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "complete":
      return "default";
    case "in_progress":
    case "qc":
    case "confirmed":
      return "outline";
    case "drafted":
    case "scheduled":
    case "paused":
      return "secondary";
    case "error":
      return "destructive";
    default:
      return "secondary";
  }
}

// This helper is for individual operation items if displayed on this page, not for the main job badge.
// It uses OperationStatus from the DB.
function getOperationStatusVariant(
  status: OperationStatus | string | undefined // Can be OperationStatus or a string from DB
): "default" | "secondary" | "destructive" | "outline" {
  // Ensure status is treated as string for case comparison if it's an enum value
  const lowerStatus = String(status).toLowerCase();
  switch (lowerStatus) {
    case "completed":
      return "default";
    case "in_progress": // This is op_status 'in_progress'
    case "active": // This is op_status 'active'
      return "outline";
    case "pending": // op_status 'pending'
      // case "scheduled": // op_status doesn't have 'scheduled', job_status does. Remove if not an op_status.
      // If 'scheduled' can appear as an op_status string, map it.
      return "secondary";
    case "error":
    case "failed": // 'failed' is a job_status, 'error' is an op_status. Keep if 'failed' can be an op string.
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

export default function ProductionJobDetailsPage({
  params,
}: JobDetailsPageProps) {
  const jobId = params["job-id"];
  const [job, setJob] = useState<ProductionJobViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const loadJob = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedJob = await fetchProductionJobById(jobId);
      if (!fetchedJob) {
        notFound();
        return;
      }
      setJob(fetchedJob);
      // Automatically enter edit mode if the fetched job's DB status is 'drafted'
      // This requires fetchProductionJobById to also return the raw DB JobStatus,
      // or make another query. For now, we rely on the display status.
      if (fetchedJob.status === "drafted") {
        // Check against the display status
        // setIsEditing(true); // TODO: Decide if this auto-edit is desired. User might want to view first.
      }
    } catch (error) {
      console.error("Failed to load job:", error);
      toast.error("Failed to load job details.");
      // notFound(); // Or some other error display
    } finally {
      setLoading(false);
    }
  }, [jobId, toast]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  const handleUpdateSuccess = () => {
    setIsEditing(false);
    loadJob();
    router.refresh();
  };

  const handleConfirmSchedule = async () => {
    if (!job) return;
    setIsConfirming(true);
    try {
      // updateProductionJobStatus now expects DbJobStatus type
      const result = await updateProductionJobStatus(
        job.id,
        "scheduled" as DbJobStatus
      );
      if (result.success) {
        toast.success("Job status updated to Scheduled!");
        loadJob();
        router.refresh();
      } else {
        toast.error(result.message || "Failed to update job status.");
      }
    } catch (error) {
      console.error("Error confirming schedule:", error);
      toast.error("An unexpected error occurred while confirming schedule.");
    } finally {
      setIsConfirming(false);
    }
  };

  if (loading || !job) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-5xl flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Original job_status (from DB) is needed to determine editability, not the mapped UI status.
  // Assuming `fetchProductionJobById` now returns a structure where `job.job_status_raw` (or similar)
  // holds the original DB enum value e.g. "drafted", "scheduled".
  // For now, we'll infer from the mapped `job.status` which is not ideal.
  // A proper solution would be to have the direct DB status available in the `job` object.
  // Let's assume `job.dbStatus` exists for this logic for now (e.g. you add it to ProductionJobOrderType and fetch it)
  // const canEdit = job.dbStatus === 'drafted';
  // const canConfirm = job.dbStatus === 'drafted';

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
    jobName,
  } = job;
  const batchCode =
    (job as any).batch_code || (job as any).batches?.batch_code || "N/A";

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-5xl">
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/50 p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <CardTitle className="text-2xl font-semibold flex items-center">
                <Briefcase className="mr-3 h-7 w-7 text-primary" />
                Job: {jobName || id.slice(0, 8).toUpperCase()}
              </CardTitle>
              <CardDescription className="mt-1 text-md">
                Production job for: {itemName}
              </CardDescription>
            </div>
            <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
              <Badge
                variant={getJobDisplayStatusBadgeVariant(status)}
                className="text-sm px-3 py-1 self-start sm:self-center capitalize"
              >
                {status}
                {job.status === "drafted" && " (Draft)"}
              </Badge>
              {job.status === "drafted" && !isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <FileEdit className="mr-2 h-4 w-4" /> Edit Draft
                </Button>
              )}
              {!isEditing && (
                <Button
                  asChild
                  variant="outline"
                  size="icon"
                  className="self-start sm:self-center"
                >
                  <Link
                    href="/production"
                    aria-label="Back to production schedule"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-8">
          {isEditing && job.status === "drafted" ? (
            <JobEditForm
              job={job}
              onUpdateSuccess={handleUpdateSuccess}
              onCancelEdit={() => setIsEditing(false)}
            />
          ) : (
            <>
              {/* Main Details Grid (Read-only) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                <InfoItem
                  icon={<Layers />}
                  label="Item Name"
                  value={itemName}
                />
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
                <InfoItem
                  icon={<TrendingUp />}
                  label="Priority"
                  value={priority}
                />
                {/* ... other info items ... */}
              </div>
              <Separator />
              {/* Progress, Operations, Drums, Timeline sections (as before, read-only) */}
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
              <div>
                <h3 className="text-lg font-medium text-foreground mb-3 flex items-center">
                  <ListChecks className="mr-2 h-5 w-5" /> Operations
                </h3>
                {/* ... operations rendering ... */}
              </div>
              <Separator />
              <div>
                <h3 className="text-lg font-medium text-foreground mb-3 flex items-center">
                  <Package className="mr-2 h-5 w-5" /> Associated Drums
                </h3>
                {/* ... drums rendering ... */}
              </div>
              <Separator />
              <div>
                <h3 className="text-lg font-medium text-foreground mb-3 flex items-center">
                  <Clock className="mr-2 h-5 w-5" /> Documents
                </h3>
                <Link href={`/production/jobs/${jobId}/qrd`}>
                  <Button variant="outline">
                    <FileText className="mr-2 h-5 w-5" /> QRD
                  </Button>
                </Link>
              </div>
            </>
          )}

          {job.status === "drafted" && !isEditing && (
            <div className="mt-8 px-2 flex justify-end">
              <Button
                onClick={handleConfirmSchedule}
                disabled={isConfirming}
                size="lg"
              >
                {isConfirming && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <CheckSquare className="mr-2 h-5 w-5" /> Confirm and Schedule
                Job
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
