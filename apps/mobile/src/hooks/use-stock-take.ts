import { useState, useCallback, useEffect } from 'react';
// Remove useAuth import as we'll get token directly
// import { useAuth } from './useAuth'; 
import { handleStockTakeScan, StocktakeScanResponse } from '../services/stockTakeScan';
import { supabase } from '@/lib/supabase/client'; // Import the singleton supabase client
import { Database } from '@/types/supabase';

// Define location type
type Location = Database["inventory"]["Enums"]["location_type"];

// Define API endpoint for starting a session
const START_SESSION_ENDPOINT = '/api/scanner/stocktake/sessions/start'; // Relative to web app
const END_SESSION_ENDPOINT_TEMPLATE = '/api/scanner/stocktake/sessions/{sessionId}/end'; // Template for ending

// Interface for the start session API response
interface StartSessionResponse {
    success: boolean;
    session?: { id: string; name: string; /* other fields if needed */ };
    error?: string;
}

// Interface for the end session API response (can be simple)
interface EndSessionResponse {
    success: boolean;
    message?: string;
    error?: string;
}

// Define the state structure for the hook
interface UseStockTakeState {
  currentSessionId: string | null;
  isScanning: boolean;
  lastScanStatus: 'success' | 'error' | 'idle';
  lastScanMessage: string | null;
  lastScanId: string | null; // Store the ID of the last successful scan
  currentLocation: Location | null;
}

// Define the return type of the hook
interface UseStockTakeReturn extends UseStockTakeState {
  startStocktakeSession: () => Promise<void>;
  endStocktakeSession: () => void;
  processStocktakeScan: (barcode: string) => Promise<StocktakeScanResponse | undefined>; // Updated return type
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
 * - currentLocation: Current selected location for the stocktake session.
 * 
 * @param location - Optional location parameter to associate with scans
 * @returns UseStockTakeReturn object containing state and functions
 */
export function useStockTake(location: Location | null = null): UseStockTakeReturn {
  // Remove useAuth hook call
  // const { token } = useAuth(); 
  const [state, setState] = useState<UseStockTakeState>({
    currentSessionId: null,
    isScanning: false,
    lastScanStatus: 'idle',
    lastScanMessage: null,
    lastScanId: null,
    currentLocation: location,
  });

  // Update location in state when the prop changes using useEffect
  useEffect(() => {
    if (location !== state.currentLocation) {
      console.log(`[useStockTake] Location updated to: ${location}`);
      setState(prevState => ({
        ...prevState,
        currentLocation: location
      }));
    }
  }, [location, state.currentLocation]);

  // Updated startStocktakeSession function
  const startStocktakeSession = useCallback(async () => {
    console.log(`[useStockTake] Attempting to start new session...`);
    setState((prevState) => ({ ...prevState, isScanning: true, lastScanStatus: 'idle' }));

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
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
        // Add location info to request if available
        const requestBody = state.currentLocation ? { location: state.currentLocation } : {};
        
        const response = await fetch(`${import.meta.env.VITE_API_URL}${START_SESSION_ENDPOINT}`, {
            method: 'POST',
            headers: {
                 'Content-Type': 'application/json',
                 'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(requestBody), // Include location if available
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

  }, [state.currentLocation]); // Add dependency on currentLocation

  const endStocktakeSession = useCallback(async () => { // Make async
    const sessionId = state.currentSessionId;
    if (!sessionId) {
      console.warn('[useStockTake] endStocktakeSession called without an active session.');
      return; // No session to end
    }

    console.log(`[useStockTake] Attempting to end session: ${sessionId}`);
    // Optionally set a temporary state like 'ending'
    // setState((prevState) => ({ ...prevState, lastScanMessage: 'Ending session...' }));

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (sessionError || !token) {
      console.error('[useStockTake] Authentication error fetching token for end session:', sessionError);
      // Update state locally anyway, but show an error message
      setState((prevState) => ({
        ...prevState,
        currentSessionId: null,
        lastScanStatus: 'error',
        lastScanMessage: 'Session ended locally, but failed to sync with server (auth error).',
      }));
      return;
    }

    try {
      const endpoint = END_SESSION_ENDPOINT_TEMPLATE.replace('{sessionId}', sessionId);
      const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        method: 'PATCH', // Use PATCH as defined in the API route
        headers: {
          'Content-Type': 'application/json', // Although no body, Content-Type is good practice
          'Authorization': `Bearer ${token}`,
        },
        // No body needed for this PATCH request
      });

      const result: EndSessionResponse = await response.json();

      if (response.ok && result.success) {
        console.log(`[useStockTake] Session ${sessionId} successfully marked as completed on server.`);
        setState((prevState) => ({
          ...prevState,
          currentSessionId: null,
          lastScanStatus: 'idle',
          lastScanMessage: result.message || 'Session ended successfully.',
        }));
      } else {
        // Handle API errors (e.g., session not found, server error)
        throw new Error(result.error || `Failed to end session on server (status: ${response.status})`);
      }

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error ending session on server';
      console.error('[useStockTake] Error ending session via API:', error);
      // End the session locally but inform the user about the sync failure
      setState((prevState) => ({
        ...prevState,
        currentSessionId: null, // Still end locally
        lastScanStatus: 'error',
        lastScanMessage: `Session ended locally, but failed to sync with server: ${message}`,
      }));
    }

  }, [state.currentSessionId]); // Dependency on currentSessionId

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
      // Include location information if available
      location: state.currentLocation,
    };

    const response = await handleStockTakeScan(payload, token); // Pass the fetched token

    setState((prevState) => ({
      ...prevState,
      isScanning: false,
      lastScanStatus: response.success ? 'success' : 'error',
      lastScanMessage: response.message || null,
      lastScanId: response.scanId || prevState.lastScanId,
    }));

    console.log(`[useStockTake] Scan completed with status: ${response.success ? 'success' : 'error'}`);
    
    // Return the scan response (could be useful for immediate UI updates)
    return response;
  }, [state.currentSessionId, state.currentLocation]); // Add dependency on currentLocation

  return {
    ...state,
    startStocktakeSession,
    endStocktakeSession,
    processStocktakeScan,
  };
} 