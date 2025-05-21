import React, { useState, useEffect } from "react";
import { fetchDrumSerialsByBatchId } from "@/app/actions/batches";

interface DrumSerialsListProps {
  batchId: string;
}

export function DrumSerialsList({ batchId }: DrumSerialsListProps) {
  const [serials, setSerials] = useState<Array<{ serial_number: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!batchId) return;
    async function loadSerials() {
      try {
        setIsLoading(true);
        const fetchedSerials = await fetchDrumSerialsByBatchId(batchId);
        setSerials(fetchedSerials);
        setError(null);
      } catch (err) {
        console.error(`Failed to fetch serials for batch ${batchId}:`, err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        setSerials([]);
      }
      setIsLoading(false);
    }
    loadSerials();
  }, [batchId]);

  if (isLoading) {
    return (
      <p className="p-4 text-sm text-muted-foreground">
        Loading drum serials...
      </p>
    );
  }

  if (error) {
    return (
      <p className="p-4 text-sm text-destructive">
        Error loading serials: {error}
      </p>
    );
  }

  if (serials.length === 0) {
    return (
      <p className="p-4 text-sm text-muted-foreground">
        No drum serials found for this batch.
      </p>
    );
  }

  return (
    <div className="p-4 bg-muted/50">
      <h4 className="mb-2 text-sm font-semibold">Drum Serial Numbers:</h4>
      <ul className="list-disc list-inside space-y-1 text-sm">
        {serials.map((s, index) => (
          <li key={`${s.serial_number}-${index}`}>{s.serial_number}</li>
        ))}
      </ul>
    </div>
  );
}
