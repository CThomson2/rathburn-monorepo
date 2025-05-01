import { useState, useCallback } from 'react';
import { useAuth } from './useAuth'; // Assuming useAuth provides session/token
import { handleStockTakeScan, StocktakeScanResponse } from '../services/stockTakeScan';

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
    return navigator.userAgent || 'unknown_device'; 
}

export function useStockTake(): UseStockTakeReturn {
  const { token } = useAuth(); // Use token directly from useAuth
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

    if (!token) { // Check for token directly
        console.error('[useStockTake] No auth token available.');
        setState((prevState) => ({
            ...prevState,
            lastScanStatus: 'error',
            lastScanMessage: 'Authentication error. Please log in again.',
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

    const response = await handleStockTakeScan(payload, token); // Pass token directly

    setState((prevState) => ({
      ...prevState,
      isScanning: false,
      lastScanStatus: response.success ? 'success' : 'error',
      lastScanMessage: response.message || response.error || (response.success ? 'Scan successful' : 'Scan failed'),
      lastScanId: response.success ? response.scanId || null : prevState.lastScanId, // Update scan ID on success
    }));
    
    console.log(`[useStockTake] Scan result:`, response);

  }, [state.currentSessionId, token]); // Add token as dependency

  return {
    ...state,
    startStocktakeSession,
    endStocktakeSession,
    processStocktakeScan,
  };
} 