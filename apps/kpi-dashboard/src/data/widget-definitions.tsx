
import React from "react";
import { BarChart3, Bell, Database, Search, CalendarDays, Users, FileText, TrendingUp } from "lucide-react";
import SQLQueryWidget from "@/components/widgets/SQLQueryWidget";
import NotificationsWidget from "@/components/widgets/NotificationsWidget";
import MetricCards from "@/components/widgets/MetricCards";
import InventoryCharts from "@/components/widgets/InventoryCharts";
import AlertsWidget from "@/components/widgets/AlertsWidget";
import OrderFormWidget from "@/components/widgets/OrderFormWidget";
import { WidgetDefinition } from "@/contexts/WidgetContext";

// For simplicity, we're defining our widgets here
// In a real app, you might fetch this from your backend
export const widgetDefinitions: WidgetDefinition[] = [
  {
    id: "sql-query",
    title: "SQL Query",
    description: "Run common inventory queries and view results",
    category: "data",
    icon: <Database className="h-5 w-5" />,
    component: <SQLQueryWidget />,
    isCore: true // Core widgets can't be removed
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "View and send notifications to team members",
    category: "notification",
    icon: <Bell className="h-5 w-5" />,
    component: <NotificationsWidget />,
    isCore: true
  },
  {
    id: "metric-cards",
    title: "Inventory Metrics",
    description: "Key inventory metrics at a glance",
    category: "reporting",
    icon: <TrendingUp className="h-5 w-5" />,
    component: <MetricCards 
      totalValue={1250000}
      belowSafetyStock={12}
      pendingOrders={8}
      stockAccuracy={96}
    />,
    isCore: false
  },
  {
    id: "inventory-charts",
    title: "Inventory Charts",
    description: "Visual charts showing inventory trends and distribution",
    category: "reporting",
    icon: <BarChart3 className="h-5 w-5" />,
    component: <InventoryCharts 
      stockLevels={[
        { name: "Raw Material A", quantity: 2500, value: 125000 },
        { name: "Raw Material B", quantity: 1800, value: 90000 },
        { name: "Component X", quantity: 3200, value: 160000 },
        { name: "Component Y", quantity: 2100, value: 105000 },
        { name: "Finished Product Z", quantity: 1500, value: 225000 }
      ]}
      categories={[
        { name: "Raw Materials", value: 480000 },
        { name: "Components", value: 320000 },
        { name: "Finished Products", value: 450000 }
      ]}
      trendData={[
        { date: "Jan", value: 1000000 },
        { date: "Feb", value: 1050000 },
        { date: "Mar", value: 1120000 },
        { date: "Apr", value: 1180000 },
        { date: "May", value: 1220000 },
        { date: "Jun", value: 1250000 }
      ]}
    />,
    isCore: false
  },
  {
    id: "alerts",
    title: "Alerts & Warnings",
    description: "Critical alerts and warnings about inventory issues",
    category: "notification",
    icon: <Bell className="h-5 w-5" />,
    component: <AlertsWidget alerts={[
      { id: 1, name: "Aluminum Sheets", level: "critical", currentStock: 15, minRequired: 50 },
      { id: 2, name: "Steel Rods", level: "warning", currentStock: 40, minRequired: 75 },
      { id: 3, name: "Circuit Boards", level: "normal", currentStock: 120, minRequired: 100 }
    ]} />,
    isCore: false
  },
  {
    id: "order-form",
    title: "Quick Order Form",
    description: "Quickly create new orders from the dashboard",
    category: "inventory",
    icon: <FileText className="h-5 w-5" />,
    component: <OrderFormWidget onSubmit={(data) => console.log("Order submitted:", data)} />,
    isCore: false
  },
  {
    id: "calendar",
    title: "Schedule Calendar",
    description: "View upcoming deliveries and scheduled operations",
    category: "reporting",
    icon: <CalendarDays className="h-5 w-5" />,
    component: <div className="h-64 flex items-center justify-center bg-muted/50 rounded-md">Calendar Widget (Coming Soon)</div>,
    isCore: false
  },
  {
    id: "user-activity",
    title: "User Activity",
    description: "Track user actions and audit logs",
    category: "admin",
    icon: <Users className="h-5 w-5" />,
    component: <div className="h-64 flex items-center justify-center bg-muted/50 rounded-md">User Activity Widget (Coming Soon)</div>,
    isCore: false,
    requiredRole: "admin" // This widget requires admin role
  },
  {
    id: "search",
    title: "Advanced Search",
    description: "Powerful search across all inventory data",
    category: "data",
    icon: <Search className="h-5 w-5" />,
    component: <div className="h-64 flex items-center justify-center bg-muted/50 rounded-md">Advanced Search Widget (Coming Soon)</div>,
    isCore: false
  }
];
