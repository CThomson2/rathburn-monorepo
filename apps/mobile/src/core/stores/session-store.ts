import { create } from 'zustand';
import { supabase } from '@/core/lib/supabase/client';
import { Database, Json } from '@/types/supabase';
import { createClient } from "@/core/lib/supabase/client";
import { PostgrestError } from "@supabase/supabase-js";
import { ScanStatus, ScanType } from '@/types/scanner';
import { useDebugLogStore } from './debug-log-store';

export type SessionType = 'task' | 'free_scan' | 'production_task' | null;

// Use the generated ENUM type for session tasks
export type SessionTaskType = Database["public"]["Enums"]["session_task_type"];

// Define a type guard for the Location ENUM
const LocationEnumValues = ["os_stock", "os_lab", "ns_stock", "ns_lab"] as const;
type LocationTuple = typeof LocationEnumValues;
export type Location = LocationTuple[number];

function isLocationEnumValue(value: unknown): value is Location {
  return LocationEnumValues.includes(value as Location);
}

// Updated Task interface: id is now pol_id
export interface PurchaseOrderLineTask {
  id: string; // This will be pol_id
  po_id: string; // Keep po_id for context if needed
  item_id: string; // Add item_id
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
  item_id: string; // Add item_id
  po_number: string;
  supplier: string; // This is s.name
  order_date: string;
  status: string;
  eta_date: string | null;
  item: string; // This is i.name
  quantity: number; // This is pol.quantity
  received_count: number;
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
// REMOVED `type` field from SessionMetadata
interface SessionMetadata {
  task_id: string | null; 
  po_id?: string | null; 
  batch_id?: string | null; 
  op_id?: string | null; 
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

// Updated to include the new `task` field from the sessions table
interface CheckActiveSessionResponse {
  success: boolean;
  session?: { 
    id: string; 
    name?: string | null; 
    device_id: string | null; 
    location: Location | null; 
    metadata?: SessionMetadata | null; 
    started_at?: string | null; 
    task?: SessionTaskType | null; // Added task field
  }; 
  error?: string;
}

// Define the state structure for the store
interface SessionState {
  currentSessionId: string | null;
  currentSessionName: string | null;
  currentSessionTaskId: string | null; 
  sessionType: SessionType; 
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
  availableProductionTasks: ProductionTask[]; 
  selectedTaskId: string | null; 
  selectedProductionJobId: string | null; 
  showTaskSelectionModal: boolean;
  taskSelectionModalType: 'transport' | 'production' | null; 
  isFetchingTasks: boolean;
  isFetchingProductionTasks: boolean; 
  scannedDrumsForCurrentTask: string[];
  activeTaskDrumDetails: DrumDetail[];
  activeProductionJobDrums: Array<{drum_id: string, serial_number: string, volume_transferred: number}>; 

  currentTaskBatchCodeInput: string; 
  isCurrentTaskBatchCodeSubmitted: boolean; 
  currentBatchTableId: string | null; 
  isCheckingBatchCode: boolean;

  // Add a method to log current relevant state for debugging
  logCurrentState: (triggerEvent: string) => void;

  setCurrentLocation: (location: Location | null) => void;
  syncSessionStateOnMount: () => Promise<void>;
  fetchPurchaseOrderTasks: () => Promise<void>;
  fetchProductionTasks: () => Promise<void>; 
  fetchActiveTaskDrumDetails: (polId: string) => Promise<void>; 
  fetchActiveProductionJobDrums: (jobId: string, opId?: string) => Promise<void>; 
  selectTask: (taskId: string) => void; 
  selectProductionJob: (jobId: string) => void; 
  openTaskSelectionModal: (type: 'transport' | 'production') => void; 
  closeTaskSelectionModal: () => void;
  startSession: (type: SessionType) => void; 
  createBatchForCurrentTask: (batchCode: string) => Promise<{ success: boolean; batchId?: string; error?: string }>;
  confirmStartSession: () => Promise<void>;
  endSession: () => Promise<void>; 
  processScan: (barcode: string) => Promise<void>; 
  closeSessionReport: () => void;
  setCurrentTaskBatchCodeInput: (code: string) => void;
}

const DEVICE_ID_STORAGE_KEY = 'app_device_id';

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
    if (import.meta.env.VITE_DEVICE_ID && import.meta.env.VITE_DEVICE_ID !== deviceId) {
      console.warn('[SessionStore] Overriding localStorage Device ID with VITE_DEVICE_ID for development:', import.meta.env.VITE_DEVICE_ID);
      deviceId = import.meta.env.VITE_DEVICE_ID;
    }
  }
  return deviceId as string;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  currentSessionId: null,
  currentSessionName: null,
  currentSessionTaskId: null,
  sessionType: null, 
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
  availableProductionTasks: [], 
  selectedTaskId: null,
  selectedProductionJobId: null, 
  showTaskSelectionModal: false,
  taskSelectionModalType: null, 
  isFetchingTasks: false,
  isFetchingProductionTasks: false, 
  scannedDrumsForCurrentTask: [],
  activeTaskDrumDetails: [], 
  activeProductionJobDrums: [], 

  currentTaskBatchCodeInput: '',
  isCurrentTaskBatchCodeSubmitted: false,
  currentBatchTableId: null,
  isCheckingBatchCode: false,

  setCurrentTaskBatchCodeInput: (code) => set({ currentTaskBatchCodeInput: code }),

  // Centralized logging function
  logCurrentState: (triggerEvent) => {
    const state = get();
    const relevantState = {
      triggerEvent,
      currentSessionId: state.currentSessionId,
      sessionType: state.sessionType,
      currentSessionTaskId: state.currentSessionTaskId,
      selectedTaskId: state.selectedTaskId,
      isCurrentTaskBatchCodeSubmitted: state.isCurrentTaskBatchCodeSubmitted,
      currentBatchTableId: state.currentBatchTableId,
      isCheckingBatchCode: state.isCheckingBatchCode,
      lastScanMessage: state.lastScanMessage,
      lastScanStatus: state.lastScanStatus,
      // UI-driving states (previously in TransportView)
      // These are effectively determined by the states above
      // Example: showTaskSelection depends on !currentSessionId && !selectedTaskId etc.
      _derived_showTaskSelection: !state.currentSessionId && !state.selectedTaskId && !state.isCheckingBatchCode,
      _derived_showBatchCodeInput: !state.currentSessionId && state.sessionType === 'task' && state.selectedTaskId && !state.isCurrentTaskBatchCodeSubmitted && !state.isCheckingBatchCode,
      _derived_showScanningInterface_Task: state.currentSessionId && state.sessionType === 'task' && !!state.availableTasks.find(t => t.id === state.currentSessionTaskId) && state.isCurrentTaskBatchCodeSubmitted && !state.isCheckingBatchCode,
      _derived_showFreeScanInterface: state.currentSessionId && state.sessionType === 'free_scan' && !state.isCheckingBatchCode,
      _derived_showTaskDetailsUnavailable:  state.currentSessionId && state.sessionType === 'task' && !state.availableTasks.find(t => t.id === state.currentSessionTaskId) && state.isCurrentTaskBatchCodeSubmitted && !state.isCheckingBatchCode,
    };
    useDebugLogStore.getState().addLog(`SessionStore: ${triggerEvent}`, relevantState);
  },

  setCurrentLocation: (location) => {
    set({ currentLocation: location });
    get().logCurrentState('setCurrentLocation');
  },

  fetchPurchaseOrderTasks: async () => {
    console.log("[SessionStore] Fetching purchase order tasks (lines)...");
    set({ isFetchingTasks: true });
    get().logCurrentState('fetchPurchaseOrderTasks_start');
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
          const receivedCount = line.received_count;
          // console.log(`[SessionStore] Task Check: PO: ${line.po_number}, Item: ${line.item}, Line Quantity: ${line.quantity}, Item ID: ${line.item_id}, Received Count (from RPC): ${receivedCount}`);
          if (line.quantity - receivedCount > 0) {
            tasks.push({
              id: line.pol_id,
              po_id: line.po_id,
              item_id: line.item_id, 
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
      get().logCurrentState('fetchPurchaseOrderTasks_success');
    } catch (error) {
      console.error("[SessionStore] Failed to fetch tasks:", error);
      set({ isFetchingTasks: false, availableTasks: [] });
      get().logCurrentState('fetchPurchaseOrderTasks_error');
    }
  },

  fetchProductionTasks: async () => {
    console.log("[SessionStore] Fetching production tasks...");
    set({ isFetchingProductionTasks: true });
    get().logCurrentState('fetchProductionTasks_start');
    try {
      const supabase = createClient();
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
        processedQuantity: 0, 
        remainingQuantity: job.raw_volume ? Math.ceil(job.raw_volume / 200) : 0, 
      })); 
      set({ availableProductionTasks: tasks, isFetchingProductionTasks: false });
      get().logCurrentState('fetchProductionTasks_success');
    } catch (error) {
      console.error("[SessionStore] Failed to fetch production tasks:", error);
      set({ isFetchingProductionTasks: false, availableProductionTasks: [] });
      get().logCurrentState('fetchProductionTasks_error');
    }
  },

  fetchActiveTaskDrumDetails: async (polId: string) => {
    if (!polId) return;
    console.log(`[SessionStore] Fetching drum details for active task (pol_id): ${polId}`);
    set({ isFetchingTasks: true }); 
    get().logCurrentState('fetchActiveTaskDrumDetails_start');
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('v_purchase_order_drum_details') 
        .select('pod_id, serial_number, pol_id, is_received, item_name')
        .eq('pol_id', polId)
        .order('serial_number'); 
      // console.log(`[SessionStore] Drum details for pol_id ${polId}:`, data);
      if (error) {
        console.error("Error fetching drum details from view:", error);
        throw error;
      }
      set({ activeTaskDrumDetails: data || [], isFetchingTasks: false });
      get().logCurrentState('fetchActiveTaskDrumDetails_success');
    } catch (error) {
      console.error("Failed to fetch drum details:", error);
      set({ activeTaskDrumDetails: [], isFetchingTasks: false });
      get().logCurrentState('fetchActiveTaskDrumDetails_error');
    }
  },

  fetchActiveProductionJobDrums: async (jobId: string, opId?: string) => {
    if (!jobId) return;
    console.log(`[SessionStore] Fetching drums for production job: ${jobId}` + (opId ? `, op: ${opId}` : ''));
    set({ activeProductionJobDrums: [] }); 
    get().logCurrentState('fetchActiveProductionJobDrums');
  },

  selectTask: async (taskId) => {
    console.log('[SessionStore] selectTask called with taskId:', taskId);

    // Reset selection-related state immediately so the UI updates without delay
    // 
    // TODO: batch code input flashes on-screen briefly when selecting a task,
    // but this is not so much state management as it is the lack of a UI loading spinner 
    // (still a state, but a new loading state required)
    set({
      selectedTaskId: taskId,
      sessionType: 'task',
      currentTaskBatchCodeInput: '',
      isCurrentTaskBatchCodeSubmitted: false,
      currentBatchTableId: null,
      isCheckingBatchCode: true,
    });
    get().logCurrentState('selectTask_start');

    const stateNow = get();
    const task = stateNow.availableTasks.find((t) => t.id === taskId);
    if (!task) {
      console.warn('[SessionStore] selectTask – task not found in availableTasks, aborting early.');
      set({ isCheckingBatchCode: false }); // Ensure checking batch code is reset
      get().logCurrentState('selectTask_task_not_found');
      return;
    }

    try {
      // Log the search parameters for debugging
      console.log('[SessionStore] Looking for batch with po_id:', task.po_id, 'item_id:', task.item_id);
      
      const supabase = createClient();
      
      // First check if a batch already exists for this task
      const { data: batch, error } = await supabase
        .schema('inventory')
        .from('batches')
        .select('batch_id, batch_code, status')
        .eq('po_id', task.po_id)
        .eq('item_id', task.item_id)
        .order('created_at', { ascending: false })
        .limit(1);
      
      // Improved error logging
      if (error) {
        console.error('[SessionStore] Error fetching existing batch for task:', error);
        get().logCurrentState('selectTask_batch_lookup_error');
      }
      
      // Log what we found
      console.log('[SessionStore] Batch lookup result:', batch, 'Row count:', batch?.length || 0);

      // Check if we have a valid batch with a batch code
      if (batch && batch.length > 0 && batch[0].batch_code) {
        console.log('[SessionStore] Existing batch found for task – skipping batch-code step.', batch[0]);
        set({
          currentBatchTableId: batch[0].batch_id,
          currentTaskBatchCodeInput: batch[0].batch_code,
          isCurrentTaskBatchCodeSubmitted: true,
        });

        // Immediately start a new session so the UI jumps to scanning mode
        await get().confirmStartSession();
      } else {
        console.log('[SessionStore] No existing batch with batch_code found for task, will show batch code input.');
      }
      get().logCurrentState('selectTask_batch_lookup_done');
    } catch (err) {
      console.error('[SessionStore] Unexpected error in selectTask batch lookup:', err);
      get().logCurrentState('selectTask_batch_lookup_error');
    } finally {
      set({ isCheckingBatchCode: false });
      get().logCurrentState('selectTask_finally');
    }

    console.log('[SessionStore] state AFTER selectTask (post batch lookup):', get());
  },

  selectProductionJob: (jobId) => {
    console.log('[SessionStore] selectProductionJob called with jobId:', jobId);
    set({
      selectedProductionJobId: jobId,
      sessionType: 'production_task',
    });
    get().logCurrentState('selectProductionJob');
    console.log('[SessionStore] state AFTER selectProductionJob:', get());
  }, 

  openTaskSelectionModal: (type) => {
    console.log('[SessionStore] openTaskSelectionModal called with type:', type);
    set({ sessionType: type === 'transport' ? 'task' : 'production_task' });
    set({ showTaskSelectionModal: true, taskSelectionModalType: type });
    get().logCurrentState('openTaskSelectionModal');
    console.log('[SessionStore] state AFTER openTaskSelectionModal:', get());
    
    if (type === 'transport') {
      if (get().availableTasks.length === 0 && !get().isFetchingTasks) {
        console.log("[SessionStore] Opening transport task modal, fetching tasks via Zustand...");
        get().fetchPurchaseOrderTasks();
      }
    } else if (type === 'production' && get().availableProductionTasks.length === 0 && !get().isFetchingProductionTasks) {
      console.log("[SessionStore] Opening production task modal, fetching tasks via Zustand...");
      get().fetchProductionTasks();
    }
  },

  // No session should be active when this function is called
  closeTaskSelectionModal: () => {
    const { currentSessionId, sessionType, selectedTaskId, selectedProductionJobId } = get();
    const ProceedingToBatchCodeForTransport = sessionType === 'task' && selectedTaskId && !currentSessionId;
    const ProceedingToProductionSession = sessionType === 'production_task' && selectedProductionJobId && !currentSessionId;
    
    console.log('[SessionStore] closeTaskSelectionModal called. ProceedingToBatchCode:', ProceedingToBatchCodeForTransport, 
                'ProceedingToProductionSession:', ProceedingToProductionSession, 'Current state:', get());

    set(state => ({
      showTaskSelectionModal: false,
      taskSelectionModalType: null, 
      selectedTaskId: ProceedingToBatchCodeForTransport ? state.selectedTaskId : (currentSessionId && state.sessionType === 'task' ? state.selectedTaskId : null),
      selectedProductionJobId: ProceedingToProductionSession ? state.selectedProductionJobId : (currentSessionId && state.sessionType === 'production_task' ? state.selectedProductionJobId : null),
      sessionType: ProceedingToBatchCodeForTransport ? 'task' : (ProceedingToProductionSession ? 'production_task' : (currentSessionId ? state.sessionType : null)),
      currentTaskBatchCodeInput: ProceedingToBatchCodeForTransport ? state.currentTaskBatchCodeInput : '',
      isCurrentTaskBatchCodeSubmitted: ProceedingToBatchCodeForTransport ? state.isCurrentTaskBatchCodeSubmitted : false,
      currentBatchTableId: ProceedingToBatchCodeForTransport ? state.currentBatchTableId : null,
    }));
    
    // If we're proceeding to production session, start it immediately
    if (ProceedingToProductionSession) {
      console.log('[SessionStore] Proceeding to confirmStartSession for production job');
      get().confirmStartSession();
    }
    
    get().logCurrentState('closeTaskSelectionModal');
    console.log('[SessionStore] state AFTER closeTaskSelectionModal:', get());
  }, 
  
  startSession: (type: SessionType) => { 
    console.log('[SessionStore] startSession called with type:', type);
    set({ sessionType: type }); 
    get().logCurrentState('startSession_type_set');
    if (type === 'task') {
      get().openTaskSelectionModal('transport');
    } else if (type === 'production_task') {
      get().openTaskSelectionModal('production');
    } else if (type === 'free_scan') { 
      get().confirmStartSession(); 
    } else {
      console.warn("[SessionStore] startSession called with invalid type:", type);
    }
  },

  createBatchForCurrentTask: async (batchCode: string) => {
    const { selectedTaskId, availableTasks } = get();
    console.log('[SessionStore] createBatchForCurrentTask called. BatchCode:', batchCode, 'SelectedTaskId:', selectedTaskId);
    if (!selectedTaskId) {
      return { success: false, error: "No task selected." };
    }
    const currentTask = availableTasks.find(task => task.id === selectedTaskId);
    if (!currentTask) {
      get().logCurrentState('createBatchForCurrentTask_task_not_found');
      return { success: false, error: "Selected task details not found." };
    }
    if (!currentTask.item_id || !currentTask.po_id) {
      console.error("[SessionStore] Task missing item_id or po_id for batch creation:", currentTask);
      get().logCurrentState('createBatchForCurrentTask_missing_ids');
      return { success: false, error: "Task is missing item_id or po_id." };
    }

    console.log(`[SessionStore] Creating batch for task: ${selectedTaskId}, PO: ${currentTask.po_id}, Item: ${currentTask.item_id}, batch code: ${batchCode}`);
    set({ lastScanMessage: 'Creating batch record...' });
    console.log('[SessionStore] state BEFORE batch insert attempt:', get());

    try {
      const supabase = createClient();
      
      // First check if a batch already exists for this task's PO and item
      const { data: existingBatch, error: checkError } = await supabase
        .schema('inventory')
        .from('batches')
        .select('batch_id, batch_code, status')
        .eq('po_id', currentTask.po_id)
        .eq('item_id', currentTask.item_id)
        .limit(1);
      
      if (checkError) {
        console.error("[SessionStore] Error checking for existing batch:", checkError);
        set({ lastScanMessage: `Error checking for existing batch: ${checkError.message}` });
        return { success: false, error: checkError.message };
      }
      
      // If a batch already exists, use it instead of creating a new one
      if (existingBatch && existingBatch.length > 0) {
        console.log('[SessionStore] Existing batch found, using instead of creating new one:', existingBatch[0]);
        
        // Update batch code if it doesn't already have one
        const batchId = existingBatch[0].batch_id;
        
        if (!existingBatch[0].batch_code) {
          const { data: updateData, error: updateError } = await supabase
            .schema('inventory')
            .from('batches')
            .update({ batch_code: batchCode })
            .eq('batch_id', batchId)
            .select('batch_id')
            .single();
            
          if (updateError) {
            console.error("Error updating existing batch with new code:", updateError);
            set({ lastScanMessage: `Error updating batch: ${updateError.message}` });
            return { success: false, error: updateError.message };
          }
          
          console.log('[SessionStore] Updated existing batch with new code:', batchCode);
        } else {
          console.log('[SessionStore] Existing batch already has code:', existingBatch[0].batch_code);
        }
        
        set({
          isCurrentTaskBatchCodeSubmitted: true,
          currentBatchTableId: batchId,
          currentTaskBatchCodeInput: existingBatch[0].batch_code || batchCode, 
          lastScanMessage: `Using existing batch ${existingBatch[0].batch_code || batchCode}. Ready to start session.`,
        });
        
        get().logCurrentState('createBatchForCurrentTask_using_existing_batch');
        if (get().sessionType !== 'task') {
          console.log('[SessionStore] Setting sessionType to task before confirmStartSession');
          set({ sessionType: 'task' });
          get().logCurrentState('createBatchForCurrentTask_set_sessionType_task');
        }
        
        await get().confirmStartSession();
        get().logCurrentState('createBatchForCurrentTask_after_confirm');
        return { success: true, batchId: batchId };
      }
      
      // Create new batch if none exists
      const { data: batchData, error: batchError } = await supabase
        .schema('inventory')
        .from('batches')
        .insert({
          item_id: currentTask.item_id,
          po_id: currentTask.po_id,
          batch_code: batchCode,
          batch_type: 'new', 
          qty_drums: 0,
          status: 'scanning_in' 
        })
        .select('batch_id')
        .single();

      if (batchError) {
        console.error("Error creating batch in DB:", batchError);
        set({ lastScanMessage: `Error creating batch: ${batchError.message}` });
        get().logCurrentState('createBatchForCurrentTask_db_error');
        return { success: false, error: batchError.message };
      }

      if (batchData && batchData.batch_id) {
        console.log('[SessionStore] Batch created successfully in DB:', batchData);
        set({
          isCurrentTaskBatchCodeSubmitted: true,
          currentBatchTableId: batchData.batch_id,
          currentTaskBatchCodeInput: batchCode, 
          lastScanMessage: `Batch ${batchCode} created. Ready to start session.`,
        });
        console.log('[SessionStore] state AFTER batch created, BEFORE confirmStartSession:', get());
        get().logCurrentState('createBatchForCurrentTask_success_before_confirm');
        if (get().sessionType !== 'task') {
            console.log('[SessionStore] Setting sessionType to task before confirmStartSession');
            set({ sessionType: 'task' });
            get().logCurrentState('createBatchForCurrentTask_set_sessionType_task');
        }
        await get().confirmStartSession(); 
        get().logCurrentState('createBatchForCurrentTask_after_confirm');
        return { success: true, batchId: batchData.batch_id };
      } else {
        set({ lastScanMessage: 'Failed to create batch record.' });
        get().logCurrentState('createBatchForCurrentTask_no_batch_id');
        return { success: false, error: "Failed to create batch record, no ID returned." };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error creating batch.';
      console.error("Error in createBatchForCurrentTask:", error);
      set({ lastScanMessage: `Error: ${message}` });
      get().logCurrentState('createBatchForCurrentTask_catch_error');
      return { success: false, error: message };
    }
  },

  confirmStartSession: async () => {
    const { 
      selectedTaskId, 
      selectedProductionJobId, 
      currentLocation, 
      sessionType, 
      isCurrentTaskBatchCodeSubmitted,
      currentBatchTableId,
      currentTaskBatchCodeInput
    } = get(); 

    console.log(`[SessionStore] Attempting confirmStartSession. Current state before checks:`, get());
    get().logCurrentState('confirmStartSession_start');

    if (!sessionType) {
        console.error("[SessionStore] confirmStartSession called with null sessionType. Aborting.", {selectedTaskId, selectedProductionJobId});
        set({ lastScanMessage: 'Session type is invalid. Please restart selection.'});
        get().logCurrentState('confirmStartSession_null_sessionType');
        return;
    }

    if (sessionType === 'task') {
      if (!selectedTaskId) {
        console.warn("[SessionStore] No transport task selected for confirmStartSession.");
        set({lastScanMessage: 'No task selected.'});
        get().logCurrentState('confirmStartSession_no_task_id');
        return;
      }
      if (!isCurrentTaskBatchCodeSubmitted || !currentBatchTableId) {
        console.warn("[SessionStore] Batch code not submitted for selected task in confirmStartSession.");
        set({ lastScanMessage: 'Please enter and submit the batch code first for the selected task.' });
        get().logCurrentState('confirmStartSession_batch_not_submitted');
        return;
      }
    }
    
    if (sessionType === 'production_task' && !selectedProductionJobId) {
      console.warn("[SessionStore] No production job selected for confirmStartSession.");
      set({lastScanMessage: 'No production job selected.'});
      get().logCurrentState('confirmStartSession_no_production_job_id');
      return;
    }

    console.log(`[SessionStore] Proceeding with confirmStartSession for type: ${sessionType}, task: ${selectedTaskId}, production_job: ${selectedProductionJobId}, batch_id: ${currentBatchTableId}`);
    set({ 
      isScanning: true, 
      lastScanStatus: 'idle', 
      lastScanMessage: 'Starting session...', 
      showTaskSelectionModal: false, 
      activeTaskDrumDetails: [], 
      scannedDrumsForCurrentTask: [] 
    });
    console.log('[SessionStore] state AFTER setting isScanning=true in confirmStartSession:', get());
    get().logCurrentState('confirmStartSession_isScanning_true');

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("[SessionStore] Auth error getting user for session start:", userError);
      set({ isScanning: false, lastScanStatus: 'error', lastScanMessage: 'Authentication error.' });
      get().logCurrentState('confirmStartSession_auth_error');
      return;
    }

    const deviceIdToUse = getDeviceId(); 
    const currentTransportTaskDetails = sessionType === 'task' ? get().availableTasks.find(task => task.id === selectedTaskId) : null;
    const currentProductionJobDetails = sessionType === 'production_task' ? get().availableProductionTasks.find(job => job.job_id === selectedProductionJobId) : null;

    let sessionTaskEnumValue: SessionTaskType;
    let sessionMetadata: Omit<SessionMetadata, 'auto_completed_reason' | 'new_session_id' | 'auto_completed_at'>; 
    let sessionName: string;

    if (sessionType === 'free_scan') {
      sessionTaskEnumValue = 'free_scan';
      sessionMetadata = {
        task_id: null,
        po_id: null,
        batch_id: null,
        op_id: null, 
        location: currentLocation || null,
        auto_completed: false, 
      };
      sessionName = 'Free Scanning Session';
    } else if (sessionType === 'task' && currentTransportTaskDetails && currentBatchTableId) { 
      sessionTaskEnumValue = 'transport';
      sessionMetadata = {
        task_id: selectedTaskId, 
        po_id: currentTransportTaskDetails?.po_id || null,
        batch_id: currentBatchTableId, 
        op_id: null, 
        location: currentLocation || null,
        auto_completed: false, 
      };
      sessionName = `PO: ${currentTransportTaskDetails?.poNumber} / Batch: ${currentTaskBatchCodeInput || 'N/A'}`;
    } else if (sessionType === 'production_task' && currentProductionJobDetails) { 
      sessionTaskEnumValue = 'production_input'; 
      sessionMetadata = {
        task_id: selectedProductionJobId, 
        po_id: null, 
        batch_id: null, 
        op_id: null, 
        location: currentLocation || null,
        auto_completed: false, 
      };
      sessionName = `Prod. Job: ${currentProductionJobDetails?.item_name || selectedProductionJobId}`;
    } else {
      console.error("[SessionStore] Invalid sessionType or missing details for confirmStartSession. Details:", { sessionType, currentTransportTaskDetails, currentBatchTableId, currentProductionJobDetails });
      set({ isScanning: false, lastScanStatus: 'error', lastScanMessage: 'Invalid session configuration. Cannot start.', sessionType: null });
      get().logCurrentState('confirmStartSession_invalid_config');
      return;
    }
    console.log('[SessionStore] Session metadata prepared for insert:', { sessionName, sessionTaskEnumValue, sessionMetadata });

    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions') 
        .insert({
          created_by: user.id,
          device_id: deviceIdToUse, 
          name: sessionName, 
          status: 'in_progress',
          task: sessionTaskEnumValue, 
          started_at: new Date().toISOString(),
          metadata: sessionMetadata as unknown as Json, 
        })
        .select('id, name, metadata, task') 
        .single();

      if (sessionError) {
        console.error("Error creating session in DB:", sessionError);
        throw sessionError;
      }

      if (sessionData) {
        const returnedMetadata = (typeof sessionData.metadata === 'object' && sessionData.metadata !== null) 
                                ? sessionData.metadata as unknown as SessionMetadata 
                                : null;
        set({
          currentSessionId: sessionData.id,
          currentSessionName: sessionData.name,
          currentSessionTaskId: sessionType === 'task' ? returnedMetadata?.task_id : null, 
          selectedProductionJobId: sessionType === 'production_task' ? returnedMetadata?.task_id : null, 
          isScanning: true, 
          sessionStartTime: new Date(),
          lastScanMessage: `Session for ${sessionData.name} started.`,
          scannedDrumsForCurrentTask: [], 
        });
        console.log('[SessionStore] state AFTER successful session creation in confirmStartSession:', get());
        get().logCurrentState('confirmStartSession_success');
        if (sessionType === 'task' && returnedMetadata?.task_id) {
          get().fetchActiveTaskDrumDetails(returnedMetadata.task_id);
        } else if (sessionType === 'production_task' && returnedMetadata?.task_id) {
          get().fetchActiveProductionJobDrums(returnedMetadata.task_id); 
        } else {
          set({ activeTaskDrumDetails: [], activeProductionJobDrums: [] }); 
        }
      } else {
        throw new Error("Session data not returned/valid after insert.");
      }
    } catch (error) {
      console.error("Error in confirmStartSession:", error);
      set({ isScanning: false, lastScanStatus: 'error', lastScanMessage: 'Failed to start session.' });
      get().logCurrentState('confirmStartSession_catch_error');
    }
  },
  
  syncSessionStateOnMount: async () => {
    console.log("[SessionStore] Syncing session state on mount...");
    set({ isInitializing: true });
    get().logCurrentState('syncSessionStateOnMount_start');
    const clientDeviceId = getDeviceId();
    const supabase = createClient(); 

    const { data: { session: authUserSession }, error: authErr } = await supabase.auth.getSession();
    if (authErr || !authUserSession) {
      console.error('[SessionStore] Auth error or no user session during sync:', authErr);
      set({ isInitializing: false, lastScanStatus: 'idle', lastScanMessage: 'Auth error.', currentSessionId: null, currentLocation: null, currentSessionTaskId: null, selectedProductionJobId: null, sessionType: null, isCurrentTaskBatchCodeSubmitted: false, currentBatchTableId: null, currentTaskBatchCodeInput: '' });
      get().logCurrentState('syncSessionStateOnMount_auth_error');
      return;
    }
    const userId = authUserSession.user.id;

    try {
      console.log(`[SessionStore] Checking for active session for User: ${userId}, Device: ${clientDeviceId}`);
      const { data: activeSessionFromServer, error: queryError } = await supabase
        .from('sessions')
        .select('id, name, device_id, metadata, location, started_at, status, created_by, task') 
        .eq('device_id', clientDeviceId)
        .eq('created_by', userId)
        .eq('status', 'in_progress')
        .maybeSingle();

      if (queryError) {
        console.error('[SessionStore] Error querying active session directly:', queryError);
        set({ isInitializing: false, lastScanStatus: 'error', lastScanMessage: 'DB error syncing.', currentSessionId: null });
        get().logCurrentState('syncSessionStateOnMount_db_query_error');
        return;
      }

      if (activeSessionFromServer) {
        console.log(`[SessionStore] Active session found directly: ${activeSessionFromServer.id} for device ${activeSessionFromServer.device_id}`);
        
        const serverSessionTaskType = activeSessionFromServer.task; 
        const metadata = (typeof activeSessionFromServer.metadata === 'object' && activeSessionFromServer.metadata !== null) 
                         ? activeSessionFromServer.metadata as unknown as SessionMetadata 
                         : null;

        let clientSessionType: SessionType = null;
        if (serverSessionTaskType === 'transport') clientSessionType = 'task';
        else if (serverSessionTaskType === 'free_scan') clientSessionType = 'free_scan';
        else if (serverSessionTaskType === 'production_input' && metadata?.task_id) { 
          clientSessionType = 'production_task';
        }
        else if (serverSessionTaskType === 'misc' && metadata?.task_id) { 
            clientSessionType = 'production_task';
        }
        
        const batchIdFromMeta = clientSessionType === 'task' ? metadata?.batch_id : null;
        const batchCodeSubmittedForTask = clientSessionType === 'task' && !!batchIdFromMeta;
        
        const serverLocationValue = activeSessionFromServer.location;
        let storeLocation: Location | null = null;
        if (isLocationEnumValue(serverLocationValue)) {
            storeLocation = serverLocationValue;
        } else if (serverLocationValue) {
            console.warn(`[SessionStore] Invalid location value '${serverLocationValue}' from server, setting currentLocation to null.`);
        }

        set(state => ({
          isInitializing: false,
          currentSessionId: activeSessionFromServer.id,
          currentSessionName: activeSessionFromServer.name || null,
          currentSessionTaskId: clientSessionType === 'task' ? metadata?.task_id || null : null,
          selectedProductionJobId: clientSessionType === 'production_task' ? metadata?.task_id || null : null,
          sessionType: clientSessionType, 
          currentLocation: storeLocation ?? state.currentLocation, 
          sessionStartTime: activeSessionFromServer.started_at ? new Date(activeSessionFromServer.started_at) : new Date(), 
          lastScanMessage: 'Resumed active session.',
          isScanning: true,
          scannedDrumsForCurrentTask: [],
          isCurrentTaskBatchCodeSubmitted: batchCodeSubmittedForTask,
          currentBatchTableId: batchIdFromMeta || null,
          currentTaskBatchCodeInput: '', 
        }));
        console.log('[SessionStore] state AFTER syncSessionStateOnMount (active session found):', get());
        get().logCurrentState('syncSessionStateOnMount_active_session_found');

        if (clientSessionType === 'task' && metadata?.task_id) {
          get().fetchActiveTaskDrumDetails(metadata.task_id);
        } else if (clientSessionType === 'production_task' && metadata?.task_id) {
          get().fetchActiveProductionJobDrums(metadata.task_id); 
        } else {
          set({ activeTaskDrumDetails: [], activeProductionJobDrums: [] }); 
        }
      } else {
        console.log("[SessionStore] No active session found directly for this user and device.");
        set({ isInitializing: false, currentSessionId: null, currentLocation: null, currentSessionName: null, currentSessionTaskId: null, selectedProductionJobId: null, sessionType: null, lastScanMessage: 'Ready.', isScanning: false, isCurrentTaskBatchCodeSubmitted: false, currentBatchTableId: null, currentTaskBatchCodeInput: '' });
        console.log('[SessionStore] state AFTER syncSessionStateOnMount (no active session):', get());
        get().logCurrentState('syncSessionStateOnMount_no_active_session');
      }
    } catch (error: unknown) {
      console.error('[SessionStore] Unexpected error during direct session state sync:', error);
      set({ isInitializing: false, currentSessionId: null, currentLocation: null, currentSessionName: null, currentSessionTaskId: null, selectedProductionJobId: null, sessionType: null, lastScanStatus: 'error', lastScanMessage: 'Error syncing.', isScanning: false, isCurrentTaskBatchCodeSubmitted: false, currentBatchTableId: null, currentTaskBatchCodeInput: '' });
      get().logCurrentState('syncSessionStateOnMount_catch_error');
    }
  },

  endSession: async () => {
    const { currentSessionId, currentSessionName, sessionStartTime } = get(); 
    if (!currentSessionId) {
      set({ lastScanMessage: 'No active session to end.' });
      return;
    }
    console.log(`[SessionStore] Attempting to end session: ${currentSessionId}`);
    set({ isScanning: true, lastScanMessage: 'Ending session...' }); 
    get().logCurrentState('endSession_start');
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.error("[SessionStore] Auth error ending session: No user found");
        set({ isScanning: false, currentSessionId: null, currentSessionName: null, sessionStartTime: null, currentSessionTaskId: null, selectedProductionJobId: null, sessionType: null, lastScanStatus: 'error', lastScanMessage: 'Auth error. Session ended locally.', scannedDrumsForCurrentTask: [], activeTaskDrumDetails: [], activeProductionJobDrums: [], isCurrentTaskBatchCodeSubmitted: false, currentBatchTableId: null, currentTaskBatchCodeInput: '' });
        get().logCurrentState('endSession_auth_error');
        return;
    }

    try {
      const { data, error } = await supabase
        .from('sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', currentSessionId)
        .eq('created_by', user.id)
        .eq('status', 'in_progress')
        .select()
        .single();

      if (error) {
        console.error(`[SessionStore] Error ending session ${currentSessionId} directly in DB:`, error);
        if (error.code === 'PGRST116') { 
            set({ lastScanMessage: 'Session already ended or not found.'});
        } else {
            set({ lastScanStatus: 'error', lastScanMessage: `Failed to end session: ${error.message}` });
        }
        get().logCurrentState('endSession_db_update_error');
      }
      
      console.log(`[SessionStore] Session ${currentSessionId} marked as completed in DB.`);
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
        scannedBarcodes: get().scannedDrumsForCurrentTask.map(bc => ({ id: bc, raw_barcode: bc })), 
        xpStart: 0, 
        xpEnd: get().scannedDrumsForCurrentTask.length * 10, 
        currentLevel: 1, 
        sessionName: currentSessionName || undefined,
      };
      set(state => ({
        ...state,
        isScanning: false, 
        currentSessionId: null, 
        currentSessionName: null, 
        sessionStartTime: null, 
        currentSessionTaskId: null, 
        selectedProductionJobId: null, 
        sessionType: null, 
        lastScanStatus: 'idle', 
        lastScanMessage: 'Session ended.',
        showSessionReport: true, 
        sessionReportData: reportData, 
        scannedDrumsForCurrentTask: [], 
        activeTaskDrumDetails: [], 
        activeProductionJobDrums: [],
        selectedTaskId: null,
        isCurrentTaskBatchCodeSubmitted: false, 
        currentBatchTableId: null, 
        currentTaskBatchCodeInput: '', 
      }));
      console.log('[SessionStore] state AFTER endSession:', get());
      get().logCurrentState('endSession_success');

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error ending session';
      console.error('[SessionStore] Error in endSession (direct DB update):', message);
      set(state => ({
        ...state,
        isScanning: false, 
        currentSessionId: null, 
        currentSessionName: null, 
        sessionStartTime: null, 
        currentSessionTaskId: null, 
        selectedProductionJobId: null, 
        sessionType: null, 
        lastScanStatus: 'error', 
        lastScanMessage: `Ended locally. Client error: ${message}`,
        scannedDrumsForCurrentTask: [], 
        activeTaskDrumDetails: [], 
        activeProductionJobDrums: [],
        selectedTaskId: null,
        isCurrentTaskBatchCodeSubmitted: false, 
        currentBatchTableId: null, 
        currentTaskBatchCodeInput: '' 
      }));
      get().logCurrentState('endSession_catch_error');
    }
  },

  processScan: async (barcode: string) => {
    const { 
      currentSessionId, 
      currentSessionTaskId, 
      selectedProductionJobId, 
      scannedDrumsForCurrentTask, 
      activeTaskDrumDetails, 
      activeProductionJobDrums, 
      currentLocation, 
      sessionType,
      currentBatchTableId 
    } = get(); 
    const supabase = createClient(); 
    const { data: { user }, error: userError } = await supabase.auth.getUser(); 
    get().logCurrentState('processScan_start');

    if (!currentSessionId) { 
      console.warn("[SessionStore] processScan called without active session.");
      const noSessionMsg = 'No active session for scan.';
      set({ lastScanStatus: 'error', lastScanMessage: noSessionMsg });
      get().logCurrentState('processScan_no_active_session');
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
          batch_id: sessionType === 'task' ? currentBatchTableId : null,
        });
      }
      return;
    }

    if (userError || !user) {
      console.error("[SessionStore] Auth error for scan:", userError);
      const authErrorMsg = 'Authentication error.';
      set({ isScanning: false, lastScanStatus: 'error', lastScanMessage: authErrorMsg });
      get().logCurrentState('processScan_auth_error');
      await supabase.from('session_scans').insert({
        session_id: currentSessionId, 
        raw_barcode: barcode,
        scan_status: 'error' as ScanStatus,
        scan_action: sessionType === 'free_scan' ? 'free_scan' : (sessionType === 'production_task' ? 'production_input' : 'process') as ScanType,
        error_message: authErrorMsg,
        user_id: user?.id || undefined,
        device_id: getDeviceId(),
        pol_id: sessionType === 'task' ? currentSessionTaskId : null,
        batch_id: sessionType === 'task' ? currentBatchTableId : null,
      });
      return;
    }

    set({ isScanning: true, lastScanMessage: `Processing ${barcode}...` });

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
          pol_id: null, 
          pod_id: null,
          item_name: null,
        };
        const { error: logError } = await supabase.from('session_scans').insert(logEntry);
        if (logError) {
          console.error("[SessionStore] CRITICAL: Failed to log free_scan to public.session_scans:", logError, logEntry);
          set({ isScanning: false, lastScanStatus: 'error', lastScanMessage: 'Failed to record free scan.' });
          get().logCurrentState('processScan_free_scan_error');
          return;
        }
        console.log("[SessionStore] Free scan result logged to public.session_scans:", logEntry);
        const newScannedDrums = scannedDrumsForCurrentTask.includes(barcode) ? scannedDrumsForCurrentTask : [...scannedDrumsForCurrentTask, barcode];
        set({
          isScanning: false,
          lastScanStatus: 'success',
          lastScanMessage: `Barcode ${barcode} recorded (Free Scan).`,
          lastScanId: null, 
          scannedDrumsForCurrentTask: newScannedDrums,
        });
        get().logCurrentState('processScan_free_scan_success');
      } catch (error) {
        console.error("Error processing free scan:", error);
        set({ isScanning: false, lastScanStatus: 'error', lastScanMessage: `Failed to process free scan for ${barcode}.` });
        get().logCurrentState('processScan_free_scan_error');
      }
      return; 
    }

    if (sessionType === 'task') {
      if (!currentSessionTaskId || !currentBatchTableId) { 
        console.warn("[SessionStore] processScan (task) called without active task ID or batch ID.");
        const noTaskMsg = 'No active task or batch for scan in current session.';
        set({ lastScanStatus: 'error', lastScanMessage: noTaskMsg });
        get().logCurrentState('processScan_task_no_task_or_batch');
        await supabase.from('session_scans').insert({
          session_id: currentSessionId,
          raw_barcode: barcode,
          scan_status: 'error' as ScanStatus,
          scan_action: 'process' as ScanType, 
          error_message: noTaskMsg,
          user_id: user.id,
          device_id: getDeviceId(),
          pol_id: currentSessionTaskId, 
          batch_id: currentBatchTableId,
        });
        return;
      }

      if (scannedDrumsForCurrentTask.includes(barcode)){
        const message = `Drum ${barcode} already scanned for this task.`;
        set({ lastScanStatus: 'error', lastScanMessage: message });
        get().logCurrentState('processScan_task_already_scanned');
        if (user) {
           await supabase.from('session_scans').insert({
            session_id: currentSessionId,
            raw_barcode: barcode,
            scan_status: 'error' as ScanStatus,
            scan_action: 'check_in' as ScanType, 
            error_message: message,
            user_id: user.id,
            device_id: getDeviceId(),
            pol_id: currentSessionTaskId,
            batch_id: currentBatchTableId,
          });
        }
        return;
      }

      set({ isScanning: true, lastScanMessage: `Processing ${barcode}...` }); 

      let scanResult: { status: ScanStatus; message: string; pod_id?: string | null; item_name?: string | null; error?: PostgrestError | Error | null } = {
        status: 'error',
        message: 'Scan processing failed unexpectedly.',
        error: null,
      };

      try {
        const { data: drumData, error: drumError } = await supabase
          .schema('inventory')
          .from('purchase_order_drums')
          .select('pod_id, serial_number, is_received, pol_id') 
          .eq('serial_number', barcode)
          .eq('pol_id', currentSessionTaskId) 
          .maybeSingle();

        if (drumError) {
          console.error("Error checking drum in DB:", drumError);
          scanResult = { status: 'error', message: 'Database error checking drum.', error: drumError };
          get().logCurrentState('processScan_task_drum_check_db_error');
          throw drumError; 
        }

        if (!drumData) {
          const message = `Drum ${barcode} not part of current task.`;
          console.log(message);
          scanResult = { status: 'error', message: message, error: new Error(message) };
          get().logCurrentState('processScan_task_drum_not_part_of_task');
        } else {
            const { error: updateError } = await supabase
              .schema('inventory')
              .from('purchase_order_drums')
              .update({ is_received: true })
              .eq('pod_id', drumData.pod_id);

            if (updateError) {
              console.error("Error updating drum in DB:", updateError);
               scanResult = { status: 'error', message: 'Database error updating drum.', error: updateError };
              get().logCurrentState('processScan_task_drum_update_db_error');
              throw updateError; 
            }
            const existingDrumDetail = activeTaskDrumDetails.find(d => d.pod_id === drumData.pod_id);
            const itemName: string | null = existingDrumDetail?.item_name || null;

            const message = `Drum ${barcode} received.`;
            console.log(`${message} for task ${currentSessionTaskId}.`);
            scanResult = { status: 'success', message: message, pod_id: drumData.pod_id, item_name: itemName };
            const updatedDrumDetails = activeTaskDrumDetails.map(d =>
              d.serial_number === barcode ? { ...d, is_received: true } : d
            );
            const newScannedDrums = scannedDrumsForCurrentTask.includes(barcode) ? scannedDrumsForCurrentTask : [...scannedDrumsForCurrentTask, barcode];

            set({
              isScanning: false, 
              lastScanStatus: scanResult.status,
              lastScanMessage: scanResult.message,
              lastScanId: scanResult.pod_id, 
              scannedDrumsForCurrentTask: newScannedDrums,
              activeTaskDrumDetails: updatedDrumDetails,
            });
            const tasks = get().availableTasks.map(task =>
              task.id === currentSessionTaskId
                ? { ...task, receivedQuantity: task.receivedQuantity + 1, remainingQuantity: task.remainingQuantity - 1 }
                : task
            );
            set({ availableTasks: tasks });
            get().logCurrentState('processScan_task_success');
        }

      } catch (error) {
        console.error("Error processing scan:", error);
        if(scanResult.status !== 'error') {
            scanResult = { status: 'error', message: `Failed to process scan for ${barcode}.`, error: error instanceof Error ? error : new Error(String(error)) };
        }
         set({ isScanning: false, lastScanStatus: 'error', lastScanMessage: scanResult.message });
         get().logCurrentState('processScan_task_catch_error');
      } finally {
          try {
              const logEntry = {
                  session_id: currentSessionId,
                  raw_barcode: barcode,
                  scan_status: scanResult.status,
                  scan_action: 'check_in' as ScanType, 
                  error_message: scanResult.status === 'error' ? scanResult.message : null,
                  user_id: user.id, 
                  device_id: getDeviceId(),
                  pol_id: currentSessionTaskId,
                  pod_id: scanResult.pod_id, 
                  item_name: scanResult.item_name, 
                  batch_id: currentBatchTableId, 
              };
              const { error: logError } = await supabase.from('session_scans').insert(logEntry);
              if (logError) {
                  console.error("[SessionStore] CRITICAL: Failed to log scan result to public.session_scans:", logError, logEntry);
              } else {
                   console.log("[SessionStore] Scan result logged to public.session_scans:", logEntry);
              }
          } catch (logCatchError) {
               console.error("[SessionStore] CRITICAL: Exception during scan logging:", logCatchError);
          }
          if (get().isScanning) {
            set({ isScanning: false });
          }
      }
    }

    if (sessionType === 'production_task') {
      if (!selectedProductionJobId) {
        console.warn("[SessionStore] processScan (production) called without active job ID.");
        const noJobMsg = 'No active production job for scan.';
        set({ lastScanStatus: 'error', lastScanMessage: noJobMsg });
        get().logCurrentState('processScan_production_no_job_id');
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

      // Validation 1 – ensure we have not scanned this drum already in this job in this session
      if (activeProductionJobDrums.some(d => d.serial_number === barcode)) {
         const message = `Drum ${barcode} already assigned to this production job.`;
         set({ lastScanStatus: 'error', lastScanMessage: message });
         get().logCurrentState('processScan_production_already_assigned');
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
      let opDataForLog: {op_id: string; op_type: string} | null = null;

      try {
        const { data: drumInvData, error: drumInvError } = await supabase
          .schema('inventory')
          .from('drums')
          .select(`
            drum_id, 
            batch_id, 
            batches (
              item_id,
              items ( name )
            ),
            status
          `)
          .eq('serial_number', barcode)
          .single();

        if (drumInvError || !drumInvData) {
          const msg = drumInvError ? 'DB error finding drum.' : `Drum ${barcode} not found in inventory.`;
          scanResult = { ...scanResult, status: 'error', message: msg, error: drumInvError || new Error(msg) };
          get().logCurrentState('processScan_production_drum_find_error');
          throw scanResult.error;
        }
        
        // Validation 2 – ensure drum is currently in stock
        if (drumInvData.status !== 'in_stock') {
          const msg = `Drum ${barcode} status ${drumInvData.status} – expected in_stock.`;
          scanResult = { ...scanResult, status: 'error', message: msg, error: new Error(msg) };
          get().logCurrentState('processScan_production_drum_not_in_stock');
          throw scanResult.error;
        }

        // Validation 3 – ensure drum belongs to the input batch for this production job
        const jobDetails = get().availableProductionTasks.find(j => j.job_id === selectedProductionJobId);
        if (jobDetails && jobDetails.input_batch_id && drumInvData.batch_id !== jobDetails.input_batch_id) {
          const msg = `Drum ${barcode} does not belong to batch required for this job.`;
          scanResult = { ...scanResult, status: 'error', message: msg, error: new Error(msg) };
          get().logCurrentState('processScan_production_drum_wrong_batch');
          throw scanResult.error;
        }

        const drumId = drumInvData.drum_id;
        const itemNameFromDrum = drumInvData.batches?.items?.name || 'Unknown Item';
        scanResult.item_name = itemNameFromDrum; 

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
          get().logCurrentState('processScan_production_op_find_error');
          throw scanResult.error;
        }
        opDataForLog = opData; 
        scanResult.op_id_for_log = opData.op_id;

        const volumeToTransfer = 200; 
        const { error: opDrumError } = await supabase
          .schema('production')
          .from('operation_drums')
          .insert({
            op_id: opData.op_id,
            drum_id: drumId,
            scan_id: -1, 
            volume_transferred: volumeToTransfer 
          });

        if (opDrumError) {
          scanResult = { ...scanResult, status: 'error', message: 'DB error assigning drum to operation.', error: opDrumError };
          get().logCurrentState('processScan_production_op_drum_error');
          throw opDrumError;
        }
        await supabase.schema('inventory').from('drums').update({ status: 'pre_production' }).eq('drum_id', drumId);

        scanResult = { ...scanResult, status: 'success', message: `Drum ${barcode} assigned to operation ${opData.op_type} for job.`, drum_id: drumId };
        
        set(state => ({
          isScanning: false,
          lastScanStatus: 'success',
          lastScanMessage: scanResult.message,
          activeProductionJobDrums: [...state.activeProductionJobDrums, { drum_id: drumId, serial_number: barcode, volume_transferred: volumeToTransfer }],
        }));
        get().logCurrentState('processScan_production_success');

      } catch (error) {
        console.error("Error processing production scan:", error);
        if(scanResult.status !== 'error') { 
            scanResult = { status: 'error', message: `Failed to process production scan for ${barcode}.`, error: error instanceof Error ? error : new Error(String(error)) };
        }
        set({ isScanning: false, lastScanStatus: 'error', lastScanMessage: scanResult.message });
        get().logCurrentState('processScan_production_catch_error');
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
                  op_id: scanResult.op_id_for_log, 
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
// Adding an initial log after store creation for visibility
useSessionStore.getState().logCurrentState('store_initialized'); 