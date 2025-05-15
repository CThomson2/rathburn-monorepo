import { Suspense } from "react";
import { Metadata } from "next";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { SupabaseClient } from "@supabase/supabase-js";
import ChemicalInventoryDashboard from "@/features/dashboard";

import BatchesContent from "@/features/batches/batches-content";
import { PageHeader } from "@/components/sidebar/page-header";
import { BatchesContentSkeleton } from "@/components/core/patterns/skeletons/batches-content";

export const metadata: Metadata = {
  title: "Batches | Inventory Management",
  description: "View and manage raw material batches in inventory",
};

async function fetchDashboardData() {
  try {
    // Create Supabase client instance
    const supabase = createClient();

    // Fetch inventory data directly from the new summary view
    const { data: viewData, error } = await supabase
      .schema("inventory")
      .from("v_material_inventory_summary") // Qualify view with schema
      .select("*");

    if (error) throw error;
    if (!viewData) {
      throw new Error(
        "No data returned from the inventory.v_material_inventory_summary view"
      );
    }

    // Transform data for dashboard
    const transformedData = viewData.map((item: any) => ({
      id: item.id, // material_id from the view
      code: item.code,
      name: item.name,
      category: item.category, // chemical_group from the view
      newStock: item.new_stock || 0,
      reproStock: item.repro_stock || 0,
      pending_stock: item.pending_stock || 0,
      processing_stock: item.processing_stock || 0,
      threshold: item.threshold || 10,
      total: item.total_stock || 0,
    }));

    return { drumInventoryData: transformedData };
  } catch (error) {
    console.error("Error fetching material inventory summary data:", error);
    return { drumInventoryData: [] };
  }
}

export default async function BatchesPage() {
  // Server-side data fetching for this page only
  const { drumInventoryData } = await fetchDashboardData();

  return (
    <div className="container mx-auto py-6 space-y-8">
      <PageHeader
        title="Batches"
        description="View and manage raw material batches in inventory"
      />

      <div className="p-4 md:p-6">
        {/* Chemical Inventory Dashboard with pre-fetched data */}
        <ChemicalInventoryDashboard initialData={drumInventoryData} />
      </div>

      <Suspense fallback={<BatchesContentSkeleton />}>
        <BatchesContent />
      </Suspense>
    </div>
  );
}
