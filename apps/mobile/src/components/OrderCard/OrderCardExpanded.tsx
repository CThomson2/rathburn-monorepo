
import { Button } from "@/components/ui/button";
import { Edit2 } from "lucide-react";
import OrderCardTabs from "./OrderCardTabs";
import { ProductionOrder } from "@/pages/ProductionManagement";
import { toast } from "@/components/ui/use-toast";

interface OrderCardExpandedProps {
  order: ProductionOrder;
  editing: boolean;
  editedOrder: ProductionOrder;
  setEditing: (v: boolean) => void;
  setEditedOrder: (order: ProductionOrder) => void;
  onUpdate: (order: ProductionOrder) => void;
  onScan: (orderId: string, taskName: string) => void;
}

const OrderCardExpanded = ({
  order,
  editing,
  editedOrder,
  setEditing,
  setEditedOrder,
  onUpdate,
  onScan,
}: OrderCardExpandedProps) => {
  return (
    <div className="border-t border-gray-200 dark:border-gray-700 animate-accordion-down">
      <div className="p-4 bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
        <h3 className="text-lg font-bold text-industrial-darkGray dark:text-gray-100">{order.id}</h3>
        {editing ? (
          <div className="space-x-2">
            <Button size="sm" variant="outline" onClick={() => { setEditedOrder({ ...order }); setEditing(false); }}>Cancel</Button>
            <Button size="sm" onClick={() => { onUpdate(editedOrder); setEditing(false); toast({ title: "Order Updated", description: `Order ${editedOrder.id} updated.` }); }}>Save Changes</Button>
          </div>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
            <Edit2 className="h-4 w-4 mr-1" /> Edit
          </Button>
        )}
      </div>
      <OrderCardTabs
        order={order}
        editing={editing}
        editedOrder={editedOrder}
        setEditedOrder={setEditedOrder}
        onScan={onScan}
      />
    </div>
  );
};

export default OrderCardExpanded;
