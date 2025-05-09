import { useContext } from 'react';
import { ScanContext, ScanContextType } from '@/contexts/scan-context';

/**
 * Custom hook that provides access to the scan context.
 * 
 * This hook enables components to access scan-related functionality including:
 * - Tracking of scanned drums
 * - Managing the current job ID
 * - Handling different scan modes
 * - Processing drum scans
 * - Monitoring pending and processed drum counts
 * 
 * @returns {Object} The scan context object containing all scan-related state and methods
 */
export function useScan(): ScanContextType {
  const context = useContext(ScanContext);
  
  if (context === undefined) {
    throw new Error('useScan must be used within a ScanProvider');
  }
  
  return context;
}
