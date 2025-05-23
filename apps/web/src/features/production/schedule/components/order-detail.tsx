import { useState } from "react";
import { Edit, CheckCircle, AlertTriangle, Loader } from "lucide-react";
import { ProductionJobViewData, JobDisplayStatus } from "../../types/";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type OrderDetailProps = {
  order: ProductionJobViewData;
};

const getStatusText = (status: JobDisplayStatus): string => {
  switch (status) {
    case "drafted":
      return "Draft";
    case "scheduled":
      return "Scheduled";
    case "confirmed":
      return "Confirmed";
    case "in_progress":
      return "In Progress";
    case "paused":
      return "Paused";
    case "qc":
      return "QC In Progress";
    case "complete":
      return "Complete";
    case "error":
      return "Error";
    default:
      const _exhaustiveCheck: never = status;
      return "Unknown";
  }
};

const getStatusBadgeColorClass = (status: JobDisplayStatus): string => {
  switch (status) {
    case "drafted":
      return "bg-status-drafted";
    case "scheduled":
      return "bg-status-scheduled";
    case "confirmed":
      return "bg-status-confirmed";
    case "in_progress":
      return "bg-status-in_progress";
    case "paused":
      return "bg-status-paused";
    case "qc":
      return "bg-status-qc";
    case "complete":
      return "bg-status-complete";
    case "error":
      return "bg-status-error";
    default:
      const _exhaustiveCheck: never = status;
      return "bg-gray-400";
  }
};

export const OrderDetail = ({ order }: OrderDetailProps) => {
  const [editMode, setEditMode] = useState(false);
  const [editedOrder, setEditedOrder] = useState<ProductionJobViewData>(order);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "Invalid Date";
    }
  };

  const jobDisplayStatusOptions: { value: JobDisplayStatus; label: string }[] =
    [
      { value: "drafted", label: "Draft" },
      { value: "scheduled", label: "Scheduled" },
      { value: "confirmed", label: "Confirmed" },
      { value: "in_progress", label: "In Progress" },
      { value: "paused", label: "Paused" },
      { value: "qc", label: "QC In Progress" },
      { value: "complete", label: "Complete" },
      { value: "error", label: "Error" },
    ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            Order {order.jobName || order.id.slice(0, 8).toUpperCase()}
            <span
              className={cn(
                "ml-3 px-3 py-1 text-xs font-medium rounded-full text-white",
                getStatusBadgeColorClass(order.status)
              )}
            >
              {getStatusText(order.status)}
            </span>
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Last updated:{" "}
            {formatDate(
              (editedOrder as any).updated_at || new Date().toISOString()
            )}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks & Logs</TabsTrigger>
          <TabsTrigger value="drums">Drums Assigned</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="itemName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Item
                </label>
                {editMode ? (
                  <input
                    id="itemName"
                    type="text"
                    value={editedOrder.itemName}
                    onChange={(e) =>
                      setEditedOrder({
                        ...editedOrder,
                        itemName: e.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 
                      shadow-sm p-2 bg-white dark:bg-gray-800"
                  />
                ) : (
                  <p className="mt-1 text-gray-900 dark:text-white">
                    {order.itemName}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="supplier"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Supplier
                </label>
                {editMode ? (
                  <input
                    id="supplier"
                    type="text"
                    value={editedOrder.supplier}
                    onChange={(e) =>
                      setEditedOrder({
                        ...editedOrder,
                        supplier: e.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 
                      shadow-sm p-2 bg-white dark:bg-gray-800"
                  />
                ) : (
                  <p className="mt-1 text-gray-900 dark:text-white">
                    {order.supplier}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Quantity (Drums)
                </label>
                {editMode ? (
                  <input
                    title="Edit Quantity"
                    type="number"
                    value={editedOrder.quantity}
                    onChange={(e) =>
                      setEditedOrder({
                        ...editedOrder,
                        quantity: parseInt(e.target.value) || 0,
                      })
                    }
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 
                      shadow-sm p-2 bg-white dark:bg-gray-800"
                  />
                ) : (
                  <p className="mt-1 text-gray-900 dark:text-white">
                    {order.quantity}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Scheduled Date
                </label>
                {editMode ? (
                  <input
                    title="Edit Scheduled Date"
                    type="datetime-local"
                    value={
                      editedOrder.scheduledDate
                        ? format(
                            new Date(editedOrder.scheduledDate),
                            "yyyy-MM-dd'T'HH:mm"
                          )
                        : ""
                    }
                    onChange={(e) =>
                      setEditedOrder({
                        ...editedOrder,
                        scheduledDate: new Date(e.target.value).toISOString(),
                      })
                    }
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 
                      shadow-sm p-2 bg-white dark:bg-gray-800"
                  />
                ) : (
                  <p className="mt-1 text-gray-900 dark:text-white">
                    {formatDate(order.scheduledDate)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Priority
                </label>
                {editMode ? (
                  <select
                    title="Edit Priority"
                    value={editedOrder.priority}
                    onChange={(e) =>
                      setEditedOrder({
                        ...editedOrder,
                        priority: e.target.value as "low" | "medium" | "high",
                      })
                    }
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 
                      shadow-sm p-2 bg-white dark:bg-gray-800"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                ) : (
                  <p
                    className={cn(
                      `mt-1 capitalize`,
                      order.priority === "high" &&
                        "text-red-600 dark:text-red-400",
                      order.priority === "medium" &&
                        "text-amber-600 dark:text-amber-400",
                      order.priority === "low" &&
                        "text-green-600 dark:text-green-400"
                    )}
                  >
                    {order.priority}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>
                {editMode ? (
                  <select
                    title="Edit Status"
                    value={editedOrder.status}
                    onChange={(e) =>
                      setEditedOrder({
                        ...editedOrder,
                        status: e.target.value as JobDisplayStatus,
                      })
                    }
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 
                      shadow-sm p-2 bg-white dark:bg-gray-800"
                  >
                    {jobDisplayStatusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="mt-1 flex items-center">
                    {order.status === "complete" && (
                      <CheckCircle
                        size={16}
                        className="text-status-complete mr-1"
                      />
                    )}
                    {order.status === "error" && (
                      <AlertTriangle
                        size={16}
                        className="text-status-error mr-1"
                      />
                    )}
                    {(order.status === "in_progress" ||
                      order.status === "scheduled" ||
                      order.status === "confirmed" ||
                      order.status === "drafted" ||
                      order.status === "paused" ||
                      order.status === "qc") && (
                      <Loader
                        size={16}
                        className={cn(
                          "mr-1 animate-spin",
                          order.status === "in_progress" &&
                            "text-status-in_progress",
                          order.status === "qc" && "text-status-qc",
                          order.status === "paused" && "text-status-paused",
                          (order.status === "scheduled" ||
                            order.status === "confirmed" ||
                            order.status === "drafted") &&
                            "text-status-scheduled"
                        )}
                      />
                    )}
                    <span className="capitalize">
                      {getStatusText(order.status)}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tasks & Logs Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Production Tasks
          </h3>

          <div className="space-y-3">
            {order.tasks?.map((task, index) => (
              <div
                key={task.op_id || index}
                className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-center">
                  <input
                    title={`Task ${task.name} completed status`}
                    type="checkbox"
                    checked={task.completed}
                    className="h-4 w-4 text-brand-blue border-gray-300 rounded focus:ring-brand-blue"
                    readOnly
                  />
                  <span
                    className={cn(
                      "ml-3",
                      task.completed
                        ? "line-through text-gray-500"
                        : "text-gray-900 dark:text-white"
                    )}
                  >
                    {task.name}
                    {task.op_type && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({task.op_type})
                      </span>
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground mr-2">
                    {task.status}
                  </span>
                </div>
              </div>
            ))}

            {(!order.tasks || order.tasks.length === 0) && (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                No tasks assigned to this order yet.
              </div>
            )}
          </div>
        </TabsContent>

        {/* Drums Assigned Tab */}
        <TabsContent value="drums" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Assigned Drums
            </h3>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Serial
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Volume
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Location
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {order.drums?.map((drum) => (
                  <tr key={drum.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {drum.serial}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {drum.volume} L
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {drum.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button className="text-brand-blue hover:text-blue-800 dark:hover:text-blue-400 mr-4">
                        Reassign
                      </button>
                      <button className="text-brand-red hover:text-red-800">
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {(!order.drums || order.drums.length === 0) && (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                No drums assigned to this order yet.
              </div>
            )}
          </div>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Order Timeline
          </h3>

          <div className="space-y-6">
            {order.timeline?.map((event, index) => (
              <div key={index} className="flex">
                <div className="flex flex-col items-center mr-4">
                  <div className="w-3 h-3 bg-brand-blue rounded-full"></div>
                  {index < (order.timeline?.length || 1) - 1 && (
                    <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 my-1"></div>
                  )}
                </div>
                <div className="flex flex-col flex-grow pb-6">
                  <div className="flex items-center">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {event.event}
                    </h4>
                    {event.user && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">
                        {event.user}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(event.timestamp)}
                  </span>
                </div>
              </div>
            ))}

            {(!order.timeline || order.timeline.length === 0) && (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                No events recorded for this order yet.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
