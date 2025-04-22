import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ProductionOrder } from "@/pages/ProductionManagement";
import ProgressStepper from "@/components/ProgressStepper";
import { toast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";
import OrderCardHeader from "./OrderCard/OrderCardHeader";
import OrderCardExpanded from "./OrderCard/OrderCardExpanded";

interface OrderCardProps {
  order: ProductionOrder;
  onUpdate: (updatedOrder: ProductionOrder) => void;
  onScan: (orderId: string, taskName: string) => void;
}

const formatDate = (date: Date): string => {
  return date.toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "Preparing":
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case "In-distillation":
      return <Loader className="h-4 w-4 text-blue-500 animate-spin" />;
    case "QC Pending":
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    case "Complete":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    default:
      return <Package className="h-4 w-4" />;
  }
};

const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "Preparing":
      return "outline";
    case "In-distillation":
      return "secondary";
    case "QC Pending":
      return "destructive";
    case "Complete":
      return "default";
    default:
      return "outline";
  }
};

const OrderCard = ({ order, onUpdate, onScan }: OrderCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editedOrder, setEditedOrder] = useState<ProductionOrder>({ ...order });

  const handleToggleExpand = () => setExpanded((v) => !v);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300">
      <div className="p-4">
        <OrderCardHeader
          order={order}
          expanded={expanded}
          onToggleExpand={handleToggleExpand}
        />
        <div className="mb-3">
          <ProgressStepper 
            steps={["Preparing", "In-distillation", "QC Pending", "Complete"]}
            currentStep={["Preparing", "In-distillation", "QC Pending", "Complete"].indexOf(order.status)}
          />
        </div>
        <Badge
          variant="outline"
          className={`
            ${order.priority === 'High' ? 'border-red-500 text-red-500' : 
              order.priority === 'Medium' ? 'border-yellow-500 text-yellow-500' : 
              'border-green-500 text-green-500'}
          `}
        >
          {order.priority} Priority
        </Badge>
      </div>
      {expanded && (
        <OrderCardExpanded
          order={order}
          editing={editing}
          editedOrder={editedOrder}
          setEditing={setEditing}
          setEditedOrder={setEditedOrder}
          onUpdate={onUpdate}
          onScan={onScan}
        />
      )}
    </div>
  );
};

export default OrderCard;
