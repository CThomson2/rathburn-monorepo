import { create } from 'zustand';
import { supabase } from '@/core/lib/supabase/client';
import { Database, Json } from '@/types/supabase';
import { createClient } from "@/core/lib/supabase/client";
import { PostgrestError } from "@supabase/supabase-js";
import { ScanStatus, ScanType } from '@/types/scanner';

type Location = Database["inventory"]["Enums"]["location_type"];

// Updated Task interface: id is now pol_id
export interface PurchaseOrderLineTask {
  id: string; // This will be pol_id
  po_id: string; // Keep po_id for context if needed
  poNumber: string;
  supplier: string;
  item: string;
  totalQuantity: number; // From purchase_order_lines.quantity
  receivedQuantity: number; // Calculated from purchase_order_drums linked to this pol_id
  remainingQuantity: number;
}

// Interface for the actual shape of the objects returned by the get_pending_purchase_orders RPC
interface RpcPendingPurchaseOrderLine {
  pol_id: string; // Essential for unique task ID
  po_id: string;
  po_number: string;
  supplier: string; // This is s.name
  order_date: string;
  status: string;
  eta_date: string | null;
  item: string; // This is i.name
  quantity: number; // This is pol.quantity
}

// Interface for the data fetched from the new SQL view v_purchase_order_drum_details
export interface DrumDetail {
  pod_id: string | null;
  serial_number: string | null;
  pol_id: string | null;
  is_received: boolean | null;
  item_name: string | null; // Added for context, though it will be the same for all drums in this task
  // Add other fields from the view if needed for display
}

// Define an interface for the session metadata
interface SessionMetadata {
  type: string;
  task_id: string | null; // This is pol_id
  po_id?: string | null; // Optional parent po_id for context
  location?: Location | null;
}

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
  session?: { id: string; name: string; metadata?: SessionMetadata | null }; // Use SessionMetadata
  error?: string;
}

interface EndSessionResponse {
  success: boolean;
  message?: string;
  error?: string;
}

interface CheckActiveSessionResponse {
  success: boolean;
  session?: { 
    id: string; 
    location: Location | null; 
    name?: string; 
    metadata?: SessionMetadata | null; // Use SessionMetadata
    started_at?: string; // Add started_at here if your API returns it
  }; 
  error?: string;
}

// Define the state structure for the store
interface SessionState {
  currentSessionId: string | null;
  currentSessionName: string | null;
  currentSessionTaskId: string | null; // Stores the linked pol_id for the active session
  isScanning: boolean;
  lastScanStatus: 'success' | 'error' | 'idle' | 'ignored';
  lastScanMessage: string | null;
  lastScanId: string | null;
  currentLocation: Location | null;
  isInitializing: boolean;
  sessionStartTime: Date | null;
  showSessionReport: boolean;
  sessionReportData: SessionReportData | null;

  availableTasks: PurchaseOrderLineTask[];
  selectedTaskId: string | null; // This will be pol_id
  showTaskSelectionModal: boolean;
  isFetchingTasks: boolean;
  scannedDrumsForCurrentTask: string[]; // Tracks serial numbers for the active task
  activeTaskDrumDetails: DrumDetail[]; // Detailed drum info for the active task from the view

  setCurrentLocation: (location: Location | null) => void;
  syncSessionStateOnMount: () => Promise<void>;
  fetchPurchaseOrderTasks: () => Promise<void>;
  fetchActiveTaskDrumDetails: (polId: string) => Promise<void>; // New action
  selectTask: (taskId: string) => void; // taskId will be pol_id
  openTaskSelectionModal: () => void;
  closeTaskSelectionModal: () => void;
  startSession: () => void;
  confirmStartSession: () => Promise<void>;
  endSession: () => Promise<void>; // endSession might need to be async if it calls API
  processScan: (barcode: string) => Promise<void>; // No detailed ScanResponse needed by caller
  closeSessionReport: () => void;
}

const SESSIONS_API_ENDPOINT = '/api/scanner/sessions';
const END_SESSION_API_ENDPOINT_TEMPLATE = '/api/scanner/sessions/{sessionId}/end';

function getDeviceId(): string {
  // Ensure VITE_DEVICE_ID is a valid UUID or handle its conversion/generation appropriately.
  // For now, we're directly using it. If it's not a UUID, the backend will fail.
  // A more robust solution would generate a UUID client-side if one isn't available or persist one.
  return import.meta.env.VITE_DEVICE_ID || '00000000-0000-0000-0000-000000000000'; // Fallback to a nil UUID if env var is missing
}

// type InventoryTables = Database['inventory']['Tables'];
// type PublicTables = Database['public']['Tables'];
// type PurchaseOrderDrumRow = InventoryTables['purchase_order_drums']['Row'];
// type StocktakeSessionRow = PublicTables['sessions']['Row']; // Not directly used for insert type shape, insert type is inferred or explicit

export const useSessionStore = create<SessionState>((set, get) => ({
  currentSessionId: null,
  currentSessionName: null,
  currentSessionTaskId: null,
  isScanning: false,
  lastScanStatus: 'idle',
  lastScanMessage: 'Initializing...',
  lastScanId: null,
  currentLocation: null,
  isInitializing: true,
  sessionStartTime: null,
  showSessionReport: false,
  sessionReportData: null,
  availableTasks: [],
  selectedTaskId: null,
  showTaskSelectionModal: false,
  isFetchingTasks: false,
  scannedDrumsForCurrentTask: [],
  activeTaskDrumDetails: [], // Initialize

  setCurrentLocation: (location) => set({ currentLocation: location }),

  fetchPurchaseOrderTasks: async () => {
    console.log("[SessionStore] Fetching purchase order tasks (lines)...");
    set({ isFetchingTasks: true });
    try {
      const supabase = createClient();
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_pending_purchase_orders') as { data: RpcPendingPurchaseOrderLine[] | null; error: PostgrestError | null };

      if (rpcError) {
        console.error("Error fetching PO lines (tasks) from RPC:", rpcError);
        throw rpcError;
      }

      const tasks: PurchaseOrderLineTask[] = [];
      if (rpcData) {
        for (const line of rpcData) {
          const { data: drumsData, error: drumsError } = await supabase
            .schema('inventory')
            .from('purchase_order_drums')
            .select('serial_number, is_received', { count: 'exact' })
            .eq('pol_id', line.pol_id)
            .eq('is_received', true);
          
          let receivedCount = 0;
          if (drumsError) {
            console.warn(`[SessionStore] Error fetching received drums for pol_id ${line.pol_id}:`, drumsError);
          } else {
            receivedCount = drumsData?.length || 0;
          }
          tasks.push({
            id: line.pol_id, 
            po_id: line.po_id,
            poNumber: line.po_number,
            supplier: line.supplier,
            item: line.item,
            totalQuantity: line.quantity,
            receivedQuantity: receivedCount,
            remainingQuantity: line.quantity - receivedCount,
          });
        }
      }
      set({ availableTasks: tasks, isFetchingTasks: false });
    } catch (error) {
      console.error("[SessionStore] Failed to fetch tasks:", error);
      set({ isFetchingTasks: false, availableTasks: [] });
    }
  },

  // TODO: Yet to be implemented
  fetchProductionTasks: async () => {
    console.log("[SessionStore] Fetching production tasks...");
    set({ isFetchingTasks: true });
    try {
      // const supabase = createClient();
    } catch (error) {
      console.error("[SessionStore] Failed to fetch production tasks:", error);
      set({ isFetchingTasks: false, availableTasks: [] });
    }
  },

  fetchActiveTaskDrumDetails: async (polId: string) => {
    if (!polId) return;
    console.log(`[SessionStore] Fetching drum details for active task (pol_id): ${polId}`);
    set({ isFetchingTasks: true }); // Can use a more specific loading state if needed
    try {
      const supabase = createClient();
      // Query the new view
      const { data, error } = await supabase
        .from('v_purchase_order_drum_details') // Ensure this view is in the public schema or adjust as needed
        .select('pod_id, serial_number, pol_id, is_received, item_name')
        .eq('pol_id', polId)
        .order('serial_number'); 
      console.log(`[SessionStore] Drum details for pol_id ${polId}:`, data);
      if (error) {
        console.error("Error fetching drum details from view:", error);
        throw error;
      }
      set({ activeTaskDrumDetails: data || [], isFetchingTasks: false });
    } catch (error) {
      console.error("Failed to fetch drum details:", error);
      set({ activeTaskDrumDetails: [], isFetchingTasks: false });
    }
  },

  selectTask: (taskId) => set({ selectedTaskId: taskId }),

  openTaskSelectionModal: () => {
    set({ showTaskSelectionModal: true });
    if (get().availableTasks.length === 0 && !get().isFetchingTasks) {
      get().fetchPurchaseOrderTasks();
    }
  },

  closeTaskSelectionModal: () => set({ showTaskSelectionModal: false, selectedTaskId: null }),
  
  startSession: () => {
    get().openTaskSelectionModal();
  },

  confirmStartSession: async () => {
    const { selectedTaskId, currentLocation } = get(); // selectedTaskId is pol_id
    if (!selectedTaskId) {
      console.warn("[SessionStore] No task selected to start session.");
      set({showTaskSelectionModal: false}); // Close modal if no task selected
      return;
    }

    console.log(`[SessionStore] Confirming start session for task (pol_id): ${selectedTaskId}`);
    set({ isScanning: true, lastScanStatus: 'idle', lastScanMessage: 'Starting session...', showTaskSelectionModal: false, activeTaskDrumDetails: [], scannedDrumsForCurrentTask: [] }); // Reset drums for new task session

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("[SessionStore] Auth error getting user for session start:", userError);
      set({ isScanning: false, lastScanStatus: 'error', lastScanMessage: 'Authentication error.' });
      return;
    }

    const deviceIdToUse = getDeviceId(); // Uses VITE_DEVICE_ID or nil UUID
    const currentTaskDetails = get().availableTasks.find(task => task.id === selectedTaskId);

    const sessionMetadata: SessionMetadata = {
      type: 'transport_receiving',
      task_id: selectedTaskId,
      po_id: currentTaskDetails?.po_id || null,
      location: currentLocation || null,
    };

    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions') // public schema assumed by default if not specified
        .insert({
          created_by: user.id,
          device_id: deviceIdToUse, // Ensure this is a valid UUID or null if column allows
          name: `PO Line: ${currentTaskDetails?.item || selectedTaskId}`, // More descriptive name
          status: 'in_progress',
          started_at: new Date().toISOString(),
          metadata: sessionMetadata as unknown as Json, // Cast to unknown first, then to Json
        })
        .select('id, name, metadata') // Select needed fields
        .single();

      if (sessionError) {
        console.error("Error creating session in DB:", sessionError);
        throw sessionError;
      }

      if (sessionData && typeof sessionData.metadata === 'object' && sessionData.metadata !== null) {
        const metadata = sessionData.metadata as unknown as SessionMetadata; // Cast to unknown, then to SessionMetadata
        set({
          currentSessionId: sessionData.id,
          currentSessionName: sessionData.name,
          currentSessionTaskId: metadata.task_id,
          isScanning: true, // Session is active for scanning
          sessionStartTime: new Date(),
          lastScanMessage: `Session for ${sessionData.name} started.`,
          scannedDrumsForCurrentTask: [], // Reset for new session
          selectedTaskId: null, // Clear selection
        });
        if (metadata.task_id) {
          get().fetchActiveTaskDrumDetails(metadata.task_id); // Fetch drums for the new session's task
        }
      } else {
        throw new Error("Session data or metadata not returned/valid after insert.");
      }
    } catch (error) {
      console.error("Error in confirmStartSession:", error);
      set({ isScanning: false, lastScanStatus: 'error', lastScanMessage: 'Failed to start session.' });
    }
  },
  
  syncSessionStateOnMount: async () => {
    console.log("[SessionStore] Syncing session state on mount...");
    set({ isInitializing: true });
    const { data: { session: authTokenSession }, error: authErr } = await supabase.auth.getSession();
    const token = authTokenSession?.access_token;

    if (authErr || !token) {
      console.error('[SessionStore] Auth error syncing state:', authErr);
      set({ isInitializing: false, lastScanStatus: 'idle', lastScanMessage: 'Auth error.', currentSessionId: null, currentLocation: null, currentSessionTaskId: null });
      return;
    }

    try {
      // This API call is to your custom backend endpoint, not directly to Supabase tables here
      const response = await fetch(`${import.meta.env.VITE_API_URL}${SESSIONS_API_ENDPOINT}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const result: CheckActiveSessionResponse = await response.json();

      if (response.ok && result.success && result.session && typeof result.session.id === 'string') {
        const activeSession = result.session;
        // Check if metadata is a non-null object before asserting its type
        const metadata = (typeof activeSession.metadata === 'object' && activeSession.metadata !== null) 
                         ? activeSession.metadata as unknown as SessionMetadata 
                         : null;
        console.log(`[SessionStore] Active session ${activeSession.id} found. Syncing state.`);
        set(state => ({
          isInitializing: false,
          currentSessionId: activeSession.id,
          currentSessionName: activeSession.name || null,
          currentSessionTaskId: metadata?.task_id || null,
          currentLocation: activeSession.location ?? state.currentLocation,
          sessionStartTime: activeSession.started_at ? new Date(activeSession.started_at) : new Date(), // Attempt to get start time
          lastScanMessage: 'Resumed active session.',
          isScanning: true, // If session active, assume scanning is enabled
          scannedDrumsForCurrentTask: [] // Reset initially, fetch if task_id present
        }));
        if (metadata?.task_id) {
          get().fetchActiveTaskDrumDetails(metadata.task_id); // Fetch drums for resumed session's task
        }
      } else {
        console.log("[SessionStore] No active session found. Initializing as ready.");
        set({ isInitializing: false, currentSessionId: null, currentLocation: null, currentSessionName: null, currentSessionTaskId: null, lastScanMessage: 'Ready.', isScanning: false });
      }
    } catch (error: unknown) {
      console.error('[SessionStore] Error during initial session state sync:', error);
      set({ isInitializing: false, currentSessionId: null, currentLocation: null, currentSessionName: null, currentSessionTaskId: null, lastScanStatus: 'error', lastScanMessage: 'Error syncing.', isScanning: false });
    }
  },

  endSession: async () => {
    const { currentSessionId, currentSessionName, sessionStartTime, currentSessionTaskId, currentLocation } = get();
    if (!currentSessionId) {
      set({ lastScanMessage: 'No active session to end.' });
      return;
    }
    console.log(`[SessionStore] Attempting to end session: ${currentSessionId}`);
    set({ isScanning: true, lastScanMessage: 'Ending session...' }); // Indicate ending process

    const { data: { session: authTokenSession }, error: authErr } = await supabase.auth.getSession();
    const token = authTokenSession?.access_token;
    if (authErr || !token) {
      console.error("[SessionStore] Auth error ending session:", authErr);
      // Still end locally
      set({ isScanning: false, currentSessionId: null, currentSessionName: null, sessionStartTime: null, currentSessionTaskId: null, lastScanStatus: 'error', lastScanMessage: 'Auth error. Session ended locally.', scannedDrumsForCurrentTask: [], activeTaskDrumDetails: [] });
      return;
    }

    try {
      const endpoint = END_SESSION_API_ENDPOINT_TEMPLATE.replace('{sessionId}', currentSessionId);
      const apiResponse = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        method: 'PATCH', // Assuming PATCH to update session status to 'completed'
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        // Body might be needed if your API expects it, e.g., { status: 'completed' }
      });
      const result: EndSessionResponse = await apiResponse.json();

      if (apiResponse.ok && result.success) {
        console.log(`[SessionStore] Session ${currentSessionId} ended successfully on server.`);
        // Logic for session report data generation (simplified)
        const endTime = new Date();
        let durationString = 'N/A';
        if (sessionStartTime) {
          const durationMs = endTime.getTime() - new Date(sessionStartTime).getTime();
          const minutes = Math.floor(durationMs / 60000);
          const seconds = Math.floor((durationMs % 60000) / 1000);
          durationString = `${minutes}m ${seconds}s`;
        }
        
        const reportData: SessionReportData = {
          duration: durationString,
          scanCount: get().scannedDrumsForCurrentTask.length,
          scannedBarcodes: get().scannedDrumsForCurrentTask.map(bc => ({ id: bc, raw_barcode: bc })), // Simplified
          xpStart: 0, // Placeholder
          xpEnd: get().scannedDrumsForCurrentTask.length * 10, // Placeholder
          currentLevel: 1, // Placeholder
          sessionName: currentSessionName || undefined,
        };
        set({
          isScanning: false, currentSessionId: null, currentSessionName: null, sessionStartTime: null, currentSessionTaskId: null,
          lastScanStatus: 'idle', lastScanMessage: result.message || 'Session ended.',
          showSessionReport: true, sessionReportData: reportData, scannedDrumsForCurrentTask: [], activeTaskDrumDetails: []
        });
      } else {
        console.error(`[SessionStore] Failed to end session ${currentSessionId} on server:`, result.error || `Status ${apiResponse.status}`);
        // Still end locally but indicate server error
        set({ isScanning: false, currentSessionId: null, currentSessionName: null, sessionStartTime: null, currentSessionTaskId: null, lastScanStatus: 'error', lastScanMessage: `Ended locally. Server error: ${result.error || `Status ${apiResponse.status}`}`, scannedDrumsForCurrentTask: [], activeTaskDrumDetails: [] });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error ending session';
      console.error('[SessionStore] Error in endSession:', message);
      set({ isScanning: false, currentSessionId: null, currentSessionName: null, sessionStartTime: null, currentSessionTaskId: null, lastScanStatus: 'error', lastScanMessage: `Ended locally. Client error: ${message}`, scannedDrumsForCurrentTask: [], activeTaskDrumDetails: [] });
    }
  },

  // TODO: Add location logic to front end session logic and always pass location to the scan
  processScan: async (barcode: string) => {
    const { currentSessionId, currentSessionTaskId, scannedDrumsForCurrentTask, activeTaskDrumDetails, currentLocation } = get();
    const supabase = createClient(); // Get supabase client instance
    const { data: { user }, error: userError } = await supabase.auth.getUser(); // Get user earlier for logging

    if (!currentSessionId || !currentSessionTaskId) {
      console.warn("[SessionStore] processScan called without active session or task.");
      set({ lastScanStatus: 'error', lastScanMessage: 'No active session or task for scan.' });
      // Log error scan to public.session_scans if user context is available
      if (user) {
        await supabase.from('session_scans').insert({
          session_id: currentSessionId,
          raw_barcode: barcode,
          scan_status: 'error' as ScanStatus,
          scan_action: 'process' as ScanType, // Or determine appropriate action type based on context
          error_message: 'No active session or task for scan.',
          user_id: user.id,
          device_id: getDeviceId(),
          pol_id: currentSessionTaskId
        });
      }
      return;
    }
    if (scannedDrumsForCurrentTask.includes(barcode)){
      const message = `Drum ${barcode} already scanned for this task.`;
      set({ lastScanStatus: 'error', lastScanMessage: message });
       // Log error scan to public.session_scans
      if (user) {
         await supabase.from('session_scans').insert({
          session_id: currentSessionId,
          raw_barcode: barcode,
          scan_status: 'error' as ScanStatus,
          scan_action: 'check_in' as ScanType, // TODO: Add more if checks for barcodes in process, transport tasks etc.
          error_message: message,
          user_id: user.id,
          device_id: getDeviceId(),
          pol_id: currentSessionTaskId
        });
      }
      return;
    }

    set({ isScanning: true, lastScanMessage: `Processing ${barcode}...` }); // Indicate specific scan processing

    // Removed auth token check here as 'user' object is already fetched and checked if null

    if (userError || !user) {
      console.error("[SessionStore] Auth error for scan:", userError);
      set({ isScanning: false, lastScanStatus: 'error', lastScanMessage: 'Authentication error.' });
       // Log error scan to public.session_scans (session_id might be null here if initial auth failed earlier)
      await supabase.from('session_scans').insert({
        session_id: currentSessionId,
        raw_barcode: barcode,
        scan_status: 'error' as ScanStatus,
        scan_action: 'process' as ScanType,
        error_message: 'Authentication error.',
        user_id: user?.id || undefined, // Use user ID if available
        device_id: getDeviceId(),
        pol_id: currentSessionTaskId
      });
      return;
    }

    let scanResult: { status: ScanStatus; message: string; pod_id?: string | null; item_name?: string | null; error?: PostgrestError | Error | null } = {
      status: 'error',
      message: 'Scan processing failed unexpectedly.',
      error: null,
    };


    try {
      // Find the purchase_order_drum by serial_number AND pol_id (currentSessionTaskId)
      const { data: drumData, error: drumError } = await supabase
        .schema('inventory')
        .from('purchase_order_drums')
        .select('pod_id, serial_number, is_received, pol_id') // REMOVED item_id fetch here
        .eq('serial_number', barcode)
        .eq('pol_id', currentSessionTaskId) // Ensure drum belongs to the current task (pol_id)
        .maybeSingle();

      if (drumError) {
        console.error("Error checking drum in DB:", drumError);
        scanResult = { status: 'error', message: 'Database error checking drum.', error: drumError };
        throw drumError; // Throw to be caught below for logging
      }

      if (!drumData) {
        const message = `Drum ${barcode} not part of current task.`;
        console.log(message);
        scanResult = { status: 'error', message: message, error: new Error(message) };
        // Don't throw here, let it proceed to finally block for logging
      } else {
          // Drum found, proceed to update
          const { error: updateError } = await supabase
            .schema('inventory')
            .from('purchase_order_drums')
            .update({ is_received: true })
            .eq('pod_id', drumData.pod_id);

          if (updateError) {
            console.error("Error updating drum in DB:", updateError);
             scanResult = { status: 'error', message: 'Database error updating drum.', error: updateError };
            throw updateError; // Throw to be caught below for logging
          }

          // Get item name from existing drum details if possible
          const existingDrumDetail = activeTaskDrumDetails.find(d => d.pod_id === drumData.pod_id);
          const itemName: string | null = existingDrumDetail?.item_name || null;

          const message = `Drum ${barcode} received.`;
          console.log(`${message} for task ${currentSessionTaskId}.`);
          scanResult = { status: 'success', message: message, pod_id: drumData.pod_id, item_name: itemName };

           // Update local state immediately for UI responsiveness
          const updatedDrumDetails = activeTaskDrumDetails.map(d =>
            d.serial_number === barcode ? { ...d, is_received: true } : d
          );
          const newScannedDrums = scannedDrumsForCurrentTask.includes(barcode) ? scannedDrumsForCurrentTask : [...scannedDrumsForCurrentTask, barcode];

          set({
            isScanning: false, // Update status locally after DB operations attempt
            lastScanStatus: scanResult.status,
            lastScanMessage: scanResult.message,
            lastScanId: scanResult.pod_id, // Store actual pod_id as lastScanId
            scannedDrumsForCurrentTask: newScannedDrums,
            activeTaskDrumDetails: updatedDrumDetails,
          });

          // Update availableTasks to reflect the new received count for the current task
          const tasks = get().availableTasks.map(task =>
            task.id === currentSessionTaskId
              ? { ...task, receivedQuantity: task.receivedQuantity + 1, remainingQuantity: task.remainingQuantity - 1 }
              : task
          );
          set({ availableTasks: tasks });
      }

    } catch (error) {
      console.error("Error processing scan:", error);
      // Ensure scanResult reflects the error if not already set
      if(scanResult.status !== 'error') {
          scanResult = { status: 'error', message: `Failed to process scan for ${barcode}.`, error: error instanceof Error ? error : new Error(String(error)) };
      }
       set({ isScanning: false, lastScanStatus: 'error', lastScanMessage: scanResult.message });
    } finally {
        // Always attempt to log the scan to public.session_scans
        try {
            const logEntry = {
                session_id: currentSessionId,
                raw_barcode: barcode,
                scan_status: scanResult.status,
                // Determine scan_action based on context if possible, default to 'process' or 'check_in' for now
                scan_action: 'check_in' as ScanType, 
                error_message: scanResult.status === 'error' ? scanResult.message : null,
                user_id: user.id, // User is confirmed non-null by this point if no early return
                device_id: getDeviceId(),
                pol_id: currentSessionTaskId,
                pod_id: scanResult.pod_id, // Will be null if drum not found or error occurred before finding it
                item_name: scanResult.item_name, // Use item name from scanResult (derived from activeTaskDrumDetails)
            };
            const { error: logError } = await supabase.from('session_scans').insert(logEntry);
            if (logError) {
                console.error("[SessionStore] CRITICAL: Failed to log scan result to public.session_scans:", logError, logEntry);
                 // Optionally update UI state to indicate logging failure?
                // set({ lastScanMessage: `${scanResult.message} (Logging Failed)` });
            } else {
                 console.log("[SessionStore] Scan result logged to public.session_scans:", logEntry);
            }
        } catch (logCatchError) {
             console.error("[SessionStore] CRITICAL: Exception during scan logging:", logCatchError);
        }

        // Ensure scanning state is set to false if not already done
        if (get().isScanning) {
          set({ isScanning: false });
        }
    }
  },

  closeSessionReport: () => set({ showSessionReport: false, sessionReportData: null }),
}));

// Optional: Early sync call. Consider if App.tsx is a better place.
// useSessionStore.getState().syncSessionStateOnMount(); 