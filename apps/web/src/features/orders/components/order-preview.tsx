"use client";

import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { fetchOrders } from "@/app/actions/orders";
import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/utils/format-date";

interface OrderPreviewProps {
  onCreateOrder: () => void;
}

/**
 * OrderPreview component for displaying a preview of recent purchase orders.
 *
 * This component fetches and displays a list of the most recent orders,
 * showing up to 10 orders sorted by their order date, with the most recent
 * orders appearing first. If orders are successfully loaded, they are
 * displayed in a table format with columns for PO Number, Supplier, Order Date,
 * Status, and ETA.
 *
 * The component manages loading and error states, displaying a loader while
 * fetching orders and an error message if the fetch fails. If no orders are
 * found, a message is displayed indicating that there are no recent orders.
 * The component also provides a button to create a new order.
 *
 * @param {OrderPreviewProps} props - The props for the component.
 * @param {Function} props.onCreateOrder - Callback function triggered when
 * the user decides to create a new order.
 */

export function OrderPreview({ onCreateOrder }: OrderPreviewProps) {
  // Use SWR to fetch orders with cache
  const { data, error, isLoading } = useSWR("orders", async () => {
    const ordersData = await fetchOrders();

    // Sort by order date, most recent first
    return [...ordersData]
      .sort((a, b) => {
        return (
          new Date(b.date_ordered).getTime() -
          new Date(a.date_ordered).getTime()
        );
      })
      .slice(0, 10); // Take only the most recent 10 orders
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-60">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">
          Loading recent orders...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-60">
        <p className="text-sm text-destructive mb-4">
          Failed to load recent orders. Please try again.
        </p>
        <Button onClick={onCreateOrder} variant="default">
          Create New Order
        </Button>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-60">
        <p className="text-sm text-muted-foreground mb-4">
          No recent orders found.
        </p>
        <Button onClick={onCreateOrder} variant="default">
          Create Your First Order
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO Number</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Material</TableHead>
              <TableHead>Order Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((order) => (
              <TableRow key={`${order.po_number}-${order.pol_id}`}>
                <TableCell className="font-medium text-slate-600">
                  {order.po_number}
                </TableCell>
                <TableCell>{order.supplier}</TableCell>
                <TableCell>{order.material}</TableCell>
                <TableCell>{formatDate(order.date_ordered)}</TableCell>
                <TableCell>
                  <span className={getStatusBadgeClass(order.status)}>
                    {order.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Helper function to determine badge class based on status
function getStatusBadgeClass(status: string): string {
  const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";

  switch (status) {
    case "pending":
      return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`;
    case "partially_received":
      return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`;
    case "complete":
      return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`;
    default:
      return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200`;
  }
}
