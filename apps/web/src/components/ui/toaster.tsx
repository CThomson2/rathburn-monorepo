"use client";

import React from "react";
import {
  ToastContainer,
  toast as toastify,
  ToastContentProps,
} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { cn } from "@/lib/utils";

// Define our own options type without referencing react-toastify types
export interface ToastOptions {
  position?:
    | "top-right"
    | "top-center"
    | "top-left"
    | "bottom-right"
    | "bottom-center"
    | "bottom-left";
  autoClose?: number | false;
  hideProgressBar?: boolean;
  closeOnClick?: boolean;
  pauseOnHover?: boolean;
  draggable?: boolean;
  progress?: number;
  theme?: "light" | "dark" | "colored";
  className?: string;
  style?: React.CSSProperties;
}

// Custom toast implementation to avoid exposing react-toastify types
const createToast = {
  default: (message: React.ReactNode, options?: ToastOptions) =>
    toastify(message, {
      className: "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100",
      ...options,
    }),
  success: (message: React.ReactNode, options?: ToastOptions) =>
    toastify.success(message, {
      className:
        "bg-green-50 dark:bg-green-900 text-green-800 dark:text-green-100",
      ...options,
    }),
  error: (message: React.ReactNode, options?: ToastOptions) =>
    toastify.error(message, {
      className: "bg-red-50 dark:bg-red-900 text-red-800 dark:text-red-100",
      ...options,
    }),
  warning: (message: React.ReactNode, options?: ToastOptions) =>
    toastify.warning(message, {
      className:
        "bg-yellow-50 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100",
      ...options,
    }),
  info: (message: React.ReactNode, options?: ToastOptions) =>
    toastify.info(message, {
      className: "bg-blue-50 dark:bg-blue-900 text-blue-800 dark:text-blue-100",
      ...options,
    }),
  // Custom themed toasts
  primary: (message: React.ReactNode, options?: ToastOptions) =>
    toastify(message, {
      className: "bg-primary text-primary-foreground",
      ...options,
    }),
  secondary: (message: React.ReactNode, options?: ToastOptions) =>
    toastify(message, {
      className: "bg-secondary text-secondary-foreground",
      ...options,
    }),
  accent: (message: React.ReactNode, options?: ToastOptions) =>
    toastify(message, {
      className:
        "bg-indigo-50 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-100",
      ...options,
    }),
  dark: (message: React.ReactNode, options?: ToastOptions) =>
    toastify(message, {
      className: "bg-gray-800 dark:bg-black text-white",
      ...options,
    }),
  // Customizable toast with JSX content
  custom: (content: React.ReactNode, options?: ToastOptions) =>
    toastify(content, options),
  // Utility functions
  dismiss: () => toastify.dismiss(),
  update: (id: string | number, options: any) => toastify.update(id, options),
  dismissById: (id: string | number) => toastify.dismiss(id),
  // Utility to create a notification with title and message
  notify: (
    title: string,
    message: string,
    type: "success" | "error" | "warning" | "info" | "default" = "default",
    options?: ToastOptions
  ) => {
    const content = (
      <div className="flex flex-col">
        <h3 className="font-medium">{title}</h3>
        <p className="mt-1 text-sm opacity-90">{message}</p>
      </div>
    );

    switch (type) {
      case "success":
        return createToast.success(content, options);
      case "error":
        return createToast.error(content, options);
      case "warning":
        return createToast.warning(content, options);
      case "info":
        return createToast.info(content, options);
      default:
        return createToast.default(content, options);
    }
  },
};

// Export the toast object with type safety
export const toast = createToast;

// Types for our Toaster component props
export interface ToasterProps {
  position?:
    | "top-right"
    | "top-center"
    | "top-left"
    | "bottom-right"
    | "bottom-center"
    | "bottom-left";
  autoClose?: number | false;
  hideProgressBar?: boolean;
  newestOnTop?: boolean;
  closeOnClick?: boolean;
  rtl?: boolean;
  pauseOnFocusLoss?: boolean;
  draggable?: boolean;
  pauseOnHover?: boolean;
  theme?: "light" | "dark" | "colored" | "auto";
  containerClassName?: string;
  toastClassName?: string;
  progressClassName?: string;
  limit?: number;
}

/**
 * Toast container component that handles notifications using react-toastify
 */
export function Toaster({
  position = "bottom-right",
  autoClose = 5000,
  hideProgressBar = false,
  newestOnTop = false,
  closeOnClick = true,
  rtl = false,
  pauseOnFocusLoss = true,
  draggable = true,
  pauseOnHover = true,
  theme = "auto",
  containerClassName,
  toastClassName,
  progressClassName,
  limit,
}: ToasterProps) {
  // Set theme to dark/light based on system preference
  const [currentTheme, setCurrentTheme] = React.useState<
    "light" | "dark" | "colored"
  >(theme === "auto" ? "light" : theme);

  // Update theme based on system preference if set to auto
  React.useEffect(() => {
    if (theme !== "auto") return;

    const isDarkMode =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    setCurrentTheme(isDarkMode ? "dark" : "light");

    // Listen for changes in color scheme
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      setCurrentTheme(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  return (
    <ToastContainer
      position={position}
      autoClose={autoClose}
      hideProgressBar={hideProgressBar}
      newestOnTop={newestOnTop}
      closeOnClick={closeOnClick}
      rtl={rtl}
      pauseOnFocusLoss={pauseOnFocusLoss}
      draggable={draggable}
      pauseOnHover={pauseOnHover}
      theme={currentTheme}
      className={cn("toastify-container", containerClassName)}
      toastClassName={cn("toastify-toast", toastClassName)}
      progressClassName={cn("toastify-progress", progressClassName)}
      limit={limit}
    />
  );
}
