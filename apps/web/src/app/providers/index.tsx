"use client";

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./theme-provider";
import { queryConfig } from "@/lib/react-query";

// Create a client instance outside the component
const queryClient = new QueryClient({ defaultOptions: queryConfig });

/**
 * The QueryClientProvider wrapper provides the React Query context to its child components, allowing
 * them to use hooks like useQuery and useMutation to manage server state.
 * It initializes a QueryClient instance, which handles caching, background updates,
 * and synchronization of server data.
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
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
