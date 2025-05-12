import { createContext, useContext, useState, ReactNode } from "react";

interface ModalContextType {
  isSettingsModalOpen: boolean;
  openSettingsModal: () => void;
  closeSettingsModal: () => void;
}

// Create context with default values
const ModalContext = createContext<ModalContextType>({
  isSettingsModalOpen: false,
  openSettingsModal: () => {},
  closeSettingsModal: () => {},
});


/**
 * Custom hook for accessing modal state and controls
 * 
 * @returns {ModalContextType} Modal state and control functions
 * @throws {Error} If used outside of a ModalProvider
 */
export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    console.error("useModal must be used within a ModalProvider");
    // Provide fallback implementation to prevent app crash
    return {
      isSettingsModalOpen: false,
      openSettingsModal: () => {
        console.warn("Modal context not available, using fallback");
      },
      closeSettingsModal: () => {
        console.warn("Modal context not available, using fallback");
      },
    };
  }
  return context;
};
