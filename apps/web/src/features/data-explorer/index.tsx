"use client";

import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/core/ui/tabs";
import { Button } from "@/components/core/ui/button";
import { PlusCircle, TableProperties, Database } from "lucide-react";
import SpreadsheetView from "./components/spreadsheet-view";
import QueryBuilderView from "./components/query-builder-view";

type ViewMode = "spreadsheet" | "query-builder";

export default function DataExplorerPage() {
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
          <SpreadsheetView />
        </TabsContent>
        <TabsContent value="query-builder" className="mt-6">
          <QueryBuilderView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
