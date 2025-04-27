"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { fetchOrders } from "@/app/actions/orders";
import { OrdersView } from "@/features/orders/types";
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

export default function OrderPreview({ onCreateOrder }: OrderPreviewProps) {
  const [orders, setOrders] = useState<OrdersView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        const data = await fetchOrders();

        // Sort by order date, most recent first
        const sortedOrders = [...data].sort((a, b) => {
          return (
            new Date(b.order_date).getTime() - new Date(a.order_date).getTime()
          );
        });

        // Take only the most recent 10 orders
        setOrders(sortedOrders.slice(0, 10));
      } catch (err) {
        console.error("Failed to fetch orders:", err);
        setError("Failed to load recent orders. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  if (loading) {
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
        <p className="text-sm text-destructive mb-4">{error}</p>
        <Button onClick={onCreateOrder} variant="default">
          Create New Order
        </Button>
      </div>
    );
  }

  if (orders.length === 0) {
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
              <TableHead>Order Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>ETA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.po_number}>
                <TableCell className="font-medium">{order.po_number}</TableCell>
                <TableCell>{order.supplier}</TableCell>
                <TableCell>{formatDate(order.order_date)}</TableCell>
                <TableCell>
                  <span className={getStatusBadgeClass(order.status)}>
                    {order.status}
                  </span>
                </TableCell>
                <TableCell>{order.eta || "N/A"}</TableCell>
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
