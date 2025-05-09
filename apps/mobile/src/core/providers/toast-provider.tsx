"use client";

import React from "react";
import { ToastProvider as InternalToastProvider } from "@/core/components/ui/use-toast";
import { Toaster } from "@/core/components/ui/toaster";

/**
 * Combined toast provider that includes both context and UI components
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <InternalToastProvider>
      {children}
      <Toaster />
    </InternalToastProvider>
  );
}
