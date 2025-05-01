"use client";

import { createContext, useState, ReactNode } from "react";

export interface ModalContextType {
  isSettingsModalOpen: boolean;
  openSettingsModal: () => void;
  closeSettingsModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

/**
 * Provides modal state management
 *
 * This provider allows components to share modal state and control
 * without prop drilling or complex state management.
 */
export function ModalProvider({ children }: { children: ReactNode }) {
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const openSettingsModal = () => {
    console.log("[ModalProvider] Opening settings modal");
    setIsSettingsModalOpen(true);
  };

  const closeSettingsModal = () => {
    console.log("[ModalProvider] Closing settings modal");
    setIsSettingsModalOpen(false);
  };

  return (
    <ModalContext.Provider
      value={{
        isSettingsModalOpen,
        openSettingsModal,
        closeSettingsModal,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
}
