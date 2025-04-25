// src/app/(routes)/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Order } from "@/features/production/types";
import {
  AnimatedOrderCard,
  OrdersToolbar,
  CreateJobModal,
  fetchProductionJobs,
} from "@/features/production";
import { useToast } from "@/hooks/use-toast";

const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const { toast } = useToast();

  // Function to load data
  const loadData = async () => {
    setLoading(true);
    try {
      const jobs = await fetchProductionJobs();
      setOrders(jobs);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error loading orders",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load data on initial render
  useEffect(() => {
    loadData();
  }, []);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Handle filters
  const handleFilter = (filters: any) => {
    if (filters.status !== undefined) {
      setStatusFilter(filters.status);
    }
    if (filters.priority !== undefined) {
      setPriorityFilter(filters.priority);
    }
  };

  // Handle sort
  const handleSort = (sortBy: string) => {
    // Implement sorting logic
    const sortedOrders = [...orders];

    switch (sortBy) {
      case "date-desc":
        sortedOrders.sort(
          (a, b) =>
            new Date(b.scheduledDate).getTime() -
            new Date(a.scheduledDate).getTime()
        );
        break;
      case "date-asc":
        sortedOrders.sort(
          (a, b) =>
            new Date(a.scheduledDate).getTime() -
            new Date(b.scheduledDate).getTime()
        );
        break;
      case "priority-desc":
        sortedOrders.sort((a, b) => {
          const priorityValues = { high: 3, medium: 2, low: 1 };
          return priorityValues[b.priority] - priorityValues[a.priority];
        });
        break;
      case "status":
        sortedOrders.sort((a, b) => a.status.localeCompare(b.status));
        break;
    }

    setOrders(sortedOrders);
  };

  // Show create job modal
  const handleNewOrder = () => {
    setShowCreateModal(true);
  };

  // Filter orders based on search and filters
  const filteredOrders = orders.filter((order) => {
    // Apply search filter
    if (
      searchQuery &&
      !order.id.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !order.itemName.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    // Apply status filter
    if (statusFilter && order.status !== statusFilter) {
      return false;
    }

    // Apply priority filter
    if (priorityFilter && order.priority !== priorityFilter) {
      return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex flex-col">
        <main className="flex-1 bg-gray-50 dark:bg-gray-900 overflow-y-auto min-h-0">
          <OrdersToolbar
            onSearch={handleSearch}
            onFilter={handleFilter}
            onSort={handleSort}
            onNewOrder={handleNewOrder}
          />

          <div className="p-6">
            {loading ? (
              // Skeleton loader
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 animate-pulse"
                  >
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-6"></div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
                    <div className="flex justify-between">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredOrders.length > 0 ? (
              <div className="space-y-4">
                {filteredOrders.map((order, index) => (
                  <AnimatedOrderCard
                    key={order.id}
                    order={order}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  No orders found
                </h3>
                <p className="mt-1 text-gray-500 dark:text-gray-400">
                  {searchQuery || statusFilter || priorityFilter
                    ? "Try adjusting your search or filters"
                    : "Create a new order to get started"}
                </p>
                <button
                  onClick={handleNewOrder}
                  className="mt-4 px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Create Order
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create Job Modal */}
      {showCreateModal && (
        <CreateJobModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onJobCreated={loadData}
        />
      )}
    </div>
  );
};

export default OrdersPage;
