import React, { createContext, useState, useContext, ReactNode } from "react";

interface LogsContextType {
  logMessages: string[];
  isLogOverlayVisible: boolean;
  addLogMessage: (message: string) => void;
  toggleLogOverlay: () => void;
  clearLogs: () => void;
}

const LogsContext = createContext<LogsContextType | undefined>(undefined);

export function LogsProvider({ children }: { children: ReactNode }) {
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const [isLogOverlayVisible, setIsLogOverlayVisible] = useState(false);

  const addLogMessage = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogMessages((prevMessages) => [
      `[${timestamp}] ${message}`,
      ...prevMessages.slice(0, 49),
    ]); // Keep last 50
  };

  const toggleLogOverlay = () => {
    setIsLogOverlayVisible((prev) => !prev);
  };

  const clearLogs = () => {
    setLogMessages([]);
  };

  return (
    <LogsContext.Provider
      value={{
        logMessages,
        isLogOverlayVisible,
        addLogMessage,
        toggleLogOverlay,
        clearLogs,
      }}
    >
      {children}
    </LogsContext.Provider>
  );
}

export function useLogs() {
  const context = useContext(LogsContext);
  if (context === undefined) {
    throw new Error("useLogs must be used within a LogsProvider");
  }
  return context;
}
