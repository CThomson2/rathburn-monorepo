/**
 * Toast utilities
 * 
 * Enhanced toast configurations and utility functions
 */

import { ToastOptions } from 'react-toastify';

/**
 * Configuration for centered confirmation toasts
 * with longer timeouts and custom styling
 */
export const centeredConfirmToastConfig: Partial<ToastOptions> = {
  position: "top-center",
  autoClose: 8000, // 8 seconds
  hideProgressBar: false,
  closeOnClick: false,
  pauseOnHover: true,
  draggable: false,
  theme: "light",
  className: "confirmation-toast",
};

/**
 * Displays a confirmation toast with suggestion and action buttons
 * 
 * @param message - Main message to display
 * @param suggestion - The suggested text
 * @param onConfirm - Callback when user confirms the suggestion
 * @param onDismiss - Optional callback when user dismisses the suggestion
 */
export function showSuggestionToast(
  message: string,
  suggestion: string,
  onConfirm: () => void,
  onDismiss?: () => void
): void {
  // Implementation will be added by the user
  // This is just a placeholder for the function signature
} 