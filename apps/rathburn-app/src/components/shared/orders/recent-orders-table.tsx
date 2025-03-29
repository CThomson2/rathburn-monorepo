"use client";

import { format } from "date-fns";
import { CalendarIcon, PackageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Order } from "@/types/models";

interface RecentOrdersTableProps {
  orders: Order[];
  showHeaders?: boolean;
  className?: string;
  emptyMessage?: string;
}

/**
 * Reusable component for displaying a table of recent orders
 * Can be used in multiple contexts with different styling
 */
export function RecentOrdersTable({
  orders,
  showHeaders = true,
  className,
  emptyMessage = "No orders found",
}: RecentOrdersTableProps) {
  if (!orders || orders.length === 0) {
    return (
      <div className="py-6 text-center text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-sm">
        {showHeaders && (
          <thead>
            <tr className="border-b">
              <th className="py-3 text-left font-medium">Supplier</th>
              <th className="py-3 text-left font-medium">Material</th>
              <th className="py-3 text-left font-medium">Quantity</th>
              <th className="py-3 text-left font-medium">Date</th>
              <th className="py-3 text-left font-medium">Status</th>
              <th className="py-3 text-left font-medium">PO Number</th>
            </tr>
          </thead>
        )}
        <tbody>
          {orders.map((order) => (
            <tr key={order.order_id} className="border-b hover:bg-muted/50">
              <td className="py-3">{order.supplier}</td>
              <td className="py-3">{order.material}</td>
              <td className="py-3">
                <div className="flex items-center gap-1">
                  <PackageIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{order.quantity}</span>
                </div>
              </td>
              <td className="py-3">
                <div className="flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {format(new Date(order.date_ordered), "dd MMM yyyy")}
                  </span>
                </div>
              </td>
              <td className="py-3">
                <OrderStatusBadge status={order.status} />
              </td>
              <td className="py-3">{order.po_number || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Badge component for displaying order status with appropriate styling
 */
export function OrderStatusBadge({ status }: { status: string }) {
  switch (status.toLowerCase()) {
    case "pending":
      return (
        <Badge
          variant="outline"
          className="bg-yellow-50 text-yellow-700 border-yellow-200"
        >
          Pending
        </Badge>
      );
    case "delivered":
    case "completed":
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200"
        >
          Delivered
        </Badge>
      );
    case "cancelled":
      return (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-200"
        >
          Cancelled
        </Badge>
      );
    case "partial":
      return (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-200"
        >
          Partial
        </Badge>
      );
    default:
      return (
        <Badge
          variant="outline"
          className="bg-gray-50 text-gray-700 border-gray-200"
        >
          {status}
        </Badge>
      );
  }
}
