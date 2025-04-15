"use client";

import {
  Package2,
  RefreshCcw,
  Truck,
  ClipboardList,
  Calendar,
  Tag,
  ArchiveX,
  ListChecks,
  ScanEye,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  WorkflowCard,
  WorkflowRole,
} from "@/components/core/patterns/cards/workflow-card";
// import { CountdownTimer } from "@/features/countdown-timer";
import DashboardLayout from "@/components/desktop/layout/dashboard-layout";
// import { BarcodeGenerator } from "@/features/dashboards/inventory/components/barcode-generator";
import ChemicalInventoryDashboard from "@/features/inventory/dashboard";

// Metadata needs to be defined in a separate layout or specific metadata file for client components
// as they cannot use the metadata export directly

export default function HomePage() {
  // Create countdown target date: April 7, 2025, 8:00 AM
  const targetDate = new Date(2025, 3, 7, 8, 0, 0);
  const [showWorkflowCards, setShowWorkflowCards] = useState(false);

  // Share the workflow cards state with header controls
  useEffect(() => {
    // Expose the setter function globally for the HeaderControls to access
    (window as any).toggleWorkflowCards = () => setShowWorkflowCards(prev => !prev);
    
    // Cleanup function to remove the global reference when component unmounts
    return () => {
      delete (window as any).toggleWorkflowCards;
    };
  }, []);

  const workflowCards = [
    {
      title: "Create New Order",
      description: "Record new orders and view active orders",
      icon: <ClipboardList className="h-16 w-16" />,
      roleIcon: <ScanEye className="h-8 w-8" />,
      role: "all" as WorkflowRole,
      path: "/orders",
      restricted: false,
    },
    {
      title: "Record Batch Delivery",
      description: "Record raw material deliveries on site",
      icon: <Truck className="h-16 w-16" />,
      roleIcon: <ScanEye className="h-4 w-4" />,
      role: "operator" as WorkflowRole,
      path: "/deliveries",
      restricted: false,
    },
    {
      title: "Manage Drum Stock",
      description: "View and update all drum details",
      icon: <Package2 className="h-16 w-16" />,
      roleIcon: <ScanEye className="h-4 w-4" />,
      role: "manager" as WorkflowRole,
      path: "/drums",
      restricted: false,
    },
    {
      title: "Schedule Production Runs",
      description: "Edit and update production schedule",
      icon: <Calendar className="h-16 w-16" />,
      roleIcon: <ScanEye className="h-4 w-4" />,
      role: "manager" as WorkflowRole,
      path: "/scheduling",
      restricted: true,
    },
    {
      title: "Deactivate Drum Label",
      description: "Replace drum label with reason",
      icon: <Tag className="h-16 w-16" />,
      roleIcon: <ScanEye className="h-4 w-4" />,
      role: "operator" as WorkflowRole,
      path: "/drums/label",
      restricted: false,
    },
    {
      title: "Log Missing Stock",
      description: "Record and report missing inventory",
      icon: <ArchiveX className="h-16 w-16" />,
      roleIcon: <ScanEye className="h-4 w-4" />,
      role: "operator" as WorkflowRole,
      path: "/inventory/missing",
      restricted: false,
    },
    {
      title: "Transfer Drum Contents",
      description: "Manage drum content transfers",
      icon: <RefreshCcw className="h-16 w-16" />,
      roleIcon: <ScanEye className="h-4 w-4" />,
      role: "operator" as WorkflowRole,
      path: "/drums/transfer",
      restricted: false,
    },
    {
      title: "Quality Control",
      description: "Manage and lock quality control processes",
      icon: <ListChecks className="h-16 w-16" />,
      roleIcon: <ScanEye className="h-4 w-4" />,
      role: "admin" as WorkflowRole,
      path: "/quality",
      restricted: true,
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Inventory Management System
        </h1>

        {/* Countdown Timer */}
        {/* <CountdownTimer targetDate={targetDate} /> */}

        {/* Overlay that dims the page when the workflow menu is open */}
        {showWorkflowCards && (
          <div 
            className="fixed inset-0 bg-black/30 z-40 transition-opacity duration-300"
            onClick={() => setShowWorkflowCards(false)}
          />
        )}

        {/* Workflow Cards Dropdown Menu */}
        <div 
          className={`fixed inset-x-0 top-20 z-50 p-4 mx-auto max-w-7xl transition-all duration-300 ${
            showWorkflowCards 
              ? "opacity-100 translate-y-0" 
              : "opacity-0 -translate-y-10 pointer-events-none"
          }`}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-6">
              Workflow Dashboard
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {workflowCards.map((card, index) => (
                <WorkflowCard
                  key={index}
                  title={card.title}
                  description={card.description}
                  icon={card.icon}
                  role={card.role}
                  roleIcon={card.roleIcon}
                  path={card.path}
                  restricted={card.restricted}
                />
              ))}
            </div>
          </div>
        </div>

        <ChemicalInventoryDashboard />
      </div>
    </DashboardLayout>
  );
}
