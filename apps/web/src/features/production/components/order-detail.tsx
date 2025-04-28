import { useState } from "react";
import { Edit, CheckCircle, AlertTriangle, Loader } from "lucide-react";
import { Order, OrderStatus } from "../types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type OrderDetailProps = {
  order: Order;
};

export const OrderDetail = ({ order }: OrderDetailProps) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [editMode, setEditMode] = useState(false);
  const [editedOrder, setEditedOrder] = useState<Order>(order);

  const handleSaveChanges = () => {
    // Here you would send the updated order to the API
    // For now, we'll just toggle edit mode off
    setEditMode(false);
    // Simulate API call success
    // toast({ title: "Changes saved successfully" });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            Order {order.id}
            <span
              className={`ml-3 px-3 py-1 text-xs font-medium rounded-full text-white
              ${order.status === "preparing" ? "bg-status-preparing" : ""}
              ${order.status === "distillation" ? "bg-status-distillation" : ""}
              ${order.status === "qc" ? "bg-status-qc" : ""}
              ${order.status === "complete" ? "bg-status-complete" : ""}
              ${order.status === "error" ? "bg-status-error" : ""}
            `}
            >
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {formatDate(new Date().toISOString())}
          </p>
        </div>
        <button
          onClick={() => setEditMode(!editMode)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <Edit size={18} />
        </button>
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
                    type="number"
                    value={editedOrder.quantity}
                    onChange={(e) =>
                      setEditedOrder({
                        ...editedOrder,
                        quantity: parseInt(e.target.value),
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
                    type="datetime-local"
                    value={new Date(editedOrder.scheduledDate)
                      .toISOString()
                      .slice(0, 16)}
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
                    className={`mt-1 capitalize
                    ${order.priority === "high" ? "text-red-600 dark:text-red-400" : ""}
                    ${order.priority === "medium" ? "text-amber-600 dark:text-amber-400" : ""}
                    ${order.priority === "low" ? "text-green-600 dark:text-green-400" : ""}
                  `}
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
                    value={editedOrder.status}
                    onChange={(e) =>
                      setEditedOrder({
                        ...editedOrder,
                        status: e.target.value as OrderStatus,
                      })
                    }
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 
                      shadow-sm p-2 bg-white dark:bg-gray-800"
                  >
                    <option value="preparing">Preparing</option>
                    <option value="distillation">Distillation</option>
                    <option value="qc">QC</option>
                    <option value="complete">Complete</option>
                    <option value="error">Error</option>
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
                    {order.status !== "complete" &&
                      order.status !== "error" && (
                        <Loader
                          size={16}
                          className="text-status-preparing mr-1 animate-spin"
                        />
                      )}
                    <span className="capitalize">{order.status}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {editMode && (
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setEditMode(false)}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChanges}
                className="px-4 py-2 text-sm bg-brand-blue text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Save Changes
              </button>
            </div>
          )}
        </TabsContent>

        {/* Tasks & Logs Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Production Tasks
          </h3>

          <div className="space-y-3">
            {order.tasks?.map((task, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    className="h-4 w-4 text-brand-blue border-gray-300 rounded"
                    readOnly
                  />
                  <span
                    className={`ml-3 ${task.completed ? "line-through text-gray-500" : "text-gray-900 dark:text-white"}`}
                  >
                    {task.name}
                  </span>
                </div>

                <button className="px-3 py-1 text-xs bg-brand-blue text-white rounded hover:bg-blue-600 transition-colors">
                  Perform Scan
                </button>
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
            <button className="px-3 py-1.5 text-sm bg-brand-blue text-white rounded hover:bg-blue-600 transition-colors">
              Assign New Drum
            </button>
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
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Actions
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
