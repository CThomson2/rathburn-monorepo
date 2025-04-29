// Import custom toast component
import { toast as toastImpl } from "@/components/ui/toaster";

// Create a type-safe interface that doesn't expose react-toastify types
export interface Toast {
  default: typeof toastImpl.default;
  success: typeof toastImpl.success;
  error: typeof toastImpl.error;
  warning: typeof toastImpl.warning;
  info: typeof toastImpl.info;
  primary: typeof toastImpl.primary;
  secondary: typeof toastImpl.secondary;
  accent: typeof toastImpl.accent;
  dark: typeof toastImpl.dark;
  custom: typeof toastImpl.custom;
  dismiss: typeof toastImpl.dismiss;
  update: typeof toastImpl.update;
  dismissById: typeof toastImpl.dismissById;
  notify: typeof toastImpl.notify;
}

// Re-export toast with explicit interface to avoid type conflicts
export const toast: Toast = toastImpl;

// Export types
export type { ToasterProps } from "@/components/ui/toaster";

// Helper hook for compatibility with existing code
export function useToast() {
  return { toast: toastImpl } as const;
} 