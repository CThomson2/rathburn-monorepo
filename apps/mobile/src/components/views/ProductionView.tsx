import { useState } from "react";
import { Atom, Copy, Clipboard, Timer, UserCircle } from "lucide-react";

interface ProductionTask {
  id: number;
  name: string;
  recipe: string;
  status: "pending" | "in-progress" | "completed";
  assigned: string;
  timeEstimate: string;
  priority: "low" | "medium" | "high";
}

/**
 * Production view component
 * Shows active production tasks and schedules
 */
export function ProductionView() {
  const [productionTasks, setProductionTasks] = useState<ProductionTask[]>([
    {
      id: 1,
      name: "Cedarwood Batch #442",
      recipe: "Standard Distillation",
      status: "in-progress",
      assigned: "James Doherty",
      timeEstimate: "4.5 hours",
      priority: "high",
    },
    {
      id: 2,
      name: "Lavender Batch #288",
      recipe: "Fractional Distillation",
      status: "pending",
      assigned: "Alistair Nottman",
      timeEstimate: "6 hours",
      priority: "medium",
    },
    {
      id: 3,
      name: "Peppermint Batch #106",
      recipe: "Standard Distillation",
      status: "completed",
      assigned: "Maria Williams",
      timeEstimate: "3 hours",
      priority: "low",
    },
  ]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400";
      case "medium":
        return "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400";
      case "low":
        return "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in-progress":
        return "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400";
      case "completed":
        return "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400";
      case "pending":
        return "bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300";
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center px-6 py-4">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
          Production Tasks
        </h2>
        <button className="text-blue-600 dark:text-blue-400 font-medium">
          New Task
        </button>
      </div>

      <div className="px-4 space-y-4">
        {productionTasks.map((task) => (
          <div
            key={task.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold text-gray-800 dark:text-gray-100">
                  {task.name}
                </h3>
                <div className="flex items-center mt-1">
                  <Atom
                    size={14}
                    className="text-gray-500 dark:text-gray-400 mr-1"
                  />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {task.recipe}
                  </p>
                </div>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                  task.status
                )}`}
              >
                {task.status.charAt(0).toUpperCase() +
                  task.status.slice(1).replace("-", " ")}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="flex items-center">
                <UserCircle
                  size={16}
                  className="text-gray-500 dark:text-gray-400 mr-2"
                />
                <span className="text-sm">{task.assigned}</span>
              </div>
              <div className="flex items-center">
                <Timer
                  size={16}
                  className="text-gray-500 dark:text-gray-400 mr-2"
                />
                <span className="text-sm">{task.timeEstimate}</span>
              </div>
            </div>

            <div className="flex mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
              <div
                className={`text-xs px-2 py-1 rounded-md ${getPriorityColor(
                  task.priority
                )}`}
              >
                {task.priority.toUpperCase()} PRIORITY
              </div>
              <div className="ml-auto flex gap-2">
                <button
                  className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  aria-label="Duplicate task"
                >
                  <Copy size={16} />
                  <span className="sr-only">Duplicate task</span>
                </button>
                <button
                  className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  aria-label="View task details"
                >
                  <Clipboard size={16} />
                  <span className="sr-only">View task details</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="px-6 py-6">
        <h3 className="text-md font-semibold text-gray-800 dark:text-gray-100 mb-2">
          Production Schedule
        </h3>
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            Production schedule calendar will be available soon
          </p>
        </div>
      </div>
    </div>
  );
}
