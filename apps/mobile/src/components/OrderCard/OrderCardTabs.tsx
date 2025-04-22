
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrderTasksList from "./OrderTasksList";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ProductionOrder } from "@/pages/ProductionManagement";

interface OrderCardTabsProps {
  order: ProductionOrder;
  editing: boolean;
  editedOrder: ProductionOrder;
  setEditedOrder: (order: ProductionOrder) => void;
  onScan: (orderId: string, taskName: string) => void;
}

const OrderCardTabs = ({
  order,
  editing,
  editedOrder,
  setEditedOrder,
  onScan,
}: OrderCardTabsProps) => {
  // Helper
  const formatDate = (date: Date) =>
    date.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <Tabs defaultValue="overview" className="p-4">
      <TabsList className="grid grid-cols-3 mb-4">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="tasks">Tasks & Logs</TabsTrigger>
        <TabsTrigger value="drums">Drums Assigned</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* ... Overview fields, editable if editing ... */}
          {/* For brevity, only showing Item Name: */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Item Name</label>
            {editing ? (
              <input 
                type="text"
                className="mt-1 block w-full border rounded-md px-3 py-2 text-sm"
                value={editedOrder.itemName}
                onChange={e => setEditedOrder({ ...editedOrder, itemName: e.target.value })}
              />
            ) : (
              <p className="mt-1 text-gray-900 dark:text-gray-100">{order.itemName}</p>
            )}
          </div>
          {/* ... replicate for all other fields in original code ... */}
        </div>
      </TabsContent>

      <TabsContent value="tasks" className="space-y-4">
        <OrderTasksList order={order} onScan={onScan} />
      </TabsContent>

      <TabsContent value="drums" className="space-y-4">
        <div className="overflow-hidden border rounded-lg">
          <table className="min-w-full divide-y">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Serial</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Volume (L)</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Location</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {order.drums.map((drum, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{drum.serial}</td>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{drum.volume}</td>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{drum.location}</td>
                  <td className="px-4 py-2 text-sm">
                    <div className="flex space-x-2">
                      <button className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">Reassign</button>
                      <button className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button size="sm" variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-1" /> Assign New Drum
        </Button>
      </TabsContent>
    </Tabs>
  );
};

export default OrderCardTabs;
