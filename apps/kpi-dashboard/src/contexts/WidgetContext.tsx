
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "@/hooks/use-toast";
import { useLocalStorage } from "@/hooks/use-local-storage";

export type WidgetDefinition = {
  id: string;
  title: string;
  description: string;
  category: "data" | "notification" | "admin" | "reporting" | "inventory";
  icon: ReactNode;
  component: ReactNode;
  isCore?: boolean;
  requiredRole?: string;
};

type DashboardLayout = {
  widgets: string[];
};

interface WidgetContextType {
  availableWidgets: WidgetDefinition[];
  dashboardWidgets: WidgetDefinition[];
  addToDashboard: (widgetId: string) => void;
  removeFromDashboard: (widgetId: string) => void;
  isWidgetInDashboard: (widgetId: string) => boolean;
  canAddWidget: (widgetId: string) => boolean;
}

const WidgetContext = createContext<WidgetContextType | null>(null);

export const useWidgets = () => {
  const context = useContext(WidgetContext);
  if (!context) {
    throw new Error("useWidgets must be used within a WidgetProvider");
  }
  return context;
};

export const WidgetProvider = ({ children }: { children: ReactNode }) => {
  const [availableWidgets, setAvailableWidgets] = useState<WidgetDefinition[]>([]);
  const [dashboardLayout, setDashboardLayout] = useLocalStorage<DashboardLayout>(
    "dashboard-layout",
    { widgets: [] }
  );

  // Load available widgets from API or define statically
  useEffect(() => {
    // In a real app, you might fetch this from your backend
    // For now, we'll define them statically in a separate file and import
    import("@/data/widget-definitions").then((module) => {
      setAvailableWidgets(module.widgetDefinitions);
    });
  }, []);

  // Get widget definitions for the current dashboard
  const dashboardWidgets = availableWidgets.filter(
    (widget) => dashboardLayout.widgets.includes(widget.id) || widget.isCore
  );

  // Check if a widget is already in the dashboard
  const isWidgetInDashboard = (widgetId: string) => {
    return dashboardLayout.widgets.includes(widgetId) || 
           availableWidgets.find(w => w.id === widgetId)?.isCore === true;
  };

  // Check if user can add this widget (based on roles, etc.)
  const canAddWidget = (widgetId: string) => {
    const widget = availableWidgets.find(w => w.id === widgetId);
    if (!widget) return false;
    
    // If widget requires a role, check if user has it
    // For now, we'll allow all widgets since we haven't implemented roles yet
    return !widget.requiredRole || true;
  };

  // Add a widget to the dashboard
  const addToDashboard = (widgetId: string) => {
    // Don't add if it's already there or is a core widget
    if (isWidgetInDashboard(widgetId)) return;
    
    const widget = availableWidgets.find(w => w.id === widgetId);
    if (!widget) {
      toast({
        title: "Error",
        description: "Widget not found",
        variant: "destructive"
      });
      return;
    }
    
    // Check if user can add this widget
    if (!canAddWidget(widgetId)) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to add this widget",
        variant: "destructive"
      });
      return;
    }
    
    setDashboardLayout(prev => ({
      ...prev,
      widgets: [...prev.widgets, widgetId]
    }));
    
    toast({
      title: "Widget Added",
      description: `${widget.title} has been added to your dashboard`,
    });
  };

  // Remove a widget from the dashboard
  const removeFromDashboard = (widgetId: string) => {
    const widget = availableWidgets.find(w => w.id === widgetId);
    
    // Don't allow removing core widgets
    if (widget?.isCore) {
      toast({
        title: "Cannot Remove",
        description: "This is a core widget that cannot be removed",
        variant: "destructive"
      });
      return;
    }
    
    setDashboardLayout(prev => ({
      ...prev,
      widgets: prev.widgets.filter(id => id !== widgetId)
    }));
    
    if (widget) {
      toast({
        title: "Widget Removed",
        description: `${widget.title} has been removed from your dashboard`,
      });
    }
  };

  return (
    <WidgetContext.Provider
      value={{
        availableWidgets,
        dashboardWidgets,
        addToDashboard,
        removeFromDashboard,
        isWidgetInDashboard,
        canAddWidget
      }}
    >
      {children}
    </WidgetContext.Provider>
  );
};
