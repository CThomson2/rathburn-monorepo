import { create } from "zustand";
import { useDebugLogStore } from "./debug-log-store";

interface ScanState {
  isScanInputGloballyActive: boolean; // Should the scan input generally be trying to capture scans (e.g., session active)
  isManuallyPaused: boolean; // Is focus paused by a user action (e.g., typing a comment)
  barcode: string; // Current buffered barcode characters
  isScanInputDOMFocused: boolean; // Reflects the actual focus state of the DOM input element

  // Actions
  setScanInputGloballyActive: (isActive: boolean) => void;
  pauseScanInputTemporarily: () => void;
  resumeScanInputAfterPause: () => void;
  setBarcode: (value: string) => void;
  clearBarcode: () => void;
  setIsScanInputDOMFocused: (isFocused: boolean) => void;

  // Debugging
  logCurrentState: (triggerEvent: string) => void;

  // Callback to be triggered when a scan is complete
  _onScanCallback: ((barcode: string) => void) | null;
  setOnScanCallback: (callback: ((barcode: string) => void) | null) => void;
  triggerScanProcess: (scannedBarcode: string) => void;
}

export const useScanStore = create<ScanState>((set, get) => ({
  isScanInputGloballyActive: false,
  isManuallyPaused: false,
  barcode: "",
  isScanInputDOMFocused: false,
  _onScanCallback: null,

  logCurrentState: (triggerEvent) => {
    const state = get();
    const relevantState = {
      triggerEvent,
      isScanInputGloballyActive: state.isScanInputGloballyActive,
      isManuallyPaused: state.isManuallyPaused,
      barcode: state.barcode,
      isScanInputDOMFocused: state.isScanInputDOMFocused,
    };
    useDebugLogStore
      .getState()
      .addLog(`ScanStore: ${triggerEvent}`, relevantState);
  },

  setScanInputGloballyActive: (isActive) => {
    set({ isScanInputGloballyActive: isActive });
    // If globally deactivated, ensure manual pause is also reset.
    if (!isActive) {
      set({
        isManuallyPaused: false,
        barcode: "",
        isScanInputDOMFocused: false,
      });
    }
    get().logCurrentState("setScanInputGloballyActive");
  },

  pauseScanInputTemporarily: () => {
    // Only pause if it's globally active, otherwise, the pause has no effect.
    if (get().isScanInputGloballyActive) {
      set({ isManuallyPaused: true });
    }
    get().logCurrentState("pauseScanInputTemporarily");
  },

  resumeScanInputAfterPause: () => {
    set({ isManuallyPaused: false });
    get().logCurrentState("resumeScanInputAfterPause");
  },

  setBarcode: (value) => {
    // Only allow barcode changes if the input should be effectively active
    if (get().isScanInputGloballyActive && !get().isManuallyPaused) {
      set({ barcode: value });
    }
    get().logCurrentState("setBarcode");
  },

  clearBarcode: () => {
    set({ barcode: "" });
    get().logCurrentState("clearBarcode");
  },

  setIsScanInputDOMFocused: (isFocused) => {
    set({ isScanInputDOMFocused: isFocused });
    get().logCurrentState("setScanInputDOMFocused");
  },

  setOnScanCallback: (callback) => {
    set({ _onScanCallback: callback });
    // Add a log to confirm when the callback is set or cleared
    useDebugLogStore.getState().addLog(`ScanStore: setOnScanCallback`, { callback_is_set: !!callback });
  },

  triggerScanProcess: (scannedBarcode) => {
    const { _onScanCallback, logCurrentState, isScanInputGloballyActive, isManuallyPaused, barcode, isScanInputDOMFocused } = get(); // Destructure relevant state for logging
    logCurrentState("triggerScanProcess_entry"); // Log entry

    if (_onScanCallback) {
      useDebugLogStore.getState().addLog(`ScanStore: Invoking _onScanCallback for barcode: ${scannedBarcode}`);
      _onScanCallback(scannedBarcode);
    } else {
      useDebugLogStore.getState().addLog(`ScanStore: _onScanCallback is null. Barcode ${scannedBarcode} not processed further by callback.`);
    }
    get().clearBarcode(); // Clear barcode after attempting to trigger scan
    useDebugLogStore.getState().addLog(`ScanStore: triggerScanProcess_exit for barcode: ${scannedBarcode}`, {
        isScanInputGloballyActive,
        isManuallyPaused,
        barcode: get().barcode, // get current barcode after clear
        isScanInputDOMFocused,
        callback_is_set: !!_onScanCallback,
    });
  },
}));
