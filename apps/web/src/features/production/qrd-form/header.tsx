"use client";

import { format } from "date-fns";
import { QRDFormData } from "@/features/production/types/qrd";
import { cn } from "@/lib/utils";

interface QRDHeaderProps {
  data: QRDFormData;
  className?: string;
}

export function QRDHeader({ data, className }: QRDHeaderProps) {
  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not scheduled";
    return format(new Date(dateString), "PPp");
  };

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", className)}>
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-2">
          <div className="text-sm font-medium text-muted-foreground">Job:</div>
          <div className="col-span-2 text-sm">
            {data.jobName || data.jobId.slice(0, 8)}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="text-sm font-medium text-muted-foreground">
            Material:
          </div>
          <div className="col-span-2 text-sm">{data.materialName}</div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="text-sm font-medium text-muted-foreground">
            Batch:
          </div>
          <div className="col-span-2 text-sm">
            {data.batchCode || "Unknown batch"}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="text-sm font-medium text-muted-foreground">
            Supplier:
          </div>
          <div className="col-span-2 text-sm">
            {data.supplierName || "Unknown supplier"}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-2">
          <div className="text-sm font-medium text-muted-foreground">
            Still:
          </div>
          <div className="col-span-2 text-sm">
            {data.stillCode ? `Still ${data.stillCode}` : "Unknown still"}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="text-sm font-medium text-muted-foreground">
            Raw Volume:
          </div>
          <div className="col-span-2 text-sm">{data.rawVolume} L</div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="text-sm font-medium text-muted-foreground">
            Scheduled:
          </div>
          <div className="col-span-2 text-sm">
            {formatDate(data.scheduledStart)}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="text-sm font-medium text-muted-foreground">
            Status:
          </div>
          <div className="col-span-2 text-sm">
            <StatusBadge status={data.status} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for status display
function StatusBadge({ status }: { status: string }) {
  const statusStyles = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    active: "bg-blue-100 text-blue-800 border-blue-200",
    completed: "bg-green-100 text-green-800 border-green-200",
    error: "bg-red-100 text-red-800 border-red-200",
  };

  const statusLabel = {
    pending: "Pending",
    active: "In Progress",
    completed: "Completed",
    error: "Error",
  };

  const style =
    statusStyles[status as keyof typeof statusStyles] ||
    "bg-gray-100 text-gray-800 border-gray-200";
  const label = statusLabel[status as keyof typeof statusLabel] || "Unknown";

  return (
    <span className={`px-2 py-1 text-xs rounded-md border ${style}`}>
      {label}
    </span>
  );
}
