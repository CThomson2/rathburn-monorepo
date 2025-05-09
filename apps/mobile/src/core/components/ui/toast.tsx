"use client";

import { X } from "lucide-react";
import { cn } from "@/core/lib/utils";
import { useEffect, useState } from "react";

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
  onClose?: () => void;
}

export function Toast({
  title,
  description,
  variant = "default",
  onClose = () => {},
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Allow animation to complete
  };

  return (
    <div
      className={cn(
        "max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 transition-all duration-300 ease-in-out transform",
        {
          "ring-gray-200 dark:ring-gray-700": variant === "default",
          "ring-red-500 dark:ring-red-400 bg-red-50 dark:bg-red-900":
            variant === "destructive",
          "ring-green-500 dark:ring-green-400 bg-green-50 dark:bg-green-900":
            variant === "success",
        },
        isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      )}
      role="alert"
    >
      <div className="flex-1 w-0 p-4">
        <div className="flex items-start">
          <div className="ml-3 flex-1">
            {title && (
              <p
                className={cn("text-sm font-medium", {
                  "text-gray-900 dark:text-gray-100": variant === "default",
                  "text-red-800 dark:text-red-200": variant === "destructive",
                  "text-green-800 dark:text-green-200": variant === "success",
                })}
              >
                {title}
              </p>
            )}
            {description && (
              <p
                className={cn("mt-1 text-sm", {
                  "text-gray-500 dark:text-gray-400": variant === "default",
                  "text-red-700 dark:text-red-300": variant === "destructive",
                  "text-green-700 dark:text-green-300": variant === "success",
                })}
              >
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="flex border-l border-gray-200 dark:border-gray-700">
        <button
          onClick={handleClose}
          className={cn(
            "w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium",
            {
              "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300":
                variant === "default",
              "text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300":
                variant === "destructive",
              "text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300":
                variant === "success",
            }
          )}
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
