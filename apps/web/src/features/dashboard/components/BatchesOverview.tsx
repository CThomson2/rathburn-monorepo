import React, { useState, useEffect } from 'react';
import { fetchActiveBatches, BatchDataFromView } from '@/app/actions/batches';
import { BatchesTableDisplay } from './BatchesTableDisplay'; // To be created
import { AlertTriangle } from 'lucide-react';

export function BatchesOverview() {
  const [batches, setBatches] = useState<BatchDataFromView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBatches() {
      try {
        setIsLoading(true);
        const fetchedBatches = await fetchActiveBatches();
        setBatches(fetchedBatches);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch batches:", err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setBatches([]);
      }
      setIsLoading(false);
    }
    loadBatches();
  }, []);

  if (isLoading) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        Loading batches...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/15 p-4 text-destructive flex items-center">
        <AlertTriangle className="h-5 w-5 mr-2" />
        <p>Error loading batches: {error}</p>
      </div>
    );
  }

  if (batches.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        No active batches found (with total volume > 0).
      </div>
    );
  }

  return <BatchesTableDisplay batches={batches} />;
}
