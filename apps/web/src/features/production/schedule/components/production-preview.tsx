"use client";

import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { fetchProductionJobs } from "@/app/actions/production"; // Corrected path
import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/utils/format-date";
import type {
  ProductionJobViewData as Order,
  JobDisplayStatus,
} from "@/features/production/types/";

interface ProductionPreviewProps {
  onCreateJob: () => void;
}

/**
 * ProductionPreview component for displaying a preview of production jobs.
 *
 * Fetches and displays a list of recent/upcoming production jobs.
 * If jobs are successfully loaded, they are displayed in a table format.
 * Manages loading and error states.
 */
export function ProductionPreview({ onCreateJob }: ProductionPreviewProps) {
  const { data, error, isLoading } = useSWR<Order[]>(
    "productionJobs",
    fetchProductionJobs
  );

  console.log(data);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-60">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">
          Loading production schedule...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-60">
        <p className="text-sm text-destructive mb-4">
          Failed to load production schedule. Please try again.
        </p>
        <Button onClick={onCreateJob} variant="default">
          Schedule New Job
        </Button>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-60">
        <p className="text-sm text-muted-foreground mb-4">
          No production jobs scheduled yet.
        </p>
        <Button onClick={onCreateJob} variant="default">
          Schedule Your First Job
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job ID</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Scheduled Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="font-medium text-slate-600">
                  {job.jobName || job.id.slice(0, 8)}
                </TableCell>
                <TableCell>{job.itemName}</TableCell>
                <TableCell>{formatDate(job.scheduledDate)}</TableCell>
                <TableCell>
                  <span
                    className={getStatusBadgeClass(
                      job.status as JobDisplayStatus
                    )}
                  >
                    {job.status}
                  </span>
                </TableCell>
                <TableCell>{job.priority}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Helper function to determine badge class based on status (similar to orders)
function getStatusBadgeClass(status: JobDisplayStatus): string {
  const baseClasses =
    "px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap";

  switch (status) {
    case "drafted":
      return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`;
    case "scheduled":
    case "confirmed":
      return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`;
    case "in_progress":
    case "qc":
      return `${baseClasses} bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200`;
    case "complete":
      return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`;
    case "error":
      return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`;
    case "paused":
      return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200`;
    default:
      // Fallback for any unexpected status, or if a new status is added and not handled here
      const exhaustiveCheck: never = status;
      return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200`;
  }
}
