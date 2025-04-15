import { Metadata } from "next";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { AlertCircle } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/core/ui/alert";

export const metadata: Metadata = {
  title: "Data Explorer | Rathburn",
  description:
    "Explore and analyze data with a comprehensive spreadsheet-style interface and modular query builder.",
};

// Dynamically import the DataExplorerPage component with error handling
const DataExplorerPage = dynamic(
  () =>
    import("@/features/data-explorer").catch(() => () => (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Data Explorer Unavailable</AlertTitle>
        <AlertDescription>
          This feature is currently under construction and may not be available.
          Please check back later.
        </AlertDescription>
      </Alert>
    )),
  {
    loading: () => (
      <div className="p-8 text-center">Loading Data Explorer...</div>
    ),
    ssr: false,
  }
);

export default async function Page() {
  return (
    <Suspense
      fallback={<div className="p-8 text-center">Loading Data Explorer...</div>}
    >
      <DataExplorerPage />
    </Suspense>
  );
}
