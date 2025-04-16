"use client";

import dynamic from "next/dynamic";
import { AlertCircle } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/core/ui/alert";

// Dynamically import the DataExplorerPage component with error handling in a client component
const DataExplorerPage = dynamic(
  () => import("@/features/data-explorer").then(mod => mod.default).catch((error) => {
    console.error("Error loading Data Explorer:", error);
    return () => (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Data Explorer Unavailable</AlertTitle>
        <AlertDescription>
          This feature is currently under construction and may not be available.
          Please check back later.
        </AlertDescription>
      </Alert>
    );
  }),
  {
    loading: () => (
      <div className="p-8 text-center">Loading Data Explorer...</div>
    ),
    ssr: false,
  }
);

export default function DataExplorerClient() {
  return <DataExplorerPage />;
}