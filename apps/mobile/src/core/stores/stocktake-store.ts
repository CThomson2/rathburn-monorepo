import { create } from 'zustand';
import { supabase } from '@/core/lib/supabase/client';
import { Database } from '@/core/types/supabase';
import { handleStockTakeScan, StocktakeScanResponse } from '@/features/scanner/services/stocktake-scan';

type Location = Database["inventory"]["Enums"]["location_type"];

// Interfaces from use-stocktake.ts
interface SessionReportData {
  duration: string;
  scanCount: number;
  scannedBarcodes: Array<{ id: string; raw_barcode: string }>;
  xpStart: number;
  xpEnd: number;
  currentLevel: number;
  sessionName?: string;
}

interface StartSessionResponse {
  success: boolean;
  session?: { id: string; name: string; };
  error?: string;
}

interface EndSessionResponse {
  success: boolean;
  message?: string;
  error?: string;
}

interface CheckActiveSessionResponse {
  success: boolean;
  session?: { id: string; location: Location | null };
  error?: string;
}

// Define the state structure for the store
interface StocktakeState {
  currentSessionId: string | null;
  currentSessionName: string | null;
  isScanning: boolean; // Indicates an API call is in progress (start/end session, process scan)
  lastScanStatus: 'success' | 'error' | 'idle';
  lastScanMessage: string | null;
  lastScanId: string | null;
  currentLocation: Location | null;
  isInitializing: boolean; // For the initial session check
  sessionStartTime: Date | null;
  showSessionReport: boolean;
  sessionReportData: SessionReportData | null;

  // Actions
  setCurrentLocation: (location: Location | null) => void;
  syncSessionStateOnMount: () => Promise<void>;
  startStocktakeSession: () => Promise<void>;
  endStocktakeSession: () => Promise<void>;
  processStocktakeScan: (barcode: string) => Promise<StocktakeScanResponse | undefined>;
  closeSessionReport: () => void;
}

// API Endpoints (from use-stocktake.ts)
const SESSION_ENDPOINT = '/api/scanner/stocktake/sessions';
const END_SESSION_ENDPOINT = '/api/scanner/stocktake/sessions/{sessionId}/end';

function getDeviceId(): string {
  return import.meta.env.VITE_DEVICE_ID;
}

export const useStocktakeStore = create<StocktakeState>((set, get) => ({
  // Initial State
  currentSessionId: null,
  currentSessionName: null,
  isScanning: false,
  lastScanStatus: 'idle',
  lastScanMessage: 'Initializing...',
  lastScanId: null,
  currentLocation: null,
  isInitializing: true,
  sessionStartTime: null,
  showSessionReport: false,
  sessionReportData: null,

  // Actions
  setCurrentLocation: (location) => set({ currentLocation: location }),

  syncSessionStateOnMount: async () => {
    console.log("[StocktakeStore] Syncing session state on mount...");
    set({ isInitializing: true });

    const { data: { session: authTokenSession }, error: sessionError } = await supabase.auth.getSession();
    const token = authTokenSession?.access_token;

    if (sessionError || !token) {
      console.error('[StocktakeStore] Auth error syncing state:', sessionError);
      set({
        isInitializing: false,
        lastScanStatus: 'idle',
        lastScanMessage: 'Auth error. Ready for new session.',
        currentSessionId: null,
        currentLocation: null,
      });
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}${SESSION_ENDPOINT}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const result: CheckActiveSessionResponse = await response.json();

      if (response.ok && result.success && result.session && typeof result.session.id === 'string') {
        const activeSession = result.session;
        console.log(`[StocktakeStore] Active session ${activeSession.id} found. Syncing state.`);
        set(state => ({
          isInitializing: false,
          currentSessionId: activeSession.id,
          currentLocation: activeSession.location ?? state.currentLocation,
          lastScanMessage: 'Resumed active session.',
          // Potentially fetch session name and start time if not returned by START
        }));
      } else {
        console.log("[StocktakeStore] No active session found. Initializing as ready.");
        set({
          isInitializing: false,
          currentSessionId: null,
          currentLocation: null,
          lastScanMessage: 'Ready to start new session.',
        });
      }
    } catch (error: unknown) {
      console.error('[StocktakeStore] Error during initial session state sync:', error);
      set({
        isInitializing: false,
        currentSessionId: null,
        currentLocation: null,
        lastScanStatus: 'error',
        lastScanMessage: 'Error checking session status. Ready to start.',
      });
    }
  },

  startStocktakeSession: async () => {
    console.log(`[StocktakeStore] Attempting to start new session...`);
    set({
      isScanning: true,
      lastScanStatus: 'idle',
      lastScanMessage: 'Starting session...',
      showSessionReport: false,
      sessionReportData: null,
    });

    const { data: { session: authTokenSession }, error: sessionError } = await supabase.auth.getSession();
    const token = authTokenSession?.access_token;

    if (sessionError || !token) {
      console.error('[StocktakeStore] Auth error starting session:', sessionError);
      set({ isScanning: false, lastScanStatus: 'error', lastScanMessage: 'Auth error. Failed to start.' });
      return;
    }

    try {
      const { currentLocation } = get();
      const requestBody = currentLocation ? { location: currentLocation } : {};
      const response = await fetch(`${import.meta.env.VITE_API_URL}${SESSION_ENDPOINT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(requestBody),
      });

      const result: StartSessionResponse = await response.json();
      if (response.ok && result.success && result.session) {
        console.log(`[StocktakeStore] Session started successfully: ${result.session.id}`);
        set({
          isScanning: false,
          currentSessionId: result.session!.id,
          currentSessionName: result.session!.name,
          sessionStartTime: new Date(),
          lastScanStatus: 'idle',
          lastScanMessage: `Session '${result.session!.name}' started.`,
        });
      } else {
        console.error('[StocktakeStore] Failed to start session:', result.error || `Status ${response.status}`);
        set({
          isScanning: false,
          lastScanStatus: 'error',
          lastScanMessage: result.error || `Failed to start session (Status: ${response.status})`,
          currentSessionId: null,
        });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error starting session';
      console.error('[StocktakeStore] Error in startStocktakeSession:', message);
      set({
        isScanning: false,
        lastScanStatus: 'error',
        lastScanMessage: message,
        currentSessionId: null,
      });
    }
  },

  endStocktakeSession: async () => {
    const { currentSessionId, currentSessionName, sessionStartTime } = get();

    if (!currentSessionId) {
      console.warn('[StocktakeStore] endStocktakeSession called without an active session ID.');
      set({ lastScanMessage: 'No active session to end.' });
      return;
    }

    console.log(`[StocktakeStore] Attempting to end session: ${currentSessionId}`);
    set({ isScanning: true, lastScanMessage: 'Ending session...' });

    const { data: { session: authTokenSession }, error: sessionError } = await supabase.auth.getSession();
    const token = authTokenSession?.access_token;

    if (sessionError || !token) {
      console.error('[StocktakeStore] Auth error ending session:', sessionError);
      set({ isScanning: false, currentSessionId: null, currentSessionName: null, sessionStartTime: null, lastScanStatus: 'error', lastScanMessage: 'Auth error. Session ended locally.' });
      return;
    }

    try {
      const endpoint = END_SESSION_ENDPOINT.replace('{sessionId}', currentSessionId);
      const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      });
      const result: EndSessionResponse = await response.json();

      if (response.ok && result.success) {
        console.log(`[StocktakeStore] Session ${currentSessionId} ended successfully on server.`);

        const endTime = new Date();
        let durationString = 'N/A';
        if (sessionStartTime) {
          const durationMs = endTime.getTime() - sessionStartTime.getTime();
          const minutes = Math.floor(durationMs / 60000);
          const seconds = Math.floor((durationMs % 60000) / 1000);
          durationString = `${minutes}m ${seconds}s`;
        }

        let scannedItems: Array<{ id: string; raw_barcode: string }> = [];
        let scanCount = 0;

        try {
          const { data: scans, error: scansError } = await supabase
            .from('stocktake_scans')
            .select('id, raw_barcode')
            .eq('stocktake_session_id', currentSessionId);

          if (scansError) {
            console.error('[StocktakeStore] Error fetching stocktake scans:', scansError);
          } else if (scans) {
            scannedItems = scans;
            scanCount = scans.length;
          }
        } catch (fetchError) {
          console.error('[StocktakeStore] Exception fetching stocktake scans:', fetchError);
        }

        const xpPerScan = 10;
        const xpGainedThisSession = scanCount * xpPerScan;
        const currentLevelBeforeSession = 1; // Placeholder
        const currentXPBeforeSession = 0;   // Placeholder
        const totalXPAfterSession = currentXPBeforeSession + xpGainedThisSession;
        const newLevel = Math.floor(totalXPAfterSession / 100) + currentLevelBeforeSession;
        const xpForNextLevel = 100;
        const xpStartForProgressBar = (currentXPBeforeSession % xpForNextLevel);
        let xpEndForProgressBar = (totalXPAfterSession % xpForNextLevel);
        if (newLevel > currentLevelBeforeSession && xpGainedThisSession > 0) {
             xpEndForProgressBar = xpEndForProgressBar === 0 ? 100 : xpEndForProgressBar;
        } else if (xpGainedThisSession === 0) {
            xpEndForProgressBar = xpStartForProgressBar;
        }

        const reportData: SessionReportData = {
          duration: durationString,
          scanCount: scanCount,
          scannedBarcodes: scannedItems,
          xpStart: xpStartForProgressBar,
          xpEnd: xpEndForProgressBar,
          currentLevel: newLevel,
          sessionName: currentSessionName || undefined,
        };

        set({
          isScanning: false,
          currentSessionId: null,
          currentSessionName: null,
          sessionStartTime: null,
          lastScanStatus: 'idle',
          lastScanMessage: result.message || 'Session ended successfully.',
          showSessionReport: true,
          sessionReportData: reportData,
        });
      } else {
        console.error(`[StocktakeStore] Failed to end session ${currentSessionId} on server:`, result.error || `Status ${response.status}`);
        set({
          isScanning: false,
          currentSessionId: null, // Still end locally
          currentSessionName: null,
          sessionStartTime: null,
          lastScanStatus: 'error',
          lastScanMessage: `Ended locally. Server error: ${result.error || `Status ${response.status}`}`,
        });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error ending session';
      console.error('[StocktakeStore] Error in endStocktakeSession:', message);
      set({
        isScanning: false,
        currentSessionId: null, // Still end locally
        currentSessionName: null,
        sessionStartTime: null,
        lastScanStatus: 'error',
        lastScanMessage: `Ended locally. Client error: ${message}`,
      });
    }
  },

  processStocktakeScan: async (barcode) => {
    const { currentSessionId, currentLocation } = get();
    if (!currentSessionId) {
      console.warn('[StocktakeStore] Scan processed called without active session.');
      set({ lastScanStatus: 'error', lastScanMessage: 'No active stocktake session.' });
      return undefined;
    }

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (sessionError || !token) {
      console.error('[StocktakeStore] Authentication error for scan:', sessionError);
      set({
        isScanning: false,
        lastScanStatus: 'error',
        lastScanMessage: 'Authentication error processing scan.',
      });
      return undefined;
    }

    console.log(`[StocktakeStore] Processing scan for session ${currentSessionId}: ${barcode}`);
    set({ isScanning: true, lastScanStatus: 'idle' }); // Indicate processing scan

    const deviceId = getDeviceId();
    const payload = { barcode, sessionId: currentSessionId, deviceId, location: currentLocation };
    const scanResponseData = await handleStockTakeScan(payload, token);

    set(state => ({
      isScanning: false, // Done with this specific scan API call
      lastScanStatus: scanResponseData.success ? 'success' : 'error',
      lastScanMessage: scanResponseData.message || null,
      lastScanId: scanResponseData.scanId || state.lastScanId,
    }));
    
    console.log(`[StocktakeStore] Scan completed with status: ${scanResponseData.success ? 'success' : 'error'}`);
    
    const enhancedResponse = {
      ...scanResponseData,
      timestamp: new Date().toISOString(),
      sessionId: currentSessionId,
      location: currentLocation,
      barcode
    };
    return enhancedResponse;
  },

  closeSessionReport: () => set({ showSessionReport: false, sessionReportData: null }),
}));

// Optional: Initialize the session check when the store is first imported/used.
// This ensures that an active session is checked for as early as possible.
// Note: This runs when the module is loaded, not necessarily when a component first uses the store.
// For more control, you might call syncSessionStateOnMount from your main App component's useEffect.
// useStocktakeStore.getState().syncSessionStateOnMount(); 