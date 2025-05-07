import { useState, useCallback, useEffect, useMemo } from 'react';
// Remove useAuth import as we'll get token directly
// import { useAuth } from './useAuth'; 
import { handleStockTakeScan, StocktakeScanResponse } from '../services/stockTakeScan';
import { supabase } from '@/lib/supabase/client'; // Import the singleton supabase client
import { Database } from '@/types/supabase';

// Define location type
type Location = Database["inventory"]["Enums"]["location_type"];

// Define API endpoints
const START_SESSION_ENDPOINT = '/api/scanner/stocktake/sessions'; // Consolidated POST endpoint
const END_SESSION_ENDPOINT_TEMPLATE = '/api/scanner/stocktake/sessions/{sessionId}/end';
const CHECK_ACTIVE_SESSION_ENDPOINT = '/api/scanner/stocktake/sessions'; // Re-added for initial state sync
// CHECK_ACTIVE_SESSION_ENDPOINT is no longer needed by the hook
// const CHECK_ACTIVE_SESSION_ENDPOINT = '/api/scanner/stocktake/sessions'; // Consolidated GET endpoint

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

// Re-added for initial state sync
interface CheckActiveSessionResponse {
    success: boolean;
    session?: { id: string; location: Location | null }; 
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
  isInitializing: boolean; // Re-added to prevent UI flicker during initial check
  // isInitializing, showConflictDialog, conflictingSessionId are removed
}

// Define the return type of the hook
interface UseStockTakeReturn extends UseStockTakeState {
  startStocktakeSession: () => Promise<void>;
  endStocktakeSession: () => Promise<void>; // No longer needs optional param
  processStocktakeScan: (barcode: string) => Promise<StocktakeScanResponse | undefined>;
  // forceEndAndRestartSession, cancelConflictDialog are removed
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
 * with the backend API for scan processing. It also checks for an existing
 * active session on mount.
 *
 * State Variables:
 * - currentSessionId: ID of the active stocktake session.
 * - isScanning: Indicates if a scan is currently being processed.
 * - lastScanStatus: Status of the last scan ('success', 'error', or 'idle').
 * - lastScanMessage: Message associated with the last scan result.
 * - lastScanId: ID of the last successful scan.
 * - currentLocation: Current selected location for the stocktake session.
 * - isInitializing: Indicates if the hook is checking for an active session on mount.
 * - showConflictDialog: Indicates whether the conflict dialog should be shown.
 * - conflictingSessionId: ID of the conflicting session, if any.
 * 
 * @param initialLocation - Optional initial location parameter
 * @returns UseStockTakeReturn object containing state and functions
 */
export function useStockTake(initialLocation: Location | null = null): UseStockTakeReturn {
  // Remove useAuth hook call
  // const { token } = useAuth(); 
  const [state, setState] = useState<UseStockTakeState>({
    currentSessionId: null,
    isScanning: false,
    lastScanStatus: 'idle',
    lastScanMessage: 'Initializing...', // Initial message
    lastScanId: null,
    currentLocation: initialLocation,
    isInitializing: true, // Start in initializing state
    // Removed initial state for isInitializing, showConflictDialog, conflictingSessionId
  });

  // Re-added Effect to check for active session on mount just for state sync
  useEffect(() => {
    const syncSessionStateOnMount = async () => {
      console.log("[useStockTake] Syncing session state on mount...");
      // Keep initializing true until check is complete
      setState(prevState => ({ ...prevState, isInitializing: true })); 

      const { data: { session: authTokenSession }, error: sessionError } = await supabase.auth.getSession();
      const token = authTokenSession?.access_token;

      if (sessionError || !token) {
        console.error('[useStockTake] Auth error syncing state on mount:', sessionError);
        setState(prevState => ({
          ...prevState,
          isInitializing: false, // Finished check
          lastScanStatus: 'idle',
          lastScanMessage: 'Auth error. Ready for new session.',
          currentSessionId: null,
          currentLocation: null, // Reset location if no session
        }));
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}${CHECK_ACTIVE_SESSION_ENDPOINT}`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const result: CheckActiveSessionResponse = await response.json();

        if (response.ok && result.success && result.session && typeof result.session.id === 'string') {
          const activeSession = result.session; // Assign to variable for type narrowing
          console.log(`[useStockTake] Active session ${activeSession.id} found on mount. Syncing state.`);
          setState(prevState => ({
            ...prevState,
            isInitializing: false,
            currentSessionId: activeSession.id, 
            // Safely access location, defaulting to previous state's location if null/undefined
            currentLocation: activeSession.location ?? prevState.currentLocation, 
            lastScanMessage: 'Resumed active session.'
          }));
        } else {
          // No active session found or error checking
          console.log("[useStockTake] No active session found on mount. Initializing as ready.");
          setState(prevState => ({
            ...prevState,
            isInitializing: false,
            currentSessionId: null,
            currentLocation: null, // Reset location if no session
            lastScanMessage: 'Ready to start new session.'
          }));
        }
      } catch (error: unknown) {
        console.error('[useStockTake] Error during initial session state sync:', error);
        setState(prevState => ({
          ...prevState,
          isInitializing: false,
          currentSessionId: null,
          currentLocation: null,
          lastScanStatus: 'error',
          lastScanMessage: 'Error checking session status. Ready to start.'
        }));
      }
    };
    syncSessionStateOnMount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Update location prop if it changes externally
  useEffect(() => {
    // Don't update location from prop if we are initializing or already have a session ID
    // Let the initial sync handle the location if a session exists
    if (!state.isInitializing && !state.currentSessionId && initialLocation !== state.currentLocation) {
      console.log(`[useStockTake] Location prop updated externally to: ${initialLocation}`);
      setState(prevState => ({ ...prevState, currentLocation: initialLocation }));
    }
  }, [initialLocation, state.currentLocation, state.isInitializing, state.currentSessionId]);

  // Updated startStocktakeSession function
  const startStocktakeSession = useCallback(async () => {
    console.log(`[useStockTake] Attempting to start new session...`);
    // Set scanning state for UI feedback
    setState((prevState) => ({ ...prevState, isScanning: true, lastScanStatus: 'idle', lastScanMessage: 'Starting session...' }));

    const { data: { session: authTokenSession }, error: sessionError } = await supabase.auth.getSession();
    const token = authTokenSession?.access_token;

    if (sessionError || !token) {
      console.error('[useStockTake] Auth error starting session:', sessionError);
      setState((prevState) => ({ ...prevState, isScanning: false, lastScanStatus: 'error', lastScanMessage: 'Auth error. Failed to start.' }));
      return;
    }
    
    try {
      const requestBody = state.currentLocation ? { location: state.currentLocation } : {};
      const response = await fetch(`${import.meta.env.VITE_API_URL}${START_SESSION_ENDPOINT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(requestBody),
      });

      // Removed 409 conflict check - handled by DB trigger

      const result: StartSessionResponse = await response.json();
      if (response.ok && result.success && result.session) {
        console.log(`[useStockTake] Session started successfully: ${result.session.id}`);
        setState((prevState) => ({
          ...prevState,
          isScanning: false,
          currentSessionId: result.session!.id,
          lastScanStatus: 'idle',
          lastScanMessage: `Session '${result.session!.name}' started.`,
        }));
      } else {
        // Handle other errors (e.g., 500, 400, 401)
        console.error('[useStockTake] Failed to start session:', result.error || `Status ${response.status}`);
        throw new Error(result.error || `Failed to start session (Status: ${response.status})`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error starting session';
      console.error('[useStockTake] Error in startStocktakeSession:', message);
      setState((prevState) => ({ 
        ...prevState, 
        isScanning: false, 
        lastScanStatus: 'error', 
        lastScanMessage: message,
        currentSessionId: null // Ensure session ID is null on failure
      }));
    }
  }, []); // REMOVE state.currentLocation from dependency array

  // Only ends the session currently active in the hook's state
  const endStocktakeSession = useCallback(async (): Promise<void> => {
    const sessionId = state.currentSessionId;
    if (!sessionId) {
      console.warn('[useStockTake] endStocktakeSession called without an active session ID in state.');
      setState(prevState => ({ ...prevState, lastScanMessage: 'No active session to end.'}));
      return;
    }

    console.log(`[useStockTake] Attempting to end session: ${sessionId}`);
    setState(prevState => ({ ...prevState, isScanning: true, lastScanMessage: 'Ending session...' })); 
    
    const { data: { session: authTokenSession }, error: sessionError } = await supabase.auth.getSession();
    const token = authTokenSession?.access_token;

    if (sessionError || !token) {
      console.error('[useStockTake] Auth error ending session:', sessionError);
      // End locally, but indicate sync failure
      setState(prevState => ({ ...prevState, isScanning: false, currentSessionId: null, lastScanStatus: 'error', lastScanMessage: 'Auth error. Ended locally.' }));
      return;
    }

    try {
      const endpoint = END_SESSION_ENDPOINT_TEMPLATE.replace('{sessionId}', sessionId);
      const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      });
      const result: EndSessionResponse = await response.json();

      if (response.ok && result.success) {
        console.log(`[useStockTake] Session ${sessionId} ended successfully on server.`);
        setState(prevState => ({
          ...prevState,
          isScanning: false,
          currentSessionId: null,
          lastScanStatus: 'idle',
          lastScanMessage: result.message || 'Session ended successfully.',
        }));
      } else {
         console.error(`[useStockTake] Failed to end session ${sessionId} on server:`, result.error || `Status ${response.status}`);
        // Even if server fails, end locally for UI consistency
        throw new Error(result.error || `Failed to end session on server (Status: ${response.status})`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error ending session';
      console.error('[useStockTake] Error in endStocktakeSession:', message);
      // End locally but show error
      setState(prevState => ({ 
        ...prevState, 
        isScanning: false, 
        currentSessionId: null, // End locally regardless of server error
        lastScanStatus: 'error', 
        lastScanMessage: `Ended locally. Server error: ${message}` 
      }));
    }
  }, [state.currentSessionId]); // Depends only on currentSessionId from state

  const processStocktakeScan = useCallback(async (barcode: string): Promise<StocktakeScanResponse | undefined> => {
    if (!state.currentSessionId) {
      console.warn('[useStockTake] Scan processed called without active session.');
      setState((prevState) => ({ ...prevState, lastScanStatus: 'error', lastScanMessage: 'No active stocktake session.' }));
      return undefined;
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
        return undefined;
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

    const scanResponseData = await handleStockTakeScan(payload, token); // Pass the fetched token

    // Update state with scan result
    setState((prevState) => ({
      ...prevState,
      isScanning: false,
      lastScanStatus: scanResponseData.success ? 'success' : 'error',
      lastScanMessage: scanResponseData.message || null,
      lastScanId: scanResponseData.scanId || prevState.lastScanId,
    }));

    console.log(`[useStockTake] Scan completed with status: ${scanResponseData.success ? 'success' : 'error'}`);
    
    // Enhance the response with additional information that might be useful for UI indicators
    const enhancedResponse = {
      ...scanResponseData,
      timestamp: new Date().toISOString(),
      sessionId: state.currentSessionId,
      location: state.currentLocation,
      barcode
    };
    
    // Return the enhanced scan response for immediate UI updates
    return enhancedResponse;
  }, [state.currentSessionId, state.currentLocation]); // Add dependency on currentLocation

  return {
    ...state,
    startStocktakeSession,
    endStocktakeSession,
    processStocktakeScan,
  };
} 