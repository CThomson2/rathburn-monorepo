"use client";

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./theme-provider";
import { queryConfig } from "@/lib/react-query";
import { AuthProvider } from "@/context/auth-context";

// Create a client instance outside the component
const queryClient = new QueryClient({ defaultOptions: queryConfig });

/**
 * Providers wrapper that includes:
 * - QueryClientProvider: For React Query data fetching
 * - ThemeProvider: For theme management
 * - AuthProvider: For authentication state management
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AuthProvider>{children}</AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
