"use client";

import { useWorkflow } from "@/context/workflow-context";
import {
  WorkflowCard,
  WorkflowRole,
} from "@/components/core/patterns/workflow/workflow-card";
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

/**
 * A component that renders a workflow menu with a set of cards that represent
 * different workflow tasks. The menu is toggled by clicking on the workflow
 * button in the header. The cards are conditionally rendered based on the user's
 * role and whether the task is restricted.
 *
 * The workflow menu is rendered as an overlay that covers the entire page, and
 * the cards are rendered as a dropdown menu that appears below the overlay.
 *
 * The component uses the `useWorkflow` hook to get the `showWorkflowCards` and
 * `toggleWorkflowCards` state and functions from the workflow context.
 *
 * The component expects the following props:
 *
 * - `workflowCards`: An array of objects that represent the workflow cards.
 *   Each object should have the following properties:
 *   - `title`: The title of the workflow card.
 *   - `description`: A brief description of the workflow card.
 *   - `icon`: The icon to display on the workflow card.
 *   - `role`: The role that is required to view the workflow card.
 *   - `roleIcon`: The icon to display next to the role name.
 *   - `path`: The path to navigate to when the workflow card is clicked.
 *   - `restricted`: A boolean that indicates whether the workflow card is
 *     restricted.
 *
 * @returns A JSX element that renders the workflow menu.
 */
export function WorkflowMenu() {
  const { showWorkflowCards, toggleWorkflowCards } = useWorkflow();

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
      title: "Schedule Production Runs",
      description: "Edit and update production schedule",
      icon: <Calendar className="h-16 w-16" />,
      roleIcon: <ScanEye className="h-4 w-4" />,
      role: "manager" as WorkflowRole,
      path: "/scheduling",
      restricted: true,
    },
    {
      title: "Quality Control",
      description: "Manage and lock quality control processes",
      icon: <ListChecks className="h-16 w-16" />,
      roleIcon: <ScanEye className="h-4 w-4" />,
      role: "manager" as WorkflowRole,
      path: "/quality",
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
      title: "Transfer Drum Contents",
      description: "Manage drum content transfers",
      icon: <RefreshCcw className="h-16 w-16" />,
      roleIcon: <ScanEye className="h-4 w-4" />,
      role: "operator" as WorkflowRole,
      path: "/drums/transfer",
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
  ];

  return (
    <>
      {/* Overlay that dims the page when the workflow menu is open */}
      {showWorkflowCards && (
        <div
          className="fixed inset-0 bg-black/30 z-40 transition-opacity duration-300"
          onClick={toggleWorkflowCards}
          data-workflow-menu="true"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
    </>
  );
}
