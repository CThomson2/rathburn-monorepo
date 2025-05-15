"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface ProductionConfirmationProps {
  result: {
    success: boolean;
    jobId?: string;
    message?: string;
  } | null;
  onClose: () => void;
  onCreateNew: () => void;
}

/**
 * Displays the result of the production job creation attempt.
 * Shows success or failure message, and a link to the new job if successful.
 */
export function ProductionConfirmation({
  result,
  onClose,
  onCreateNew,
}: ProductionConfirmationProps) {
  if (!result) {
    // Should not happen if modal flow is correct, but handle defensively
    return (
      <div className="flex flex-col items-center justify-center text-center p-8">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Missing Information</h2>
        <p className="text-muted-foreground mb-6">
          There was an issue retrieving the job creation status.
        </p>
        <Button onClick={onClose}>Close</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center text-center p-8">
      {result.success ? (
        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
      ) : (
        <XCircle className="w-16 h-16 text-destructive mb-4" />
      )}
      <h2 className="text-2xl font-semibold mb-2">
        {result.success ? "Production Job Scheduled!" : "Scheduling Failed"}
      </h2>
      <p className="text-muted-foreground mb-6">
        {result.message ||
          (result.success
            ? `Job ID: ${result.jobId || "N/A"} has been successfully scheduled.`
            : "An unexpected error occurred. Please try again.")}
      </p>

      {result.success && result.jobId && (
        <div className="mb-6">
          <Link href={`/production/jobs/${result.jobId}`} passHref>
            <Button variant="outline">View Job Details</Button>
          </Link>
        </div>
      )}

      <div className="flex gap-4">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button onClick={onCreateNew}>Schedule Another Job</Button>
      </div>
    </div>
  );
}
