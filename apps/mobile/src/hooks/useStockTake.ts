import { useState, useCallback } from 'react';
// Remove useAuth import as we'll get token directly
// import { useAuth } from './useAuth'; 
import { handleStockTakeScan, StocktakeScanResponse } from '../services/stockTakeScan';
import { createClient, createAuthClient } from '@/lib/supabase/client'; // Import supabase client

// Define API endpoint for starting a session
const START_SESSION_ENDPOINT = '/api/stocktake/sessions/start'; // Relative to web app

// Interface for the start session API response
interface StartSessionResponse {
    success: boolean;
    session?: { id: string; name: string; /* other fields if needed */ };
    error?: string;
}

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
  startStocktakeSession: () => Promise<void>;
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

  // Updated startStocktakeSession function
  const startStocktakeSession = useCallback(async () => {
    console.log(`[useStockTake] Attempting to start new session...`);
    setState((prevState) => ({ ...prevState, isScanning: true, lastScanStatus: 'idle' }));

    // const supabase = createClient();
    const supabaseAuth = createAuthClient();
  
    const { data: { session }, error: sessionError } = await supabaseAuth.auth.getSession();
    const token = session?.access_token;

    if (sessionError || !token) {
        console.error('[useStockTake] Authentication error fetching token for start session:', sessionError);
        setState((prevState) => ({
            ...prevState,
            isScanning: false,
            lastScanStatus: 'error',
            lastScanMessage: 'Authentication error. Cannot start session.',
        }));
        return;
    }
    
    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}${START_SESSION_ENDPOINT}`, {
            method: 'POST',
            headers: {
                 'Content-Type': 'application/json',
                 'Authorization': `Bearer ${token}`,
            },
            // No body needed for this simple start request
        });

        const result: StartSessionResponse = await response.json();

        if (response.ok && result.success && result.session) {
             // Assign to a new variable to help TypeScript narrow the type
             const sessionData = result.session;
             if (!sessionData) { // Check the new variable
                 throw new Error('API returned success but session data is missing');
             }
             console.log(`[useStockTake] Session started successfully: ${sessionData.id}`);
             setState((prevState) => ({
                 ...prevState,
                 isScanning: false,
                 currentSessionId: sessionData.id, // Use the new variable
                 lastScanStatus: 'idle',
                 lastScanMessage: `Session '${sessionData.name}' started. Ready to scan.`,
             }));
        } else {
             throw new Error(result.error || 'Failed to start session');
        }

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error starting session';
        console.error('[useStockTake] Error starting session:', error);
        setState((prevState) => ({
            ...prevState,
            isScanning: false,
            lastScanStatus: 'error',
            lastScanMessage: message,
        }));
    }

  }, []); // No dependencies needed as it fetches token fresh each time

  const endStocktakeSession = useCallback(() => {
     console.log(`[useStockTake] Ending session: ${state.currentSessionId}`);
     // Potentially call an API endpoint to mark session as completed in DB
     setState((prevState) => ({
       ...prevState,
       currentSessionId: null,
       lastScanStatus: 'idle', // Reset scan status
       lastScanMessage: 'Session ended.',
     }));
  }, [state.currentSessionId]); 

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
    const supabaseAuth = createAuthClient();
    const { data: { session }, error: sessionError } = await supabaseAuth.auth.getSession();
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