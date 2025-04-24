
import { cn } from "@/lib/utils";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { OrderStatus } from "../types";

type ProgressIndicatorProps = {
  status: OrderStatus;
  progress: number;
}

export const ProgressIndicator = ({ status, progress }: ProgressIndicatorProps) => {
  const steps = [
    { name: 'Preparation', value: 'preparing' },
    { name: 'Distillation', value: 'distillation' },
    { name: 'QC', value: 'qc' },
    { name: 'Complete', value: 'complete' }
  ];
  
  const currentStepIndex = steps.findIndex(step => step.value === status);
  
  // If error, we'll show a different style
  const isError = status === 'error';

  return (
    <div className="relative">
      {/* Progress bar background */}
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        {isError ? (
          <div className="h-full bg-status-error w-full animate-pulse"></div>
        ) : (
          <div 
            className={cn(
              "h-full transition-all duration-500 ease-in-out",
              status === 'preparing' ? "bg-status-preparing" : "",
              status === 'distillation' ? "bg-status-distillation" : "",
              status === 'qc' ? "bg-status-qc" : "",
              status === 'complete' ? "bg-status-complete" : ""
            )}
            style={{ width: `${progress}%` }}
          ></div>
        )}
      </div>
      
      {/* Step indicators */}
      <div className="flex justify-between mt-1">
        {steps.map((step, idx) => {
          const isActive = idx <= currentStepIndex && !isError;
          const isCompleted = idx < currentStepIndex && !isError;
          
          return (
            <div key={step.value} className="flex flex-col items-center">
              <div 
                className={cn(
                  "w-4 h-4 rounded-full flex items-center justify-center",
                  isActive ? "bg-brand-blue" : "bg-gray-300 dark:bg-gray-600",
                  isError && "bg-status-error"
                )}
              >
                {isCompleted && <CheckCircle size={12} className="text-white" />}
              </div>
              <span className={cn(
                "text-xs mt-1",
                isActive ? "text-gray-900 dark:text-gray-100" : "text-gray-500 dark:text-gray-400",
                isError && "text-status-error"
              )}>
                {step.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
