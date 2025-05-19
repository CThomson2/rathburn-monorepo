import { create } from 'zustand';

interface DebugLog {
  timestamp: Date;
  message: string;
  data?: Record<string, unknown>;
}

interface DebugLogState {
  logs: DebugLog[];
  isLogPanelVisible: boolean;
  addLog: (message: string, data?: Record<string, unknown>) => void;
  toggleLogPanel: () => void;
  clearLogs: () => void;
}

const MAX_LOGS = 100; // Keep a maximum of 100 log entries

export const useDebugLogStore = create<DebugLogState>((set, get) => ({
  logs: [],
  isLogPanelVisible: false,
  addLog: (message, data) => {
    const newLog: DebugLog = { timestamp: new Date(), message, data };
    set((state) => ({
      logs: [newLog, ...state.logs].slice(0, MAX_LOGS),
    }));
  },
  toggleLogPanel: () => {
    set((state) => ({ isLogPanelVisible: !state.isLogPanelVisible }));
  },
  clearLogs: () => {
    set({ logs: [] });
  },
})); 