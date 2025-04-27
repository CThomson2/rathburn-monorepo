"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react";

export type ToastVariant = "default" | "destructive" | "success";

export interface ToastActionElement {
  altText?: string;
  onClick: () => void;
  children: React.ReactNode;
}

export interface ToastProps {
  id?: string;
  title?: string;
  description?: string;
  action?: ToastActionElement;
  variant?: ToastVariant;
  duration?: number;
  onClose?: () => void;
}

type ToastContextType = {
  toast: (props: ToastProps) => {
    id: string;
    update: (props: ToastProps) => void;
    dismiss: () => void;
  };
  dismiss: (toastId?: string) => void;
  toasts: (ToastProps & { id: string })[];
};

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 1000;

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function Toast({
  id,
  title,
  description,
  action,
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
        {action ? (
          <button
            onClick={action.onClick}
            className={cn(
              "w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium",
              {
                "text-primary hover:text-primary-focus": variant === "default",
                "text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300":
                  variant === "destructive",
                "text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300":
                  variant === "success",
              }
            )}
            aria-label={action.altText || "Toast action"}
          >
            {action.children}
          </button>
        ) : (
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
        )}
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<(ToastProps & { id: string })[]>([]);

  const toast = useCallback((props: ToastProps) => {
    const id = props.id || crypto.randomUUID();
    const duration = props.duration || 5000;

    setToasts((prev) => {
      // Enforce TOAST_LIMIT
      const nextToasts = [
        ...prev.filter((toast) => toast.id !== id),
        { ...props, id, onClose: () => {} },
      ].slice(-TOAST_LIMIT);

      return nextToasts;
    });

    // Auto-remove toast after duration
    const timeoutId = setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, duration);

    // Return functions to control this toast
    return {
      id,
      update: (newProps: ToastProps) => {
        setToasts((prev) =>
          prev.map((t) => (t.id === id ? { ...t, ...newProps, id } : t))
        );
      },
      dismiss: () => {
        clearTimeout(timeoutId);
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      },
    };
  }, []);

  const dismiss = useCallback((toastId?: string) => {
    setToasts(
      (prev) => (toastId ? prev.filter((toast) => toast.id !== toastId) : []) // Dismiss all if no ID provided
    );
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss, toasts }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            title={toast.title}
            description={toast.description}
            variant={toast.variant}
            action={toast.action}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// Convenience function exports for more ergonomic usage
export const toast = (props: ToastProps) => {
  const { toast } = useToast();
  return toast(props);
};
