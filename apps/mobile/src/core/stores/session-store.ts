import { create } from 'zustand';
import { supabase } from '@/core/lib/supabase/client';
import { Database } from '@/core/types/supabase';
import { handleScan, ScanResponse } from '@/features/scanner/services/stocktake-scan';
import { createClient } from "@/core/lib/supabase/client";

type Location = Database["inventory"]["Enums"]["location_type"];

// Interface for the structure of a task displayed in the selection modal
export interface PurchaseOrderTask {
  id: string; // Corresponds to po_id
  poNumber: string; // Corresponds to po_number
  supplier: string;
  item: string; // Main material/item description for the PO
  totalQuantity: number; // Total drums/items for this PO (e.g., po.quantity)
  receivedQuantity: number;
  remainingQuantity: number;
  // Add any other fields needed for display, e.g., orderDate, etaDate
}

// Interfaces from previous store (can be reused or adapted)
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
  session?: { id: string; name: string; purchase_order_id?: string | null }; // Include purchase_order_id
  error?: string;
}

interface EndSessionResponse {
  success: boolean;
  message?: string;
  error?: string;
}

interface CheckActiveSessionResponse {
  success: boolean;
  session?: { id: string; location: Location | null; name?: string; purchase_order_id?: string | null }; // Include name and po_id
  error?: string;
}

interface Task {
  id: string;
  poNumber: string;
  supplier: string;
  item: string;
  totalQuantity: number;
  receivedQuantity: number;
}

// Define the state structure for the store
interface SessionState {
  currentSessionId: string | null;
  currentSessionName: string | null;
  currentSessionTaskId: string | null; // Stores the linked purchase_order_id for the active session
  isScanning: boolean;
  lastScanStatus: 'success' | 'error' | 'idle';
  lastScanMessage: string | null;
  lastScanId: string | null;
  currentLocation: Location | null;
  isInitializing: boolean;
  sessionStartTime: Date | null;
  showSessionReport: boolean;
  sessionReportData: SessionReportData | null;

  // New state for task management
  availableTasks: Task[];
  selectedTaskId: string | null; // The po_id selected in the modal before starting session
  showTaskSelectionModal: boolean;
  isFetchingTasks: boolean;
  scannedDrums: string[];

  // Actions
  setCurrentLocation: (location: Location | null) => void;
  syncSessionStateOnMount: () => Promise<void>;
  fetchPurchaseOrderTasks: () => Promise<void>;
  selectTask: (taskId: string) => void;
  openTaskSelectionModal: () => void;
  closeTaskSelectionModal: () => void;
  startSession: () => void;
  confirmStartSession: () => Promise<void>;
  endSession: () => void;
  processScan: (barcode: string) => Promise<void>;
  closeSessionReport: () => void;
}

// API Endpoints
const SESSIONS_API_ENDPOINT = '/api/scanner/stocktake/sessions'; // Generic endpoint for GET (active), POST (start)
const END_SESSION_API_ENDPOINT_TEMPLATE = '/api/scanner/stocktake/sessions/{sessionId}/end';

function getDeviceId(): string {
  return import.meta.env.VITE_DEVICE_ID;
}

type InventoryTables = Database['inventory']['Tables'];
type PublicTables = Database['public']['Tables'];
type PurchaseOrderDrum = InventoryTables['purchase_order_drums']['Row'];
type StocktakeSession = PublicTables['stocktake_sessions']['Row'];

export const useSessionStore = create<SessionState>((set, get) => ({
  // Initial State
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
  scannedDrums: [],

  // Actions
  setCurrentLocation: (location) => set({ currentLocation: location }),

  fetchPurchaseOrderTasks: async () => {
    console.log("[SessionStore] Fetching purchase order tasks...");
    set({ isFetchingTasks: true });
    try {
      const supabase = createClient();

      // Fetch tasks using our RPC function
      const { data: tasksData, error: tasksError } = await supabase
        .rpc('get_pending_purchase_orders');

      if (tasksError) {
        console.error("Error fetching tasks:", tasksError);
        return;
      }

      // Transform the data into our Task interface format
      const tasks = await Promise.all((tasksData as { 
        po_id: string;
        po_number: string;
        supplier: string;
        item: string;
      }[]).map(async (task) => {
        // Get drums for this task to calculate progress
        const { data: drumsData } = await supabase
          .schema('inventory')
          .from('purchase_order_drums')
          .select('is_received')
          .eq('po_id', task.po_id);

        const totalQuantity = drumsData?.length || 0;
        const receivedQuantity = drumsData?.filter(d => d.is_received).length || 0;

        return {
          id: task.po_id,
          poNumber: task.po_number,
          supplier: task.supplier,
          item: task.item,
          totalQuantity,
          receivedQuantity,
        };
      }));

      set({ availableTasks: tasks });
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      set({ isFetchingTasks: false });
    }
  },

  selectTask: (taskId) => set({ selectedTaskId: taskId }),

  openTaskSelectionModal: () => {
    set({ showTaskSelectionModal: true });
    // Fetch tasks if not already loaded or if a refresh is desired
    if (get().availableTasks.length === 0 && !get().isFetchingTasks) {
      get().fetchPurchaseOrderTasks();
    }
  },

  closeTaskSelectionModal: () => set({ showTaskSelectionModal: false, selectedTaskId: null }), // Clear selected task on close
  
  startSession: () => {
    set({ showTaskSelectionModal: true });
  },

  confirmStartSession: async () => {
    const state = get();
    if (!state.selectedTaskId) return;

    try {
      const supabase = createClient();

      // Get the device ID
      const deviceId = navigator.userAgent;

      // Create a new session record
      const { data: sessionData, error: sessionError } = await supabase
        .from('stocktake_sessions')
        .insert({
          created_by: (await supabase.auth.getUser()).data.user?.id || '',
          device_id: deviceId,
          name: `Transport Session ${new Date().toISOString()}`,
          status: 'in_progress',
          started_at: new Date().toISOString(),
          metadata: {
            type: 'transport',
            task_id: state.selectedTaskId,
          },
        })
        .select()
        .single();

      if (sessionError) {
        console.error("Error creating session:", sessionError);
        return;
      }

      // Update state with new session
      set({
        currentSessionId: sessionData.id,
        currentSessionTaskId: state.selectedTaskId,
        isScanning: true,
        showTaskSelectionModal: false,
        selectedTaskId: null,
      });

    } catch (error) {
      console.error("Error confirming session:", error);
    }
  },
  
  syncSessionStateOnMount: async () => {
    console.log("[SessionStore] Syncing session state on mount...");
    set({ isInitializing: true });
    const { data: { session: authTokenSession }, error: sessionError } = await supabase.auth.getSession();
    const token = authTokenSession?.access_token;

    if (sessionError || !token) {
      console.error('[SessionStore] Auth error syncing state:', sessionError);
      set({ isInitializing: false, lastScanStatus: 'idle', lastScanMessage: 'Auth error.', currentSessionId: null, currentLocation: null, currentSessionTaskId: null });
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}${SESSIONS_API_ENDPOINT}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const result: CheckActiveSessionResponse = await response.json();

      if (response.ok && result.success && result.session && typeof result.session.id === 'string') {
        const activeSession = result.session;
        console.log(`[SessionStore] Active session ${activeSession.id} found. Syncing state.`);
        set(state => ({
          isInitializing: false,
          currentSessionId: activeSession.id,
          currentSessionName: activeSession.name || null, // Sync name
          currentSessionTaskId: activeSession.purchase_order_id || null, // Sync task ID
          currentLocation: activeSession.location ?? state.currentLocation,
          lastScanMessage: 'Resumed active session.',
          // sessionStartTime would ideally be fetched from the server for an existing session
        }));
      } else {
        console.log("[SessionStore] No active session found. Initializing as ready.");
        set({ isInitializing: false, currentSessionId: null, currentLocation: null, currentSessionName: null, currentSessionTaskId: null, lastScanMessage: 'Ready.' });
      }
    } catch (error: unknown) {
      console.error('[SessionStore] Error during initial session state sync:', error);
      set({ isInitializing: false, currentSessionId: null, currentLocation: null, currentSessionName: null, currentSessionTaskId: null, lastScanStatus: 'error', lastScanMessage: 'Error syncing.' });
    }
  },

  endSession: () => {
    set({
      currentSessionId: null,
      currentSessionTaskId: null,
      isScanning: false,
      scannedDrums: [],
      selectedTaskId: null,
    });
  },

  processScan: async (barcode: string) => {
    const state = get();
    if (!state.isScanning || !state.currentSessionTaskId) return;

    try {
      const supabase = createClient();
      
      // Check if the scanned barcode matches a drum in the current task
      const { data: drumData, error: drumError } = await supabase
        .schema('inventory')
        .from('purchase_order_drums')
        .select('pod_id, serial_number, is_received')
        .eq('serial_number', barcode)
        .single();

      if (drumError) {
        console.error("Error checking drum:", drumError);
        return;
      }

      if (!drumData) {
        console.log("No matching drum found for barcode:", barcode);
        return;
      }

      // Update the drum as received
      const { error: updateError } = await supabase
        .schema('inventory')
        .from('purchase_order_drums')
        .update({ is_received: true })
        .eq('pod_id', drumData.pod_id);

      if (updateError) {
        console.error("Error updating drum:", updateError);
        return;
      }

      // Add to scanned drums if not already present
      if (!state.scannedDrums.includes(barcode)) {
        set({ scannedDrums: [...state.scannedDrums, barcode] });
      }

    } catch (error) {
      console.error("Error processing scan:", error);
    }
  },

  closeSessionReport: () => set({ showSessionReport: false, sessionReportData: null }),
}));

// Optional: Early sync call. Consider if App.tsx is a better place.
// useSessionStore.getState().syncSessionStateOnMount(); 