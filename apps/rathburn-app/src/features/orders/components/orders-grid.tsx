"use client";

import { useState, useEffect, memo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SortingState } from "@tanstack/react-table";
import { SearchBar } from "@/components/obselete/table";
import { GridModal, BentoGrid } from "./grid";
import type { Order, OrdersResponse } from "@/types/models";
import { fetchOrders } from "@/features/orders/api/fetch-orders";
import Link from "next/link";

const filterOptions = [
  { label: "All", value: "all" },
  { label: "By Material", value: "material" },
  { label: "By Supplier", value: "supplier" },
  { label: "By Status", value: "status" },
];

interface OrdersGridProps {
  initialData?: OrdersResponse;
}

export const OrdersGrid = ({ initialData }: OrdersGridProps) => {
  // State for table sorting - currently unused but could be used for client-side sorting
  const [sorting, setSorting] = useState<SortingState>([
    { id: "order_id", desc: true },
  ]);

  // State for row selection - currently unused but could enable multi-select functionality
  const [rowSelection, setRowSelection] = useState({});

  // States for filtering - currently only used by SearchBar component
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  // Pagination states - actively used by useQuery to fetch paginated data
  // These values are included in the queryKey array, so when they change,
  // useQuery will automatically refetch with the new pagination parameters
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(initialData?.orders.length || 30);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const queryClient = useQueryClient();

  /**
   * TanStack Query Hook
   *
   * useQuery is a hook that manages server state including:
   * - Fetching data
   * - Caching results
   * - Refetching when needed
   * - Loading/error states
   *
   * Key Props:
   * @queryKey Unique identifier for this query, used for caching/refetching
   *   Including pageIndex/pageSize means query will refetch when these change
   *
   * @queryFn Async function that fetches the data
   *   Uses pagination params from state to fetch correct page
   *
   * @staleTime How long data is considered fresh (30 seconds)
   *   After this time, data may be refetched if component remounts
   *
   * @initialData Data to use initially before the first fetch completes
   *   This comes from server-side rendering for better UX
   * 
   * Returns:
   * @data The fetched data
   * @isLoading Loading state
   * @error Any error that occurred
   * @refetch Function to manually trigger a refetch

   */
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["orders", pageIndex, pageSize],
    queryFn: async () => {
      try {
        console.log(
          `[Client] Fetching orders with page=${
            pageIndex + 1
          }, limit=${pageSize}`
        );
        const response = await fetchOrders(pageIndex + 1, pageSize);
        console.log(
          `[Client] Successfully fetched ${response.orders.length} orders`
        );
        return {
          rows: response.orders,
          total: response.total,
        };
      } catch (err) {
        console.error("[Client] Error fetching orders:", err);
        throw err;
      }
    },
    staleTime: 30000,
    // Use the server-provided initial data if available
    initialData: initialData
      ? {
          rows: initialData.orders,
          total: initialData.total,
        }
      : undefined,
  });

  /**
   * Server-Sent Events (SSE) Setup for Real-time Order Updates
   *
   * Purpose: Establishes real-time connection to server for order quantity updates
   * when drums are scanned.
   *
   * Dependencies:
   * - queryClient: For invalidating and updating cached data
   * - pageIndex/pageSize: Used in query key for updating specific data
   *
   * Flow:
   * 1. Creates EventSource connection
   * 2. Sets up event listeners for:
   *    - connected: Logs successful connection
   *    - orderUpdate: Updates cached data when a drum is scanned
   *    - error: Handles connection errors and implements reconnection
   * 3. Cleans up connection on unmount
   */
  useEffect(() => {
    let eventSource: EventSource;
    let retryCount = 0;
    const maxRetries = 3;
    const connectionId = Math.random().toString(36).slice(2, 8);

    function setupEventSource() {
      console.log(`[Orders SSE ${connectionId}] Setting up SSE connection...`);
      eventSource = new EventSource("/api/barcodes/sse/orders");

      eventSource.addEventListener("connected", (event) => {
        console.log(`[Orders SSE ${connectionId}] Connected:`, event.data);
        retryCount = 0; // Reset retry count on successful connection
      });

      eventSource.addEventListener("orderUpdate", (event) => {
        const { orderId, drumId, newQuantityReceived } = JSON.parse(
          (event as MessageEvent).data
        );
        console.log(
          `[Orders SSE ${connectionId}] Received order update for order ${orderId}`
        );

        // Invalidate the query with the full query key
        queryClient.invalidateQueries({
          queryKey: ["orders", pageIndex, pageSize],
        });

        // Optimistically update local data before refetch completes
        queryClient.setQueryData<{ rows: Order[]; total: number }>(
          ["orders", pageIndex, pageSize],
          (old) => {
            if (!old) return old;

            const updatedRows = old.rows.map((order) =>
              order.order_id === orderId
                ? { ...order, quantity_received: newQuantityReceived }
                : order
            );

            return {
              ...old,
              rows: updatedRows,
            };
          }
        );
      });

      eventSource.addEventListener("error", (error) => {
        console.error(`[Orders SSE ${connectionId}] SSE Error:`, error);
        eventSource.close();

        // Attempt to reconnect if we haven't exceeded max retries
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(
            `[Orders SSE ${connectionId}] Attempting to reconnect (attempt ${retryCount}/${maxRetries})...`
          );
          const reconnectDelay = Math.min(
            1000 * Math.pow(2, retryCount),
            10000
          );
          setTimeout(setupEventSource, reconnectDelay);
        } else {
          console.error(
            `[Orders SSE ${connectionId}] Max reconnection attempts reached`
          );
        }
      });
    }

    setupEventSource();

    return () => {
      console.log(`[Orders SSE ${connectionId}] Cleaning up SSE connection`);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [queryClient, pageIndex, pageSize]);

  /*
  const mutation = useMutation<OrderGetResponse, Error, NewOrder>({
    mutationFn: async (newOrder) => {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOrder),
      });
      if (!response.ok) throw new Error("Failed to create order");
      return response.json();
    },
    onSuccess: () => {
      refetch(); // Refresh data after successful insertion
    },
  });

  const handleAddOrder = (orderData: NewOrder) => {
    console.log("Attempting to add order:", orderData);
    mutation.mutate(orderData, {
      onSuccess: (data) => {
        console.log("Order added successfully:", data);
      },
      onError: (error) => {
        console.error("Failed to add order:", error);
      },
      onSettled: (data, error) => {
        console.log("Mutation settled:", { data, error });
      },
    });
  };
  */

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  // Show loading state only if we don't have initial data and are loading
  if (isLoading && !initialData) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-64 bg-slate-700 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-slate-800 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !data?.rows?.length) {
    return (
      <div className="p-6 bg-red-900/20 border border-red-700 rounded-lg text-red-100">
        <h2 className="text-xl font-semibold mb-2">Error Loading Orders</h2>
        <p className="mb-4">There was a problem loading the orders data:</p>
        <pre className="bg-slate-900 p-4 rounded overflow-auto text-sm">
          {error.message || "Unknown error"}
        </pre>
        <button
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 bg-red-700 hover:bg-red-600 rounded-md transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative flex flex-col md:flex-row items-center justify-between px-8 py-8 bg-slate-700 rounded-md">
        <div className="flex flex-col md:flex-row items-center w-full md:w-auto">
          <div className="mb-4 md:mb-0 md:mr-4">
            <SearchBar
              filterOptions={filterOptions}
              selectedFilter={selectedFilter}
              onFilterChange={setSelectedFilter}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>
          <Link
            href="/inventory/orders/new"
            className="bg-blue-500 text-white px-4 py-2 rounded-md"
          >
            Add Order
          </Link>
        </div>
        <div className="flex-row gap-4 hidden lg:flex">
          <Link href="/inventory/activity" className="mx-auto">
            <button
              type="button"
              className="flex flex-col items-center px-6 py-3 bg-slate-600 rounded-md hover:bg-slate-500 transition-colors"
            >
              <span className="text-xs text-gray-300">Go to</span>
              <span className="font-medium">Activity</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Main Orders Grid */}
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Orders</h1>
        <BentoGrid>
          {data?.rows.map((order) => (
            <div
              key={order.order_id}
              onClick={() => handleOrderClick(order)}
              className="p-4 bg-slate-800 rounded-lg border border-slate-700 shadow-md 
                hover:bg-slate-700/80 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] 
                hover:border-slate-600 transition-all duration-200 cursor-pointer"
            >
              <div className="mb-2">
                <h2 className="text-lg font-semibold text-white">
                  {order.supplier}
                </h2>
                <p className="text-sm text-slate-400">{order.material}</p>
              </div>
              <div className="mb-2 text-white">
                <p>
                  <strong>Ordered:</strong> {order.quantity}
                </p>
                <p>
                  <strong>Received:</strong> {order.quantity_received || 0}
                </p>
                <p>
                  <strong>PO Number:</strong> {order.po_number || ""}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  <span
                    className={`${
                      order.status === "complete"
                        ? "text-green-400"
                        : order.status === "partial"
                        ? "text-yellow-400"
                        : "text-slate-300"
                    } font-medium`}
                  >
                    {order.status}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">
                  Ordered on:{" "}
                  {order.date_ordered
                    ? new Date(order.date_ordered).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>
          ))}
        </BentoGrid>
      </div>

      {/* Modal for Order Details */}
      <GridModal
        order={selectedOrder}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onOrderUpdate={(updatedOrder) => {
          // Update the selected order
          setSelectedOrder(updatedOrder);

          // Update the order in the grid data
          queryClient.setQueryData<{ rows: Order[]; total: number }>(
            ["orders", pageIndex, pageSize],
            (old) => {
              if (!old) return old;
              return {
                ...old,
                rows: old.rows.map((order) =>
                  order.order_id === updatedOrder.order_id
                    ? updatedOrder
                    : order
                ),
              };
            }
          );
        }}
      />
    </div>
  );
};

export default OrdersGrid;
