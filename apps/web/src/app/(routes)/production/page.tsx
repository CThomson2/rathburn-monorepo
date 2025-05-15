// src/app/(routes)/page.tsx
"use client";

import { useState, useEffect } from "react";
import { AnimatedOrderCard, OrdersToolbar } from "@/features/production";
import { ProductionModal } from "@/features/production/components/production-modal";
import { useToast } from "@/components/ui/use-toast";
import { fetchProductionJobs } from "../../actions/production";
import type { Order as ProductionJobOrder } from "@/features/production/types";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * OrdersPage is a Next.js page that displays a list of orders.
 * It loads data from the API on initial render and allows the user to search, filter, and sort the orders.
 * It also shows a create job modal when the user clicks the "Create Order" button.
 *
 * @returns The JSX element for the OrdersPage component.
 */
const OrdersPage = () => {
  const [jobs, setJobs] = useState<ProductionJobOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Function to load data
  const loadJobs = async () => {
    setLoading(true);
    try {
      const fetchedJobs = await fetchProductionJobs();
      setJobs(fetchedJobs);
    } catch (error) {
      console.error("Error fetching production jobs:", error);
      toast({
        title: "Error loading production jobs",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load data on initial render
  useEffect(() => {
    loadJobs();
  }, []);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Filter orders based on search
  const filteredJobs = jobs.filter((job) => {
    if (
      searchQuery &&
      !job.id.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !job.itemName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(
        job.supplier?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false
      )
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 bg-background dark:bg-background overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Production Schedule</h1>
          <Button onClick={() => setShowCreateModal(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Schedule New Job
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-card dark:bg-card rounded-2xl shadow-sm p-6 animate-pulse"
              >
                <div className="h-4 bg-muted dark:bg-muted-foreground/20 rounded w-1/4 mb-4"></div>
                <div className="h-3 bg-muted dark:bg-muted-foreground/20 rounded w-1/2 mb-6"></div>
                <div className="h-2 bg-muted dark:bg-muted-foreground/20 rounded w-full mb-4"></div>
                <div className="flex justify-between">
                  <div className="h-3 bg-muted dark:bg-muted-foreground/20 rounded w-1/4"></div>
                  <div className="h-6 bg-muted dark:bg-muted-foreground/20 rounded w-24"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job, index) => (
              <AnimatedOrderCard key={job.id} order={job} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mx-auto h-12 w-12 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7c0-1.1.9-2 2-2h10a2 2 0 012 2v8a2 2 0 01-2 2zm0 0H7"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-foreground">
              No production jobs found
            </h3>
            <p className="mt-1 text-muted-foreground">
              {searchQuery
                ? "Try adjusting your search or filters."
                : "Get started by scheduling a new production job."}
            </p>
            <Button onClick={() => setShowCreateModal(true)} className="mt-6">
              Schedule New Job
            </Button>
          </div>
        )}
      </main>

      <ProductionModal
        open={showCreateModal}
        onOpenChange={(isOpen) => {
          setShowCreateModal(isOpen);
          if (!isOpen) {
            loadJobs(); // Refresh jobs list when modal closes
          }
        }}
      />
    </div>
  );
};

export default OrdersPage;
