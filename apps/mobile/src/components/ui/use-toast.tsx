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

/**
 * A single toast notification component that displays alerts, messages, or notifications.
 *
 * This component handles its own animation and styling based on the variant provided.
 *
 * @param id - Unique identifier for the toast
 * @param title - Main heading text for the toast
 * @param description - Optional detailed message for the toast
 * @param action - Optional action button configuration
 * @param variant - Visual style of the toast: "default", "destructive", or "success"
 * @param onClose - Callback function triggered when the toast is closed
 *
 * @example
 * // Basic usage
 * <Toast
 *   title="Success!"
 *   description="Your changes have been saved."
 *   variant="success"
 * />
 *
 * @example
 * // With action button
 * <Toast
 *   title="Delete item?"
 *   description="This action cannot be undone."
 *   variant="destructive"
 *   action={{
 *     onClick: () => handleDelete(),
 *     children: "Delete",
 *     altText: "Confirm deletion"
 *   }}
 * />
 *
 * @example
 * // Using the toast function (preferred method)
 * // This is how you should typically create toasts in your application
 * import { toast } from "@/components/ui/use-toast";
 *
 * // In your component:
 * toast({
 *   title: "Profile updated",
 *   description: "Your profile has been successfully updated.",
 *   variant: "success",
 *   duration: 3000, // Auto-dismiss after 3 seconds
 * });
 */
export function Toast({
  id,
  title,
  description,
  action,
  variant = "default",
  onClose = () => {},
}: ToastProps) {
  // State to control the visibility animation
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Small delay before showing the toast to allow for animation
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10);

    return () => clearTimeout(timer);
  }, []);

  // Handle closing the toast with animation
  const handleClose = () => {
    // First animate out
    setIsVisible(false);
    // Then call the onClose callback after animation completes
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={cn(
        "max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 transition-all duration-300 ease-in-out transform",
        {
          "ring-gray-200 dark:ring-gray-700 border-2 border-gray-300 dark:border-gray-600":
            variant === "default",
          "ring-red-500 dark:ring-red-400 bg-red-50 dark:bg-red-900/40 border-2 border-red-300 dark:border-red-700":
            variant === "destructive",
          "ring-green-500 dark:ring-green-400 bg-green-50 dark:bg-green-900/40 border-2 border-green-300 dark:border-green-700":
            variant === "success",
        },
        isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      )}
      role="alert"
      style={{
        boxShadow:
          "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      }}
    >
      <div className="flex-1 w-0 p-4">
        <div className="flex items-start">
          <div className="ml-3 flex-1">
            {/* Toast title */}
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
            {/* Toast description */}
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
        {/* Custom action button or default close button */}
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

/**
 * Provider component that manages toast state and provides toast functionality
 * to all child components.
 *
 * This must be placed high in your component tree, typically in your layout
 * or root component.
 *
 * @example
 * // In your root layout or app component:
 * <ToastProvider>
 *   <YourApp />
 * </ToastProvider>
 *
 * // IMPORTANT: You must also include the Toaster component somewhere in your app
 * // to actually render the toasts:
 * import { Toaster } from "@/components/ui/toaster";
 *
 * // Then in your layout:
 * <ToastProvider>
 *   <YourApp />
 *   <Toaster />
 * </ToastProvider>
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  // State to store all active toasts
  const [toasts, setToasts] = useState<(ToastProps & { id: string })[]>([]);

  // Create a new toast notification
  const toast = useCallback((props: ToastProps) => {
    // Generate ID if not provided
    const id = props.id || crypto.randomUUID();
    // Default duration is 5 seconds if not specified
    const duration = props.duration || 5000;

    console.log("Toast being created:", { ...props, id });

    setToasts((prev) => {
      // Add new toast and enforce TOAST_LIMIT by slicing
      const nextToasts = [
        ...prev.filter((toast) => toast.id !== id), // Remove any existing toast with same ID
        { ...props, id, onClose: () => {} },
      ].slice(-TOAST_LIMIT); // Keep only the most recent toasts up to the limit

      console.log("Toast state updated, current toasts:", nextToasts);
      return nextToasts;
    });

    // Auto-remove toast after duration
    const timeoutId = setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
      console.log("Toast auto-removed after timeout:", id);
    }, duration);

    // Return control functions for this toast
    return {
      id,
      // Update an existing toast
      update: (newProps: ToastProps) => {
        setToasts((prev) =>
          prev.map((t) => (t.id === id ? { ...t, ...newProps, id } : t))
        );
        console.log("Toast updated:", id, newProps);
      },
      // Manually dismiss a toast
      dismiss: () => {
        clearTimeout(timeoutId); // Clear the auto-dismiss timeout
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
        console.log("Toast dismissed:", id);
      },
    };
  }, []);

  // Dismiss one or all toasts
  const dismiss = useCallback((toastId?: string) => {
    console.log("Dismissing toast(s):", toastId || "all");
    setToasts(
      (prev) => (toastId ? prev.filter((toast) => toast.id !== toastId) : []) // Dismiss all if no ID provided
    );
  }, []);

  // Remove a specific toast by ID
  const removeToast = useCallback((id: string) => {
    console.log("Removing toast:", id);
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Provide toast functionality to children via context
  return (
    <ToastContext.Provider value={{ toast, dismiss, toasts }}>
      {children}
    </ToastContext.Provider>
  );
}

/**
 * Hook to access toast functionality within components.
 *
 * @returns An object with toast functions and the current toast array
 *
 * @example
 * // Within a component:
 * const { toast, dismiss } = useToast();
 *
 * // Create a toast
 * const showToast = () => {
 *   toast({
 *     title: "Hello!",
 *     description: "This is a toast notification",
 *   });
 * };
 *
 * // Dismiss all toasts
 * const clearToasts = () => {
 *   dismiss();
 * };
 *
 * @throws Error if used outside of a ToastProvider
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

/**
 * Convenience function to create toasts without using the hook directly.
 * This is useful for creating toasts in non-component code.
 *
 * NOTE: This will only work if called within a component tree that has a ToastProvider.
 *
 * @param props - Toast configuration options
 * @returns The toast control object with id, update, and dismiss methods
 *
 * @example
 * // In any component:
 * import { toast } from "@/components/ui/use-toast";
 *
 * function handleClick() {
 *   toast({
 *     title: "Action completed",
 *     description: "Your action was successful",
 *     variant: "success",
 *   });
 * }
 *
 * // COMMON ISSUES:
 * // 1. If toasts aren't showing, make sure you have:
 * //    - Added <ToastProvider> to your app
 * //    - Added <Toaster /> component to render the toasts
 * // 2. If you get "useToast must be used within a ToastProvider" error,
 * //    you're trying to use toast outside of the ToastProvider context
 */
export const toast = (props: ToastProps) => {
  const { toast } = useToast();
  return toast(props);
};
