
import { CheckCircle, Circle } from "lucide-react";

interface ProgressStepperProps {
  steps: string[];
  currentStep: number;
}

const ProgressStepper = ({ steps, currentStep }: ProgressStepperProps) => {
  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="relative mb-2">
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
          <div 
            className="h-full bg-industrial-blue rounded-full transition-all"
            style={{ 
              width: `${Math.min(100, (currentStep / (steps.length - 1)) * 100)}%` 
            }}
          />
        </div>
        
        {/* Step indicators */}
        <div className="absolute top-0 left-0 w-full flex justify-between transform -translate-y-1/2">
          {steps.map((step, index) => (
            <div 
              key={step} 
              className="flex flex-col items-center"
            >
              <div 
                className={`
                  flex items-center justify-center w-6 h-6 rounded-full 
                  ${index <= currentStep 
                    ? 'bg-industrial-blue text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                  }
                  transition-colors duration-300
                `}
              >
                {index < currentStep ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Step labels - only show on larger screens */}
      <div className="hidden sm:flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1 px-1">
        {steps.map((step, index) => (
          <div 
            key={`label-${step}`}
            className={`${index <= currentStep ? 'font-medium text-industrial-blue dark:text-industrial-lightBlue' : ''}`}
          >
            {step}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressStepper;
