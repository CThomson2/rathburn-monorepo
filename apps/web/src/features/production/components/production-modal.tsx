"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ProductionForm } from "./production-form";
import { ProductionPreview } from "./production-preview";
import { ProductionConfirmation } from "./production-confirmation";

export type ProductionModalStep = "preview" | "create" | "confirmation";

interface ProductionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * A modal dialog for creating and previewing production schedules.
 *
 * The modal is comprised of three steps:
 * 1. Preview: shows a list of recent/upcoming production jobs with a button to create a new one.
 * 2. Create: shows a form to schedule a new production job.
 * 3. Confirmation: shows a confirmation message after a new job has been scheduled.
 *
 * The modal will automatically reset its state when closed.
 */
export function ProductionModal({ open, onOpenChange }: ProductionModalProps) {
  const [step, setStep] = useState<ProductionModalStep>("preview");
  const [jobResult, setJobResult] = useState<{
    success: boolean;
    jobId?: string;
    message?: string;
  } | null>(null);

  const handleStepChange = useCallback((newStep: ProductionModalStep) => {
    setStep(newStep);
  }, []);

  const handleJobCreated = useCallback(
    (result: { success: boolean; jobId?: string; message?: string }) => {
      setJobResult(result);
      if (result.success) {
        setStep("confirmation");
      }
      // If not successful, the form itself should show an error toast.
      // The modal can remain on the 'create' step or offer to go back.
    },
    []
  );

  // Reset the state when closing the modal
  const handleOpenChangeInternal = useCallback(
    (isOpen: boolean) => {
      onOpenChange(isOpen);
      if (!isOpen) {
        setTimeout(() => {
          setStep("preview");
          setJobResult(null);
        }, 300); // Delay reset for close animation
      }
    },
    [onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChangeInternal}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {step === "preview" && "Production Schedule"}
            {step === "create" && "Schedule New Production Job"}
            {step === "confirmation" && "Job Scheduled"}
          </DialogTitle>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex justify-center mb-6 mt-2">
          <div className="flex items-center gap-2">
            {["preview", "create", "confirmation"].map((s) => (
              <div
                key={s}
                className={cn(
                  "h-2 w-2 rounded-full transition-all duration-200",
                  step === s ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"
                )}
              />
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {step === "preview" && (
            <ProductionPreview onCreateJob={() => handleStepChange("create")} />
          )}
          {step === "create" && (
            <ProductionForm
              onJobCreated={handleJobCreated}
              onCancel={() => handleStepChange("preview")}
            />
          )}
          {step === "confirmation" && (
            <ProductionConfirmation
              result={jobResult}
              onClose={() => handleOpenChangeInternal(false)}
              onCreateNew={() => handleStepChange("create")}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-4">
          {step === "create" && (
            <Button
              variant="outline"
              onClick={() => handleStepChange("preview")}
            >
              Back to Preview
            </Button>
          )}
          {step === "confirmation" && (
            <Button
              variant="outline"
              onClick={() => handleStepChange("preview")}
            >
              Back to Preview
            </Button>
          )}

          {step === "preview" && (
            <Button
              onClick={() => handleStepChange("create")}
              className="ml-auto"
            >
              Schedule New Job
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
