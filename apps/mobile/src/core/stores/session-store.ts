import { create } from 'zustand';
import { supabase } from '@/core/lib/supabase/client';
import { Database, Json } from '@/types/supabase';
import { createClient } from "@/core/lib/supabase/client";
import { PostgrestError } from "@supabase/supabase-js";
import { ScanStatus, ScanType } from '@/types/scanner';

export type SessionType = 'task' | 'free_scan' | 'production_task' | null;

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
export interface RpcPendingPurchaseOrderLine {
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
  item_name: string | null; 
}

// New interface for Production Tasks from the RPC
export interface ProductionTask {
  job_id: string;
  item_name: string;
  status: string; // job_status type from DB
  planned_start: string; // timestamptz
  priority: number;
  input_batch_id: string;
  batch_code: string | null;
  still_code: string | null;
  raw_volume: number | null;
  totalQuantity?: number; 
  processedQuantity?: number; 
  remainingQuantity?: number;
}

// Define an interface for the session metadata
interface SessionMetadata {
  type: 'transport_receiving' | 'free_scan' | 'production_input' | string; // Added production_input
  task_id: string | null; // This is pol_id for transport, job_id for production
  po_id?: string | null; // Optional parent po_id for context
  op_id?: string | null; // Optional operation_id for production context
  location?: Location | null;
  auto_completed: boolean;
  new_session_id?: string | null;
  auto_completed_at?: string | null;
  auto_completed_reason?: string | null;
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
    name?: string | null; // Make name nullable if it can be
    device_id: string | null; // Expect device_id directly
    location: Location | null; 
    metadata?: SessionMetadata | null; 
    started_at?: string | null; // Make started_at nullable if it can be
  }; 
  error?: string;
}

// Define the state structure for the store
interface SessionState {
  currentSessionId: string | null;
  currentSessionName: string | null;
  currentSessionTaskId: string | null; // Stores the linked pol_id for the active session
  sessionType: SessionType; // Added sessionType
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
  availableProductionTasks: ProductionTask[]; // New state for production tasks
  selectedTaskId: string | null; 
  selectedProductionJobId: string | null; // New state for selected production job
  showTaskSelectionModal: boolean;
  taskSelectionModalType: 'transport' | 'production' | null; // To control modal content
  isFetchingTasks: boolean;
  isFetchingProductionTasks: boolean; // Specific loading state
  scannedDrumsForCurrentTask: string[];
  activeTaskDrumDetails: DrumDetail[];
  activeProductionJobDrums: Array<{drum_id: string, serial_number: string, volume_transferred: number}>; // Drums linked to current production job/op

  setCurrentLocation: (location: Location | null) => void;
  syncSessionStateOnMount: () => Promise<void>;
  fetchPurchaseOrderTasks: () => Promise<void>;
  fetchProductionTasks: () => Promise<void>; // New action
  fetchActiveTaskDrumDetails: (polId: string) => Promise<void>; 
  fetchActiveProductionJobDrums: (jobId: string, opId?: string) => Promise<void>; // New action
  selectTask: (taskId: string) => void; 
  selectProductionJob: (jobId: string) => void; // New action
  openTaskSelectionModal: (type: 'transport' | 'production') => void; // Modified
  closeTaskSelectionModal: () => void;
  startSession: (type: 'task' | 'free_scan' | 'production_task') => void; // Modified
  confirmStartSession: () => Promise<void>;
  endSession: () => Promise<void>; 
  processScan: (barcode: string) => Promise<void>; 
  closeSessionReport: () => void;
}

const SESSIONS_API_ENDPOINT = '/api/scanner/sessions';
const END_SESSION_API_ENDPOINT_TEMPLATE = '/api/scanner/sessions/{sessionId}/end';

const DEVICE_ID_STORAGE_KEY = 'app_device_id';

// Function to generate a simple UUID (v4)
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_STORAGE_KEY);
  if (!deviceId) {
    deviceId = (import.meta.env.VITE_DEVICE_ID || generateUUID()) as string;
    localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
    console.log('[SessionStore] New Device ID generated and stored:', deviceId);
  } else {
    // If a VITE_DEVICE_ID is provided and it's different from localStorage, override for dev purposes.
    // This allows a developer to easily simulate being a specific device without clearing localStorage.
    if (import.meta.env.VITE_DEVICE_ID && import.meta.env.VITE_DEVICE_ID !== deviceId) {
      console.warn('[SessionStore] Overriding localStorage Device ID with VITE_DEVICE_ID for development:', import.meta.env.VITE_DEVICE_ID);
      deviceId = import.meta.env.VITE_DEVICE_ID;
      // Optionally, update localStorage to the VITE_DEVICE_ID for consistency during the dev session
      // localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
    }
  }
  return deviceId as string;
}

// type InventoryTables = Database['inventory']['Tables'];
// type PublicTables = Database['public']['Tables'];
// type PurchaseOrderDrumRow = InventoryTables['purchase_order_drums']['Row'];
// type StocktakeSessionRow = PublicTables['sessions']['Row']; // Not directly used for insert type shape, insert type is inferred or explicit

export const useSessionStore = create<SessionState>((set, get) => ({
  currentSessionId: null,
  currentSessionName: null,
  currentSessionTaskId: null,
  sessionType: null, // Initialized sessionType
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
  availableProductionTasks: [], // Init
  selectedTaskId: null,
  selectedProductionJobId: null, // Init
  showTaskSelectionModal: false,
  taskSelectionModalType: null, // Init
  isFetchingTasks: false,
  isFetchingProductionTasks: false, // Init
  scannedDrumsForCurrentTask: [],
  activeTaskDrumDetails: [], 
  activeProductionJobDrums: [], // Init

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
            .eq('is_received', true)
            .order('serial_number', { ascending: false });
          
          let receivedCount = 0;
          if (drumsError) {
            console.warn(`[SessionStore] Error fetching received drums for pol_id ${line.pol_id}:`, drumsError);
          } else {
            receivedCount = drumsData?.length || 0;
          }

          console.log(`[SessionStore] Task Check: PO: ${line.po_number}, Item: ${line.item}, Line Quantity: ${line.quantity}, Received Count: ${receivedCount}`);

          // Only add tasks that are not yet fully completed
          if (line.quantity - receivedCount > 0) {
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
      }
      set({ availableTasks: tasks, isFetchingTasks: false });
    } catch (error) {
      console.error("[SessionStore] Failed to fetch tasks:", error);
      set({ isFetchingTasks: false, availableTasks: [] });
    }
  },

  fetchProductionTasks: async () => {
    console.log("[SessionStore] Fetching production tasks...");
    set({ isFetchingProductionTasks: true });
    try {
      const supabase = createClient();
      // Explicitly type the expected RPC response
      const { data, error } = await supabase.rpc('get_schedulable_production_jobs') as { 
        data: Array<Omit<ProductionTask, 'totalQuantity' | 'processedQuantity' | 'remainingQuantity'>> | null; 
        error: PostgrestError | null 
      };

      if (error) {
        console.error("[SessionStore] Error fetching production tasks from RPC:", error);
        throw error;
      }
      
      const tasks: ProductionTask[] = (data || []).map((job: Omit<ProductionTask, 'totalQuantity' | 'processedQuantity' | 'remainingQuantity'>) => ({
        ...job,
        totalQuantity: job.raw_volume ? Math.ceil(job.raw_volume / 200) : 0, 
        processedQuantity: 0, // Placeholder
        remainingQuantity: job.raw_volume ? Math.ceil(job.raw_volume / 200) : 0, // Placeholder
      })); 
      set({ availableProductionTasks: tasks, isFetchingProductionTasks: false });
    } catch (error) {
      console.error("[SessionStore] Failed to fetch production tasks:", error);
      set({ isFetchingProductionTasks: false, availableProductionTasks: [] });
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

  fetchActiveProductionJobDrums: async (jobId: string, opId?: string) => {
    if (!jobId) return;
    console.log(`[SessionStore] Fetching drums for production job: ${jobId}` + (opId ? `, op: ${opId}` : ''));
    // This would typically fetch from production.operation_drums joined with inventory.drums
    // For now, it's a placeholder if not immediately needed for the first scan step.
    // const supabase = createClient();
    // const {data, error} = await supabase.from('operation_drums').select('*, drums(serial_number)').eq('op_id', relevant_op_id);
    set({ activeProductionJobDrums: [] }); // Placeholder
  },

  selectTask: (taskId) => set({ selectedTaskId: taskId }),
  selectProductionJob: (jobId) => set({ selectedProductionJobId: jobId }), // New setter

  openTaskSelectionModal: (type) => {
    set({ showTaskSelectionModal: true, taskSelectionModalType: type });
    if (type === 'transport' && get().availableTasks.length === 0 && !get().isFetchingTasks) {
      get().fetchPurchaseOrderTasks();
    } else if (type === 'production' && get().availableProductionTasks.length === 0 && !get().isFetchingProductionTasks) {
      get().fetchProductionTasks();
    }
  },

  closeTaskSelectionModal: () => set({ 
    showTaskSelectionModal: false, 
    selectedTaskId: null, 
    selectedProductionJobId: null, // Reset production job selection too
    taskSelectionModalType: null,
    sessionType: get().currentSessionId ? get().sessionType : null 
  }), 
  
  startSession: (type) => {
    set({ sessionType: type }); // Set the overall sessionType first
    if (type === 'task') {
      get().openTaskSelectionModal('transport');
    } else if (type === 'production_task') {
      get().openTaskSelectionModal('production');
    } else { // 'free_scan'
      get().confirmStartSession(); 
    }
  },

  confirmStartSession: async () => {
    const { selectedTaskId, selectedProductionJobId, currentLocation, sessionType } = get(); 

    if (sessionType === 'task' && !selectedTaskId) {
      console.warn("[SessionStore] No transport task selected to start session.");
      set({showTaskSelectionModal: false, sessionType: null}); 
      return;
    }
    if (sessionType === 'production_task' && !selectedProductionJobId) {
      console.warn("[SessionStore] No production job selected to start session.");
      set({showTaskSelectionModal: false, sessionType: null}); 
      return;
    }

    console.log(`[SessionStore] Confirming start session for type: ${sessionType}, task: ${selectedTaskId}, production_job: ${selectedProductionJobId}`);
    set({ 
      isScanning: true, 
      lastScanStatus: 'idle', 
      lastScanMessage: 'Starting session...', 
      showTaskSelectionModal: false, 
      activeTaskDrumDetails: [], 
      scannedDrumsForCurrentTask: [] 
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("[SessionStore] Auth error getting user for session start:", userError);
      set({ isScanning: false, lastScanStatus: 'error', lastScanMessage: 'Authentication error.' });
      return;
    }

    const deviceIdToUse = getDeviceId(); 
    const currentTransportTaskDetails = sessionType === 'task' ? get().availableTasks.find(task => task.id === selectedTaskId) : null;
    const currentProductionJobDetails = sessionType === 'production_task' ? get().availableProductionTasks.find(job => job.job_id === selectedProductionJobId) : null;

    let sessionMetadata: Pick<SessionMetadata, "type" | "task_id" | "po_id" | "op_id" | "location">; // Added op_id
    let sessionName: string;

    if (sessionType === 'free_scan') {
      sessionMetadata = {
        type: 'free_scan',
        task_id: null,
        po_id: null,
        op_id: null, // Null for free_scan
        location: currentLocation || null,
      };
      sessionName = 'Free Scanning Session';
    } else if (sessionType === 'task' && currentTransportTaskDetails) { // Check currentTransportTaskDetails too
      sessionMetadata = {
        type: 'transport_receiving', 
        task_id: selectedTaskId, 
        po_id: currentTransportTaskDetails?.po_id || null,
        op_id: null, // Null for transport tasks
        location: currentLocation || null,
      };
      sessionName = `PO Line: ${currentTransportTaskDetails?.item || selectedTaskId}`;
    } else if (sessionType === 'production_task' && currentProductionJobDetails) { // Check currentProductionJobDetails
      sessionMetadata = {
        type: 'production_input',
        task_id: selectedProductionJobId, // job_id is the task_id here
        po_id: null, // Not applicable for production jobs
        // op_id: find first pending op for this job_id or null - for future, more granular tracking
        op_id: null, // Placeholder for now
        location: currentLocation || null,
      };
      sessionName = `Prod. Job: ${currentProductionJobDetails?.item_name || selectedProductionJobId}`;
    } else {
      console.error("[SessionStore] Invalid sessionType or missing task details for confirmStartSession:", sessionType);
      set({ isScanning: false, lastScanStatus: 'error', lastScanMessage: 'Invalid session type.', sessionType: null });
      return;
    }

    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions') // public schema assumed by default if not specified
        .insert({
          created_by: user.id,
          device_id: deviceIdToUse, // Ensure this is a valid UUID or null if column allows
          name: sessionName, 
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
          currentSessionTaskId: sessionType === 'task' ? metadata.task_id : null, 
          selectedProductionJobId: sessionType === 'production_task' ? metadata.task_id : null, // Store job_id if production
          sessionType: sessionType, 
          isScanning: true, 
          sessionStartTime: new Date(),
          lastScanMessage: `Session for ${sessionData.name} started.`,
          scannedDrumsForCurrentTask: [], // Reset for new session
        });
        if (sessionType === 'task' && metadata.task_id) {
          get().fetchActiveTaskDrumDetails(metadata.task_id);
        } else if (sessionType === 'production_task' && metadata.task_id) {
          get().fetchActiveProductionJobDrums(metadata.task_id); // Fetch drums/details for production job
        } else {
          set({ activeTaskDrumDetails: [], activeProductionJobDrums: [] }); 
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
    const clientGeneratedDeviceId = getDeviceId();
    console.log("[SessionStore] Current client device ID for sync:", clientGeneratedDeviceId);

    const { data: { session: authTokenSession }, error: authErr } = await supabase.auth.getSession();
    const token = authTokenSession?.access_token;

    if (authErr || !token) {
      console.error('[SessionStore] Auth error syncing state:', authErr);
      set({ isInitializing: false, lastScanStatus: 'idle', lastScanMessage: 'Auth error.', currentSessionId: null, currentLocation: null, currentSessionTaskId: null, sessionType: null });
      return;
    }

    try {
      // This API call is to your custom backend endpoint, not directly to Supabase tables here
      const response = await fetch(`${import.meta.env.VITE_API_URL}${SESSIONS_API_ENDPOINT}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const result: CheckActiveSessionResponse = await response.json();

      if (response.ok && result.success && result.session && result.session.id) {
        const activeSessionFromServer = result.session;
        console.log('[SessionStore] Session from server:', activeSessionFromServer);

         // IMPORTANT: We need to ensure this activeSessionFromServer is meant for *this specific device*.
        // The SQL trigger handles conflicts *on insert*, but sync needs to be careful.
        // If the API `/api/scanner/sessions` doesn't filter by device_id, we must do it here.
        // Assuming `activeSessionFromServer.device_id` would be the field if the API provides it directly.
        // For now, let's assume the current API returns *any* active session for the user.
        // We will only resume if the session from the server has a device_id in its metadata
        // that matches our clientGeneratedDeviceId OR if the session object itself has a device_id field matching.
        // For this example, I'm assuming the backend session object might have `activeSessionFromServer.device_id`
        // If not, and it's in metadata, that path is also partially handled above with serverSessionDeviceId.

        // Directly compare the device_id from the server session with the client's device_id
        if (activeSessionFromServer.device_id === clientGeneratedDeviceId) {
          console.log(`[SessionStore] Active session ${activeSessionFromServer.id} found for THIS device (${clientGeneratedDeviceId}). Syncing state.`);
          const metadata = (typeof activeSessionFromServer.metadata === 'object' && activeSessionFromServer.metadata !== null) 
                           ? activeSessionFromServer.metadata as SessionMetadata // Added cast here
                           : null;
          const activeSessionType: SessionType = 
            metadata?.type === 'free_scan' ? 'free_scan' :
            (metadata?.type === 'transport_receiving' && metadata?.task_id ? 'task' :
            (metadata?.type === 'production_input' && metadata?.task_id ? 'production_task' : null));
          
          set(state => ({
            isInitializing: false,
            currentSessionId: activeSessionFromServer.id,
            currentSessionName: activeSessionFromServer.name || null,
            currentSessionTaskId: activeSessionType === 'task' ? metadata?.task_id || null : null,
            selectedProductionJobId: activeSessionType === 'production_task' ? metadata?.task_id || null : null,
            sessionType: activeSessionType,
            currentLocation: activeSessionFromServer.location ?? state.currentLocation, 
            sessionStartTime: activeSessionFromServer.started_at ? new Date(activeSessionFromServer.started_at) : new Date(), // Handle potentially null started_at
            lastScanMessage: 'Resumed active session.',
            isScanning: true,
            scannedDrumsForCurrentTask: [] 
          }));
          if (activeSessionType === 'task' && metadata?.task_id) {
            get().fetchActiveTaskDrumDetails(metadata.task_id);
          } else if (activeSessionType === 'production_task' && metadata?.task_id) {
            get().fetchActiveProductionJobDrums(metadata.task_id); // Fetch for production job
          } else {
            set({ activeTaskDrumDetails: [], activeProductionJobDrums: [] }); 
          }
        } else {
          console.log(`[SessionStore] Active session ${activeSessionFromServer.id} found, but for different device (${activeSessionFromServer.device_id}). Not resuming on this device (${clientGeneratedDeviceId}).`);
          set({ isInitializing: false, currentSessionId: null, currentLocation: null, currentSessionName: null, currentSessionTaskId: null, selectedProductionJobId: null, sessionType: null, lastScanMessage: 'Ready (no active session for this device).', isScanning: false });
        }
      } else {
        console.log("[SessionStore] No active session found for user from API. Initializing as ready.");
        set({ isInitializing: false, currentSessionId: null, currentLocation: null, currentSessionName: null, currentSessionTaskId: null, selectedProductionJobId: null, sessionType: null, lastScanMessage: 'Ready.', isScanning: false });
      }
    } catch (error: unknown) {
      console.error('[SessionStore] Error during initial session state sync:', error);
      set({ isInitializing: false, currentSessionId: null, currentLocation: null, currentSessionName: null, currentSessionTaskId: null, selectedProductionJobId: null, sessionType: null, lastScanStatus: 'error', lastScanMessage: 'Error syncing.', isScanning: false });
    }
  },

  endSession: async () => {
    const { currentSessionId, currentSessionName, sessionStartTime, currentSessionTaskId, selectedProductionJobId, currentLocation, sessionType } = get(); 
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
      set({ isScanning: false, currentSessionId: null, currentSessionName: null, sessionStartTime: null, currentSessionTaskId: null, selectedProductionJobId: null, sessionType: null, lastScanStatus: 'error', lastScanMessage: 'Auth error. Session ended locally.', scannedDrumsForCurrentTask: [], activeTaskDrumDetails: [], activeProductionJobDrums: [] });
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
          isScanning: false, currentSessionId: null, currentSessionName: null, sessionStartTime: null, currentSessionTaskId: null, selectedProductionJobId: null, sessionType: null, // Reset sessionType
          lastScanStatus: 'idle', lastScanMessage: result.message || 'Session ended.',
          showSessionReport: true, sessionReportData: reportData, scannedDrumsForCurrentTask: [], activeTaskDrumDetails: [], activeProductionJobDrums: []
        });
      } else {
        console.error(`[SessionStore] Failed to end session ${currentSessionId} on server:`, result.error || `Status ${apiResponse.status}`);
        // Still end locally but indicate server error
        set({ isScanning: false, currentSessionId: null, currentSessionName: null, sessionStartTime: null, currentSessionTaskId: null, selectedProductionJobId: null, sessionType: null, lastScanStatus: 'error', lastScanMessage: `Ended locally. Server error: ${result.error || `Status ${apiResponse.status}`}`, scannedDrumsForCurrentTask: [], activeTaskDrumDetails: [], activeProductionJobDrums: [] });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error ending session';
      console.error('[SessionStore] Error in endSession:', message);
      set({ isScanning: false, currentSessionId: null, currentSessionName: null, sessionStartTime: null, currentSessionTaskId: null, selectedProductionJobId: null, sessionType: null, lastScanStatus: 'error', lastScanMessage: `Ended locally. Client error: ${message}`, scannedDrumsForCurrentTask: [], activeTaskDrumDetails: [], activeProductionJobDrums: [] });
    }
  },

  processScan: async (barcode: string) => {
    const { 
      currentSessionId, 
      currentSessionTaskId, 
      selectedProductionJobId, // Added
      scannedDrumsForCurrentTask, 
      activeTaskDrumDetails, 
      activeProductionJobDrums, // Added
      currentLocation, 
      sessionType 
    } = get(); 
    const supabase = createClient(); // Get supabase client instance
    const { data: { user }, error: userError } = await supabase.auth.getUser(); // Get user earlier for logging

    if (!currentSessionId) { // Combined check for any session type
      console.warn("[SessionStore] processScan called without active session.");
      const noSessionMsg = 'No active session for scan.';
      set({ lastScanStatus: 'error', lastScanMessage: noSessionMsg });
      if (user) {
        await supabase.from('session_scans').insert({
          session_id: null, 
          raw_barcode: barcode,
          scan_status: 'error' as ScanStatus,
          scan_action: sessionType === 'free_scan' ? 'free_scan' : (sessionType === 'production_task' ? 'production_input' : 'process') as ScanType, 
          error_message: noSessionMsg,
          user_id: user.id,
          device_id: getDeviceId(),
          pol_id: sessionType === 'task' ? currentSessionTaskId : null, 
          // Add job_id or op_id for production if relevant at this stage
        });
      }
      return;
    }

    if (userError || !user) {
      console.error("[SessionStore] Auth error for scan:", userError);
      const authErrorMsg = 'Authentication error.';
      set({ isScanning: false, lastScanStatus: 'error', lastScanMessage: authErrorMsg });
      await supabase.from('session_scans').insert({
        session_id: currentSessionId, 
        raw_barcode: barcode,
        scan_status: 'error' as ScanStatus,
        scan_action: sessionType === 'free_scan' ? 'free_scan' : (sessionType === 'production_task' ? 'production_input' : 'process') as ScanType,
        error_message: authErrorMsg,
        user_id: user?.id || undefined,
        device_id: getDeviceId(),
        pol_id: sessionType === 'task' ? currentSessionTaskId : null,
      });
      return;
    }

    set({ isScanning: true, lastScanMessage: `Processing ${barcode}...` });

    // Free Scan Logic
    if (sessionType === 'free_scan') {
      try {
        const logEntry = {
          session_id: currentSessionId,
          raw_barcode: barcode,
          scan_status: 'success' as ScanStatus,
          scan_action: 'free_scan' as ScanType,
          error_message: null,
          user_id: user.id,
          device_id: getDeviceId(),
          pol_id: null, // Not for free_scan
          pod_id: null,
          item_name: null,
          // job_id: null, // Explicitly null for free_scan
          // op_id: null, // Explicitly null for free_scan
        };
        const { error: logError } = await supabase.from('session_scans').insert(logEntry);
        if (logError) {
          console.error("[SessionStore] CRITICAL: Failed to log free_scan to public.session_scans:", logError, logEntry);
          set({ isScanning: false, lastScanStatus: 'error', lastScanMessage: 'Failed to record free scan.' });
          return;
        }
        console.log("[SessionStore] Free scan result logged to public.session_scans:", logEntry);
        const newScannedDrums = scannedDrumsForCurrentTask.includes(barcode) ? scannedDrumsForCurrentTask : [...scannedDrumsForCurrentTask, barcode];
        set({
          isScanning: false,
          lastScanStatus: 'success',
          lastScanMessage: `Barcode ${barcode} recorded (Free Scan).`,
          lastScanId: null, // No specific pod_id for free scans
          scannedDrumsForCurrentTask: newScannedDrums,
        });
      } catch (error) {
        console.error("Error processing free scan:", error);
        set({ isScanning: false, lastScanStatus: 'error', lastScanMessage: `Failed to process free scan for ${barcode}.` });
      }
      return; // Important: End execution for free_scan type here
    }

    // Task-based Scan Logic (existing logic for transport_receiving)
    if (sessionType === 'task') {
      if (!currentSessionTaskId) {
        console.warn("[SessionStore] processScan (task) called without active task ID.");
        const noTaskMsg = 'No active task for scan in current session.';
        set({ lastScanStatus: 'error', lastScanMessage: noTaskMsg });
        await supabase.from('session_scans').insert({
          session_id: currentSessionId,
          raw_barcode: barcode,
          scan_status: 'error' as ScanStatus,
          scan_action: 'process' as ScanType, 
          error_message: noTaskMsg,
          user_id: user.id,
          device_id: getDeviceId(),
          pol_id: null, // No currentSessionTaskId here for the log
        });
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
            scan_action: 'check_in' as ScanType, 
            error_message: message,
            user_id: user.id,
            device_id: getDeviceId(),
            pol_id: currentSessionTaskId
          });
        }
        return;
      }

      set({ isScanning: true, lastScanMessage: `Processing ${barcode}...` }); // Indicate specific scan processing

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
    }

    // New: Production Task Scan Logic
    if (sessionType === 'production_task') {
      if (!selectedProductionJobId) {
        console.warn("[SessionStore] processScan (production) called without active job ID.");
        const noJobMsg = 'No active production job for scan.';
        set({ lastScanStatus: 'error', lastScanMessage: noJobMsg });
        await supabase.from('session_scans').insert({
          session_id: currentSessionId,
          raw_barcode: barcode,
          scan_status: 'error' as ScanStatus,
          scan_action: 'production_input' as ScanType, 
          error_message: noJobMsg,
          user_id: user.id,
          device_id: getDeviceId(),
          job_id: null, 
        });
        return;
      }

      if (activeProductionJobDrums.some(d => d.serial_number === barcode)) {
         const message = `Drum ${barcode} already assigned to this production job.`;
         set({ lastScanStatus: 'error', lastScanMessage: message });
         await supabase.from('session_scans').insert({
            session_id: currentSessionId,
            raw_barcode: barcode,
            scan_status: 'error' as ScanStatus,
            scan_action: 'production_input' as ScanType, 
            error_message: message,
            user_id: user.id,
            device_id: getDeviceId(),
            job_id: selectedProductionJobId
          });
        return;
      }

      set({ isScanning: true, lastScanMessage: `Assigning ${barcode} to job ${selectedProductionJobId.slice(0,8)}...` });
      
      let scanResult: { status: ScanStatus; message: string; drum_id?: string | null; item_name?: string | null; op_id_for_log?: string | null; error?: PostgrestError | Error | null } = {
        status: 'error',
        message: 'Production scan processing failed unexpectedly.',
        op_id_for_log: null,
        error: null,
      };
      // Declare opData outside try to be available in finally
      let opDataForLog: {op_id: string; op_type: string} | null = null;

      try {
        // 1. Find the drum_id from inventory.drums by serial_number
        const { data: drumInvData, error: drumInvError } = await supabase
          .schema('inventory')
          .from('drums')
          // Corrected join path: drums -> batches -> items
          .select(`
            drum_id, 
            batch_id, 
            batches (
              item_id,
              items ( name )
            )
          `)
          .eq('serial_number', barcode)
          .single();

        if (drumInvError || !drumInvData) {
          const msg = drumInvError ? 'DB error finding drum.' : `Drum ${barcode} not found in inventory.`;
          scanResult = { ...scanResult, status: 'error', message: msg, error: drumInvError || new Error(msg) };
          throw scanResult.error;
        }
        
        const drumId = drumInvData.drum_id;
        const itemNameFromDrum = drumInvData.batches?.items?.name || 'Unknown Item';
        scanResult.item_name = itemNameFromDrum; // Store for logging

        // 2. Find the relevant op_id 
        const { data: opData, error: opError } = await supabase
          .schema('production')
          .from('operations')
          .select('op_id, op_type')
          .eq('job_id', selectedProductionJobId)
          .in('status', ['pending', 'active']) 
          .order('created_at', { ascending: true })
          .limit(1)
          .single();
        
        if (opError || !opData) {
          const msg = opError ? 'DB error finding operation.' : `No suitable pending/active operation for job ${selectedProductionJobId.slice(0,8)}.`;
          scanResult = { ...scanResult, status: 'error', message: msg, error: opError || new Error(msg) };
          throw scanResult.error;
        }
        opDataForLog = opData; // Assign to outer scope variable for finally block
        scanResult.op_id_for_log = opData.op_id;


        // 3. Insert into production.operation_drums
        const volumeToTransfer = 200; 
        const { error: opDrumError } = await supabase
          .schema('production')
          .from('operation_drums')
          .insert({
            op_id: opData.op_id,
            drum_id: drumId,
            scan_id: -1, // Placeholder for required non-nullable integer scan_id
            volume_transferred: volumeToTransfer 
          });

        if (opDrumError) {
          scanResult = { ...scanResult, status: 'error', message: 'DB error assigning drum to operation.', error: opDrumError };
          throw opDrumError;
        }

        // 4. Optionally update inventory.drums.status
        await supabase.schema('inventory').from('drums').update({ status: 'pre_production' }).eq('drum_id', drumId);

        scanResult = { ...scanResult, status: 'success', message: `Drum ${barcode} assigned to operation ${opData.op_type} for job.`, drum_id: drumId };
        
        set(state => ({
          isScanning: false,
          lastScanStatus: 'success',
          lastScanMessage: scanResult.message,
          activeProductionJobDrums: [...state.activeProductionJobDrums, { drum_id: drumId, serial_number: barcode, volume_transferred: volumeToTransfer }],
        }));

      } catch (error) {
        console.error("Error processing production scan:", error);
        if(scanResult.status !== 'error') { // If error was not set by one of the specific checks
            scanResult = { ...scanResult, status: 'error', message: `Failed to process production scan for ${barcode}.`, error: error instanceof Error ? error : new Error(String(error)) };
        }
        set({ isScanning: false, lastScanStatus: 'error', lastScanMessage: scanResult.message });
      } finally {
          try {
              const logEntry = {
                  session_id: currentSessionId,
                  raw_barcode: barcode,
                  scan_status: scanResult.status,
                  scan_action: 'production_input' as ScanType, 
                  error_message: scanResult.status === 'error' ? scanResult.message : null,
                  user_id: user.id, 
                  device_id: getDeviceId(),
                  pol_id: null, 
                  pod_id: null, 
                  item_name: scanResult.item_name, 
                  job_id: selectedProductionJobId, 
                  op_id: scanResult.op_id_for_log, // Use op_id_for_log from scanResult
                  drum_id: scanResult.drum_id || null, 
              };
              const { error: logError } = await supabase.from('session_scans').insert(logEntry);
              if (logError) {
                  console.error("[SessionStore] CRITICAL: Failed to log production scan result to public.session_scans:", logError, logEntry);
              } else {
                   console.log("[SessionStore] Production scan result logged to public.session_scans:", logEntry);
              }
          } catch (logCatchError) {
               console.error("[SessionStore] CRITICAL: Exception during production scan logging:", logCatchError);
          }
          if (get().isScanning) {
            set({ isScanning: false });
          }
      }
    }
  },

  closeSessionReport: () => set({ showSessionReport: false, sessionReportData: null }),
}));

// Optional: Early sync call. Consider if App.tsx is a better place.
// useSessionStore.getState().syncSessionStateOnMount(); 