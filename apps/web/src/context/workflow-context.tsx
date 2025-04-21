"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface WorkflowContextType {
  showWorkflowCards: boolean;
  toggleWorkflowCards: () => void;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(
  undefined
);

/**
 * Provider component for workflow context
 *
 * Wraps the application with state and methods related to the display of workflow cards.
 * Provides `showWorkflowCards` state and `toggleWorkflowCards` method to its children
 * through the `WorkflowContext`.
 *
 * @param {ReactNode} children - The child components that will have access to the workflow context.
 */
export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [showWorkflowCards, setShowWorkflowCards] = useState(false);

  const toggleWorkflowCards = () => {
    setShowWorkflowCards((prev) => !prev);
  };

  return (
    <WorkflowContext.Provider
      value={{ showWorkflowCards, toggleWorkflowCards }}
    >
      {children}
    </WorkflowContext.Provider>
  );
}

export function useWorkflow() {
  const context = useContext(WorkflowContext);
  if (context === undefined) {
    throw new Error("useWorkflow must be used within a WorkflowProvider");
  }
  return context;
}
