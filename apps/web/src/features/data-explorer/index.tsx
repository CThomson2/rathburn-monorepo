"use client";

import { useState, Suspense } from "react";
import dynamic from "next/dynamic";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/core/ui/tabs";
import { Button } from "@/components/core/ui/button";
import {
  PlusCircle,
  TableProperties,
  Database,
  AlertCircle,
} from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/core/ui/alert";

// Feature flag - enable in all environments unless explicitly disabled
const isFeatureEnabled = process.env.EXCLUDE_DATA_EXPLORER !== "true";

type ViewMode = "spreadsheet" | "query-builder";

// Dynamic imports with error handling
const SpreadsheetView = dynamic(
  () =>
    import("./components/spreadsheet-view")
      .then((mod) => mod.default)
      .catch(() => {
        return () => (
          <FallbackComponent
            title="Spreadsheet View Unavailable"
            message="This feature is currently being built and may not work correctly."
          />
        );
      }),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">
        Loading spreadsheet view...
      </div>
    ),
    ssr: false,
  }
);

const QueryBuilderView = dynamic(
  () =>
    import("./components/query-builder-view")
      .then((mod) => mod.default)
      .catch(() => {
        return () => (
          <FallbackComponent
            title="Query Builder Unavailable"
            message="This feature is currently being built and may not work correctly."
          />
        );
      }),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">
        Loading query builder...
      </div>
    ),
    ssr: false,
  }
);

// Fallback component for when imports fail
function FallbackComponent({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

/**
 * Page component for the data explorer feature.
 *
 * If the feature is disabled, show a message.
 * Otherwise, render a tabbed interface with two views:
 * - Spreadsheet View: a table with data from the database.
 * - Query Builder: an interactive query builder.
 *
 * @returns JSX.Element
 */
function DataExplorerPage() {
  // If feature is disabled, show a message
  if (!isFeatureEnabled) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold">Data Explorer</h2>
            <p className="text-muted-foreground">
              View, query, and analyze your data
            </p>
          </div>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Feature Disabled</AlertTitle>
          <AlertDescription>
            This feature is currently disabled. Please check your environment
            configuration.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const [viewMode, setViewMode] = useState<ViewMode>("spreadsheet");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Data Explorer</h2>
          <p className="text-muted-foreground">
            View, query, and analyze your data
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <PlusCircle className="mr-2 h-4 w-4" />
            Save Query
          </Button>
        </div>
      </div>

      <Tabs
        defaultValue="spreadsheet"
        onValueChange={(value) => setViewMode(value as ViewMode)}
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="spreadsheet">
            <TableProperties className="mr-2 h-4 w-4" />
            Spreadsheet View
          </TabsTrigger>
          <TabsTrigger value="query-builder">
            <Database className="mr-2 h-4 w-4" />
            Query Builder
          </TabsTrigger>
        </TabsList>
        <TabsContent value="spreadsheet" className="mt-6">
          <Suspense
            fallback={
              <div className="flex items-center justify-center p-8">
                Loading spreadsheet view...
              </div>
            }
          >
            <SpreadsheetView />
          </Suspense>
        </TabsContent>
        <TabsContent value="query-builder" className="mt-6">
          <Suspense
            fallback={
              <div className="flex items-center justify-center p-8">
                Loading query builder...
              </div>
            }
          >
            <QueryBuilderView />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default DataExplorerPage;
