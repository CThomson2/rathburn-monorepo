import { cn } from "@/lib/utils";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { JobDisplayStatus } from "../../types/";

type ProgressIndicatorProps = {
  status: JobDisplayStatus;
  progress: number;
};

// The visual steps on the indicator UI
const UI_STEPS = [
  { name: "Scheduling", SPhases: ["drafted", "scheduled", "confirmed"] },
  { name: "Distillation", SPhases: ["in_progress"] },
  { name: "QC", SPhases: ["qc"] },
  { name: "Complete", SPhases: ["complete"] },
];

const progressBarGradient = (progress: number) => {
  console.log("Gradient bar progress:", progress);
  // return `bg-gradient-to-r from-blue-500 0% to-blue-500 ${progress}% to-bg-gray-200 dark:to-bg-gray-700 100%`;
  return `bg-gradient-to-r from-blue-500 0% to-blue-500 ${progress}% to-bg-gray-200 dark:to-bg-gray-700 100%`; // debugging
};

export const ProgressIndicator = ({
  status,
  progress,
}: ProgressIndicatorProps) => {
  const isError = status === "error";

  // Determine which UI step is currently active or has been passed
  let currentUiStepIndex = -1;
  if (status === "complete") {
    currentUiStepIndex = 3;
  } else if (status === "qc") {
    currentUiStepIndex = 2;
  } else if (status === "in_progress") {
    currentUiStepIndex = 1;
  } else if (
    status === "confirmed" ||
    status === "scheduled" ||
    status === "drafted"
  ) {
    currentUiStepIndex = 0;
  }
  // 'paused' status will reflect the progress up to the point it was paused.
  // The currentUiStepIndex for 'paused' should be the step it was in before pausing.
  // For simplicity, if status is 'paused', we can assume it was at least 'in_progress' or 'qc'.
  // This part might need more sophisticated logic if we store pre-pause status.
  if (status === "paused") {
    // If progress suggests QC was active or passed
    if (progress >= 75)
      currentUiStepIndex = 2; // Assume it was in QC or beyond and got paused
    else if (progress >= 50)
      currentUiStepIndex = 1; // Assume it was in Distillation and got paused
    else currentUiStepIndex = 0; // Assume it was in Preparation and got paused
  }

  return (
    <div className="relative">
      {/* Progress bar background */}
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{
          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progress}%, #e5e7eb ${progress + 15}%, #e5e7eb 100%)`,
        }}
      >
        {isError ? (
          <div className="h-full bg-status-error w-full animate-pulse"></div>
        ) : (
          <div
            className={cn(
              "h-full transition-all duration-500 ease-in-out",
              // Apply color based on the actual JobDisplayStatus
              status === "drafted" && "bg-status-drafted",
              status === "scheduled" && "bg-status-scheduled",
              status === "confirmed" && "bg-status-confirmed",
              status === "in_progress" && "bg-status-in_progress",
              status === "paused" && "bg-status-paused",
              status === "qc" && "bg-status-qc",
              status === "complete" && "bg-status-complete"
            )}
            style={{ width: `${progress}%` }} // Width is driven by overall progress
          ></div>
        )}
      </div>

      {/* Step indicators */}
      <div className="flex justify-between mt-1">
        {UI_STEPS.map((step, idx) => {
          // An indicator step is active if the current UI step index is at or beyond it.
          const isActiveOrPassed = idx <= currentUiStepIndex && !isError;
          // An indicator step is fully completed if it's before the current UI step index.
          const isFullyCompleted = idx < currentUiStepIndex && !isError;

          return (
            <div
              key={step.name}
              className="flex flex-col items-center w-1/4 px-1 text-center"
            >
              <div
                className={cn(
                  "w-4 h-4 rounded-full flex items-center justify-center mb-0.5",
                  isActiveOrPassed
                    ? "bg-blue-500"
                    : "bg-gray-300 dark:bg-gray-600",
                  isError && "bg-status-error" // Override with error color if job status is error
                )}
              >
                {isFullyCompleted && (
                  <CheckCircle size={12} className="text-white" />
                )}
              </div>
              <span
                className={cn(
                  "text-xs mt-1",
                  isActiveOrPassed
                    ? "text-gray-900 dark:text-gray-100 font-medium"
                    : "text-gray-500 dark:text-gray-400",
                  isError && "text-status-error" // Override text color if job status is error
                )}
              >
                {step.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
