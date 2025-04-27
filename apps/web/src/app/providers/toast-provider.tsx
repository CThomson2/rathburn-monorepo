"use client";

import { ReactNode } from "react";
import { ToastProvider as ToastProviderComponent } from "@/components/ui/use-toast";

interface ProvidersProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ProvidersProps) {
  return <ToastProviderComponent>{children}</ToastProviderComponent>;
}
