"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CalendarIcon, PackageIcon, TruckIcon, FilterIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { OrdersOverviewWidgetProps } from "@/database/models/types/orders";

// Configuration
const TABLE_PAGE_SIZE = 7; // Number of orders to show per page
const DEFAULT_SORT = "date_desc"; // Default sort order

export function RecentOrdersWidget({ orders }: OrdersOverviewWidgetProps) {
  const [timeFilter, setTimeFilter] = useState<"all" | "1y" | "6m" | "3m">(
    "1y"
  );
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<string>(DEFAULT_SORT);
  const [page, setPage] = useState<number>(1);

  // Filter orders based on selected time range
  const filteredOrders = orders.filter((order) => {
    // Apply time filter
    if (timeFilter !== "all") {
      const orderDate = new Date(order.date_ordered);
      const now = new Date();
      const monthsAgo = (months: number) => {
        const date = new Date(now);
        date.setMonth(date.getMonth() - months);
        return date;
      };

      switch (timeFilter) {
        case "1y":
          if (orderDate < monthsAgo(12)) return false;
          break;
        case "6m":
          if (orderDate < monthsAgo(6)) return false;
          break;
        case "3m":
          if (orderDate < monthsAgo(3)) return false;
          break;
      }
    }

    // Apply status filter if selected
    if (
      statusFilter &&
      order.status.toLowerCase() !== statusFilter.toLowerCase()
    ) {
      return false;
    }

    return true;
  });

  // Sort orders based on selected sort order
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    switch (sortOrder) {
      case "date_desc":
        return (
          new Date(b.date_ordered).getTime() -
          new Date(a.date_ordered).getTime()
        );
      case "date_asc":
        return (
          new Date(a.date_ordered).getTime() -
          new Date(b.date_ordered).getTime()
        );
      case "quantity_desc":
        return b.quantity - a.quantity;
      case "quantity_asc":
        return a.quantity - b.quantity;
      default:
        return (
          new Date(b.date_ordered).getTime() -
          new Date(a.date_ordered).getTime()
        );
    }
  });

  // Paginate the results
  const startIndex = (page - 1) * TABLE_PAGE_SIZE;
  const endIndex = startIndex + TABLE_PAGE_SIZE;
  const displayedOrders = sortedOrders.slice(startIndex, endIndex);
  const totalPages = Math.ceil(sortedOrders.length / TABLE_PAGE_SIZE);

  // Get unique statuses for filter dropdown
  const uniqueStatuses = [
    ...new Set(orders.map((order) => order.status.toLowerCase())),
  ];

  // Handle status filter change
  const handleStatusFilterChange = (status: string | null) => {
    setStatusFilter(status);
    setPage(1); // Reset to first page when changing filters
  };

  // Handle time filter change
  const handleTimeFilterChange = (time: "all" | "1y" | "6m" | "3m") => {
    setTimeFilter(time);
    setPage(1); // Reset to first page when changing filters
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 space-y-2 sm:space-y-0">
        <div>
          <CardTitle className="text-base">Order History</CardTitle>
          <CardDescription>
            Showing {filteredOrders.length} of {orders.length} orders
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-4">
          <div className="inline-flex h-8 items-center rounded-md border border-input bg-background shadow-sm">
            <Button
              variant={timeFilter === "all" ? "default" : "ghost"}
              onClick={() => handleTimeFilterChange("all")}
              className="text-xs h-7 rounded-r-none px-2"
              size="sm"
            >
              All Time
            </Button>
            <Button
              variant={timeFilter === "1y" ? "default" : "ghost"}
              onClick={() => handleTimeFilterChange("1y")}
              className="text-xs h-7 rounded-none border-l px-2"
              size="sm"
            >
              1 Year
            </Button>
            <Button
              variant={timeFilter === "6m" ? "default" : "ghost"}
              onClick={() => handleTimeFilterChange("6m")}
              className="text-xs h-7 rounded-none border-l px-2"
              size="sm"
            >
              6 Months
            </Button>
            <Button
              variant={timeFilter === "3m" ? "default" : "ghost"}
              onClick={() => handleTimeFilterChange("3m")}
              className="text-xs h-7 rounded-l-none border-l px-2"
              size="sm"
            >
              3 Months
            </Button>
          </div>

          <Link
            href="/inventory/orders"
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center"
          >
            View all
          </Link>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-6 pb-2 sm:pb-6">
        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                    >
                      Supplier
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Material
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
                      onClick={() =>
                        setSortOrder(
                          sortOrder === "quantity_desc"
                            ? "quantity_asc"
                            : "quantity_desc"
                        )
                      }
                    >
                      <div className="flex items-center gap-1">
                        Quantity
                        {sortOrder.startsWith("quantity_") && (
                          <span>
                            {sortOrder === "quantity_desc" ? "↓" : "↑"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
                      onClick={() =>
                        setSortOrder(
                          sortOrder === "date_desc" ? "date_asc" : "date_desc"
                        )
                      }
                    >
                      <div className="flex items-center gap-1">
                        Order Date
                        {sortOrder.startsWith("date_") && (
                          <span>{sortOrder === "date_desc" ? "↓" : "↑"}</span>
                        )}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      <div className="flex items-center gap-1">
                        Status
                        <div className="relative inline-block">
                          <FilterIcon
                            className="h-4 w-4 text-gray-400 hover:text-gray-700 cursor-pointer"
                            onClick={(e) => {
                              const dropdown = document.getElementById(
                                "status-filter-dropdown"
                              );
                              dropdown?.classList.toggle("hidden");
                              e.stopPropagation();
                            }}
                          />
                          <div
                            id="status-filter-dropdown"
                            className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none hidden"
                          >
                            <div
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                              onClick={() => handleStatusFilterChange(null)}
                            >
                              All Statuses
                            </div>
                            {uniqueStatuses.map((status) => (
                              <div
                                key={status}
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                                onClick={() => handleStatusFilterChange(status)}
                              >
                                {status.charAt(0).toUpperCase() +
                                  status.slice(1)}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      PO Number
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {displayedOrders.length > 0 ? (
                    displayedOrders.map((order) => (
                      <tr key={order.order_id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          <Link
                            href={`/inventory/suppliers/${order.supplier
                              .toLowerCase()
                              .replace(/\s/g, "-")}`}
                            className="hover:text-blue-600 hover:underline"
                          >
                            {order.supplier}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {order.material}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <PackageIcon className="h-4 w-4 text-gray-400" />
                            <span>{order.quantity}</span>
                            <span className="text-xs text-gray-400 ml-1">
                              (
                              {Math.round(
                                (order.quantity_received / order.quantity) * 100
                              )}
                              % received)
                            </span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4 text-gray-400" />
                            <span>
                              {format(
                                new Date(order.date_ordered),
                                "dd MMM yyyy"
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {order.po_number || "-"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-8 text-center text-gray-500"
                      >
                        No orders found matching the current filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 mt-4">
            <div className="flex flex-1 justify-between sm:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page > 1 ? page - 1 : 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPage(page < totalPages ? page + 1 : totalPages)
                }
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(endIndex, sortedOrders.length)}
                  </span>{" "}
                  of <span className="font-medium">{sortedOrders.length}</span>{" "}
                  results
                </p>
              </div>
              <div>
                <nav
                  className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                  aria-label="Pagination"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-l-md"
                    onClick={() => setPage(page > 1 ? page - 1 : 1)}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>

                  {/* Page numbers - show just a few pages with ellipsis */}
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNum = i + 1;

                    // Always show first, last, and pages around current
                    const showPageNumber =
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= page - 1 && pageNum <= page + 1);

                    if (!showPageNumber) {
                      // Show ellipsis between ranges
                      if (pageNum === 2 || pageNum === totalPages - 1) {
                        return (
                          <span
                            key={`ellipsis-${pageNum}`}
                            className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0"
                          >
                            ...
                          </span>
                        );
                      }
                      return null;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                        className="relative inline-flex items-center"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}

                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-r-md"
                    onClick={() =>
                      setPage(page < totalPages ? page + 1 : totalPages)
                    }
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
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
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
  }
}
