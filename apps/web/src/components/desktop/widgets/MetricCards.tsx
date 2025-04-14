import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  PackageCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardsProps {
  totalValue: number;
  belowSafetyStock: number;
  pendingOrders: number;
  stockAccuracy: number;
}

const MetricCards = ({
  totalValue,
  belowSafetyStock,
  pendingOrders,
  stockAccuracy,
}: MetricCardsProps) => {
  // Format the total value with commas and currency symbol
  const formattedValue = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(totalValue);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Inventory Value */}
      <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Total Inventory Value
            </p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              {formattedValue}
            </h3>
          </div>
          <div className="p-2 bg-green-100 rounded-md">
            <TrendingUp className="text-green-600 h-5 w-5" />
          </div>
        </div>
        <div className="flex items-center mt-4">
          <div className="text-sm text-green-600 flex items-center">
            <TrendingUp className="h-3 w-3 mr-1" />
            <span>5.2% increase</span>
          </div>
          <span className="text-gray-500 text-sm ml-2">from last month</span>
        </div>
      </div>

      {/* Items Below Safety Stock */}
      <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Below Safety Stock
            </p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              {belowSafetyStock} items
            </h3>
          </div>
          <div
            className={cn(
              "p-2 rounded-md",
              belowSafetyStock > 10 ? "bg-red-100" : "bg-yellow-100"
            )}
          >
            <AlertTriangle
              className={cn(
                "h-5 w-5",
                belowSafetyStock > 10 ? "text-red-600" : "text-yellow-600"
              )}
            />
          </div>
        </div>
        <div className="flex items-center mt-4">
          <div
            className={cn(
              "text-sm flex items-center",
              belowSafetyStock > 10 ? "text-red-600" : "text-yellow-600"
            )}
          >
            <AlertTriangle className="h-3 w-3 mr-1" />
            <span>{belowSafetyStock > 10 ? "Critical" : "Warning"}</span>
          </div>
          <span className="text-gray-500 text-sm ml-2">requires attention</span>
        </div>
      </div>

      {/* Pending Orders */}
      <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500">Pending Orders</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              {pendingOrders} orders
            </h3>
          </div>
          <div className="p-2 bg-blue-100 rounded-md">
            <PackageCheck className="text-blue-600 h-5 w-5" />
          </div>
        </div>
        <div className="flex items-center mt-4">
          <div className="text-sm text-blue-600 flex items-center">
            <CheckCircle className="h-3 w-3 mr-1" />
            <span>All on schedule</span>
          </div>
          <span className="text-gray-500 text-sm ml-2">no delays</span>
        </div>
      </div>

      {/* Stock Accuracy */}
      <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500">Stock Accuracy</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              {stockAccuracy}%
            </h3>
          </div>
          <div
            className={cn(
              "p-2 rounded-md",
              stockAccuracy >= 95
                ? "bg-green-100"
                : stockAccuracy >= 90
                  ? "bg-yellow-100"
                  : "bg-red-100"
            )}
          >
            <CheckCircle
              className={cn(
                "h-5 w-5",
                stockAccuracy >= 95
                  ? "text-green-600"
                  : stockAccuracy >= 90
                    ? "text-yellow-600"
                    : "text-red-600"
              )}
            />
          </div>
        </div>
        <div className="flex items-center mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={cn(
                "h-2.5 rounded-full",
                stockAccuracy >= 95
                  ? "bg-green-600"
                  : stockAccuracy >= 90
                    ? "bg-yellow-500"
                    : "bg-red-600"
              )}
              style={{ width: `${stockAccuracy}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricCards;
