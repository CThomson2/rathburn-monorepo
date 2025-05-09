import { useState, useCallback } from 'react';

interface ScanResult {
  barcode: string;
  timestamp: string;
  success: boolean;
}

/**
 * NOT IN USE
 * 
 * Hook for managing scan job state
 */
export function useScanJob() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);

  const clearJob = useCallback(() => {
    setJobId(null);
    setLastScan(null);
  }, []);

  const startJob = useCallback((id: string) => {
    setJobId(id);
    setLastScan(null);
  }, []);

  return {
    jobId,
    setJobId: startJob,
    clearJob,
    lastScan,
    setLastScan,
  };
} 