"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

interface SidebarContextType {
  isOpen: boolean;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isOpen: true,
  toggle: () => {},
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);

  const toggle = useCallback(() => setIsOpen(!isOpen), [isOpen]);

  useEffect(() => {
    const handleToggleSidebar = () => {
      toggle();
    };

    const toggleBtn = document.querySelector("[data-toggle-sidebar]");
    toggleBtn?.addEventListener("click", handleToggleSidebar);

    return () => {
      toggleBtn?.removeEventListener("click", handleToggleSidebar);
    };
  }, [toggle]);

  return (
    <SidebarContext.Provider value={{ isOpen, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
