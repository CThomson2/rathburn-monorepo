import { ArrowUpDown, Filter } from "lucide-react";
import { useState } from "react";

import { BatchesTable } from "./batches-table";
import { Button } from "@/components/ui/button";
import { useBatches } from "@/hooks/use-batches";
import { BatchesFilter } from "./batches-filter";

export default function BatchesContent() {
  const { batches, isLoading, error } = useBatches();
  const [showFilters, setShowFilters] = useState(false);

  if (error) {
    return (
      <div className="rounded-md bg-destructive/15 p-4 text-destructive">
        <p>Error loading batches: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="h-9"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          {batches && !isLoading && (
            <p className="text-sm text-muted-foreground">
              {batches.length} batch{batches.length !== 1 ? "es" : ""} found
            </p>
          )}
        </div>
      </div>

      {showFilters && <BatchesFilter />}

      <BatchesTable batches={batches || []} isLoading={isLoading} />
    </div>
  );
}
