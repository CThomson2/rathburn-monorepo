"use client";

import { useToast } from "@/hooks/use-toast";
import { Toast, type ToastProps } from "@/components/ui/use-toast";

export function Toaster() {
  const { toast: _toast, dismiss } = useToast();

  // We don't actually need to do anything here since
  // the ToastProvider in use-toast.tsx already handles
  // rendering the toast UI
  return null;
}
