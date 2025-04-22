
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { ProductionOrder } from "@/pages/ProductionManagement";

interface OrderTasksListProps {
  order: ProductionOrder;
  onScan: (orderId: string, taskName: string) => void;
}

const OrderTasksList = ({ order, onScan }: OrderTasksListProps) => {
  return (
    <div className="space-y-3">
      {order.tasks.map((task, idx) => (
        <div key={idx} className="flex justify-between items-center p-3 border rounded-lg bg-white dark:bg-gray-800">
          <div className="flex items-center">
            {task.completed ? (
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            ) : (
              <div className="h-5 w-5 border-2 border-gray-300 rounded-full mr-2" />
            )}
            <span className={task.completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-gray-100'}>
              {task.name}
            </span>
          </div>
          {task.scanRequired && !task.completed && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onScan(order.id, task.name)}
            >
              Perform Scan
            </Button>
          )}
        </div>
      ))}
    </div>
  );
};

export default OrderTasksList;
