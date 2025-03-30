"use client";

import { DashboardProvider } from "@/context";
import { DashboardContent } from "./content";

/**
 * Client component wrapper for the Dashboard
 * Establishes the client boundary and provides context
 */
export function DashboardWrapper() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
}
