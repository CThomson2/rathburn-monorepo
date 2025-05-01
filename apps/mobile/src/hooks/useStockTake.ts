import { useState, useCallback } from 'react';
// Remove useAuth import as we'll get token directly
// import { useAuth } from './useAuth'; 
import { handleStockTakeScan, StocktakeScanResponse } from '../services/stockTakeScan';
import { createAuthClient } from '@/lib/supabase/client'; // Import supabase client

// Define the state structure for the hook
interface UseStockTakeState {
  currentSessionId: string | null;
  isScanning: boolean;
  lastScanStatus: 'success' | 'error' | 'idle';
  lastScanMessage: string | null;
  lastScanId: string | null; // Store the ID of the last successful scan
}

// Define the return type of the hook
interface UseStockTakeReturn extends UseStockTakeState {
  startStocktakeSession: (sessionId: string) => void;
  endStocktakeSession: () => void;
  processStocktakeScan: (barcode: string) => Promise<void>; // Make async for potential awaits
}

// Function to get a placeholder or actual device ID
// TODO: Implement actual device ID retrieval if needed
function getDeviceId(): string {
    // Placeholder - implement logic to get a unique device ID if required by API
    // return navigator.userAgent || 'unknown_device'; 
    return '4f096e70-33fd-4913-9df1-8e1fae9591bc';
}

/**
 * Custom hook to manage stocktake sessions and process barcode scans.
 *
 * This hook provides state management and functions for starting and ending
 * stocktake sessions, as well as processing barcode scans within an active
 * session. It handles authentication, device identification, and communicates
 * with the backend API for scan processing.
 *
 * State Variables:
 * - currentSessionId: ID of the active stocktake session.
 * - isScanning: Indicates if a scan is currently being processed.
 * - lastScanStatus: Status of the last scan ('success', 'error', or 'idle').
 * - lastScanMessage: Message associated with the last scan result.
 * - lastScanId: ID of the last successful scan.
 *
 * Returns:
 * - startStocktakeSession: Function to initiate a new stocktake session.
 * - endStocktakeSession: Function to terminate the current stocktake session.
 * - processStocktakeScan: Async function to process a barcode scan.
 */
export function useStockTake(): UseStockTakeReturn {
  // Remove useAuth hook call
  // const { token } = useAuth(); 
  const [state, setState] = useState<UseStockTakeState>({
    currentSessionId: null,
    isScanning: false,
    lastScanStatus: 'idle',
    lastScanMessage: null,
    lastScanId: null,
  });

  const startStocktakeSession = useCallback((sessionId: string) => {
    console.log(`[useStockTake] Starting session: ${sessionId}`);
    setState((prevState) => ({
      ...prevState,
      currentSessionId: sessionId,
      lastScanStatus: 'idle', // Reset status on new session
      lastScanMessage: null,
      lastScanId: null,
    }));
  }, []);

  const endStocktakeSession = useCallback(() => {
    console.log(`[useStockTake] Ending session: ${state.currentSessionId}`);
    setState((prevState) => ({
      ...prevState,
      currentSessionId: null,
    }));
  }, [state.currentSessionId]); // Include dependency

  const processStocktakeScan = useCallback(async (barcode: string) => {
    if (!state.currentSessionId) {
      console.warn('[useStockTake] Scan processed called without active session.');
      setState((prevState) => ({
        ...prevState,
        lastScanStatus: 'error',
        lastScanMessage: 'No active stocktake session.',
      }));
      return;
    }

    // Get Supabase client and current session token directly
    const supabase = createAuthClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (sessionError || !token) { // Check for token directly from session
        console.error('[useStockTake] Authentication error or no token found:', sessionError);
        setState((prevState) => ({
            ...prevState,
            isScanning: false, // Ensure isScanning is reset
            lastScanStatus: 'error',
            lastScanMessage: 'Authentication error. Please ensure you are logged in.',
        }));
        return;
    }

    console.log(`[useStockTake] Processing scan for session ${state.currentSessionId}: ${barcode}`);
    setState((prevState) => ({ ...prevState, isScanning: true, lastScanStatus: 'idle' }));

    const deviceId = getDeviceId();
    const payload = {
      barcode,
      sessionId: state.currentSessionId,
      deviceId,
    };

    const response = await handleStockTakeScan(payload, token); // Pass the fetched token

    setState((prevState) => ({
      ...prevState,
      isScanning: false,
      lastScanStatus: response.success ? 'success' : 'error',
      lastScanMessage: response.message || response.error || (response.success ? 'Scan successful' : 'Scan failed'),
      lastScanId: response.success ? response.scanId || null : prevState.lastScanId,
    }));
    
    console.log(`[useStockTake] Scan result:`, response);

  // state.currentSessionId is the only dependency needed now for this callback
  }, [state.currentSessionId]); 

  return {
    ...state,
    startStocktakeSession,
    endStocktakeSession,
    processStocktakeScan,
  };
} 