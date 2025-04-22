import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { getStatusIcon, getStatusBadgeVariant } from "./utils";
import { ProductionOrder } from "@/pages/ProductionManagement";

interface OrderCardHeaderProps {
  order: ProductionOrder;
  expanded: boolean;
  onToggleExpand: () => void;
}

/**
 * A component for displaying a summary of an order and providing controls to expand or collapse the component.
 *
 * @param {{ order: ProductionOrder, expanded: boolean, onToggleExpand: () => void }} props
 * @returns {JSX.Element} The rendered component
 */
const OrderCardHeader = ({
  order,
  expanded,
  onToggleExpand,
}: OrderCardHeaderProps) => {
  return (
    <div className="flex justify-between items-start mb-3">
      <div>
        <div className="flex items-center">
          <h3 className="font-bold text-industrial-darkGray dark:text-gray-100">
            {order.id}
          </h3>
          <Badge
            variant={getStatusBadgeVariant(order.status)}
            className="ml-2 flex items-center space-x-1"
          >
            {getStatusIcon(order.status)}
            <span>{order.status}</span>
          </Badge>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          <span className="material-link">{order.itemName}</span>
          {" • "}
          {order.supplier}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium">{order.quantity} drums</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {order.scheduledDate.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onToggleExpand}
        className="flex items-center"
      >
        {expanded ? (
          <>
            View Less <ChevronUp className="ml-1 h-4 w-4" />
          </>
        ) : (
          <>
            View & Update <ChevronDown className="ml-1 h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );
};

export default OrderCardHeader;
