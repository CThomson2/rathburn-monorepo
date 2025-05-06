import { useState, useCallback, useEffect } from 'react';
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
const CHECK_ACTIVE_SESSION_ENDPOINT = '/api/scanner/stocktake/sessions'; // Consolidated GET endpoint

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

// Interface for the active session check API response
interface CheckActiveSessionResponse {
    success: boolean;
    session?: { id: string; location: Location | null }; // Expect id and location
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
  isInitializing: boolean; // Add initializing state
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
    lastScanMessage: null,
    lastScanId: null,
    currentLocation: initialLocation, // Use the prop for initial state
    isInitializing: true, // Start in initializing state
  });

  // Effect to check for active session on mount
  useEffect(() => {
    const checkForActiveSession = async () => {
      console.log("[useStockTake] Checking for active session on mount...");
      setState(prevState => ({ ...prevState, isInitializing: true, currentLocation: null }));

      const { data: { session: authTokenSession }, error: sessionError } = await supabase.auth.getSession();
      const token = authTokenSession?.access_token;

      if (sessionError || !token) {
        console.error('[useStockTake] Auth error fetching token for active session check:', sessionError);
        setState(prevState => ({
          ...prevState,
          isInitializing: false,
          lastScanStatus: 'error',
          lastScanMessage: 'Auth error checking session status. Ready for new session.',
          currentSessionId: null, // Ensure no session is active in UI
        }));
        return;
      }

      const deviceId = getDeviceId();

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}${CHECK_ACTIVE_SESSION_ENDPOINT}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            // 'X-Device-ID': deviceId, // Already handled by GET endpoint logic if needed
          },
        });

        const result: CheckActiveSessionResponse = await response.json();

        if (response.ok && result.success) {
          if (result.session && result.session.id) {
            const activeSessionIdToClose = result.session.id;
            console.log(`[useStockTake] Active session ${activeSessionIdToClose} found on mount. Attempting to end it programmatically.`);

            const endEndpoint = END_SESSION_ENDPOINT_TEMPLATE.replace('{sessionId}', activeSessionIdToClose);
            try {
              const endResponse = await fetch(`${import.meta.env.VITE_API_URL}${endEndpoint}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
              });
              const endResult: EndSessionResponse = await endResponse.json();
              if (endResponse.ok && endResult.success) {
                console.log(`[useStockTake] Programmatically ended old session ${activeSessionIdToClose}.`);
                setState(prevState => ({
                  ...prevState,
                  currentSessionId: null,
                  isInitializing: false,
                  lastScanMessage: 'Cleaned up old session. Ready for new session.',
                  currentLocation: null, // Reset location as well
                }));
              } else {
                // Log error but still treat as no active session for UI consistency
                console.error(`[useStockTake] Failed to programmatically end session ${activeSessionIdToClose}:`, endResult.error || `Status ${endResponse.status}`);
                setState(prevState => ({
                  ...prevState,
                  currentSessionId: null,
                  isInitializing: false,
                  lastScanStatus: 'error',
                  lastScanMessage: `Failed to clean up old session: ${endResult.error || 'Unknown error'}. Ready for new session.`,
                  currentLocation: null,
                }));
              }
            } catch (programmaticEndError: unknown) {
              console.error('[useStockTake] Error during programmatic session end:', programmaticEndError instanceof Error ? programmaticEndError.message : String(programmaticEndError));
              setState(prevState => ({
                ...prevState,
                currentSessionId: null,
                isInitializing: false,
                lastScanStatus: 'error',
                lastScanMessage: `Error cleaning up old session: ${programmaticEndError instanceof Error ? programmaticEndError.message : String(programmaticEndError)}. Ready for new session.`,
                currentLocation: null,
              }));
            }
          } else {
            console.log("[useStockTake] No active session found on mount. Ready for new session.");
            setState(prevState => ({ 
              ...prevState, 
              isInitializing: false, 
              currentSessionId: null, 
              currentLocation: null, // Ensure location is reset if no session
              lastScanMessage: 'No active session found. Ready to start.'
            }));
          }
        } else {
          // If checking for active session fails, assume no active session for UI consistency
          console.error('[useStockTake] Failed to check for active session:', result.error || `Status ${response.status}`);
          setState(prevState => ({
            ...prevState,
            isInitializing: false,
            lastScanStatus: 'error',
            lastScanMessage: `Error checking session status: ${result.error || 'Unknown error'}. Ready for new session.`,
            currentSessionId: null,
            currentLocation: null,
          }));
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error checking session';
        console.error('[useStockTake] Error checking for active session:', error);
        setState(prevState => ({
          ...prevState,
          isInitializing: false,
          lastScanStatus: 'error',
          lastScanMessage: message,
          currentSessionId: null,
          currentLocation: null,
        }));
      }
    };

    checkForActiveSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update location in state when the prop changes using useEffect
  useEffect(() => {
    // Only update if not initializing and location prop differs from state
    if (!state.isInitializing && initialLocation !== state.currentLocation) {
      console.log(`[useStockTake] Location prop updated to: ${initialLocation}`);
      setState(prevState => ({
        ...prevState,
        currentLocation: initialLocation
      }));
      // TODO: If an API call is needed to update the *active session's* location,
      //       it should be triggered here if state.currentSessionId exists.
    }
  }, [initialLocation, state.currentLocation, state.isInitializing]);

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

    // Update state with scan result
    setState((prevState) => ({
      ...prevState,
      isScanning: false,
      lastScanStatus: response.success ? 'success' : 'error',
      lastScanMessage: response.message || null,
      lastScanId: response.scanId || prevState.lastScanId,
    }));

    console.log(`[useStockTake] Scan completed with status: ${response.success ? 'success' : 'error'}`);
    
    // Enhance the response with additional information that might be useful for UI indicators
    const enhancedResponse = {
      ...response,
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