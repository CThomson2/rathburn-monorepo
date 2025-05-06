import { createClient, createServiceClient } from "@/lib/supabase/server";
import { SupabaseClient } from "@supabase/supabase-js";
import ChemicalInventoryDashboard from "@/features/dashboard";

/**
 * Server-side function to fetch dashboard data with pre-calculated colors
 */
async function fetchDashboardData() {
  try {
    // Create Supabase client instance
    const supabase = createClient();

    // Type assertion to allow querying of the vw_drum_inventory view
    const client = supabase as unknown as SupabaseClient;

    // Fetch inventory data directly from the view
    const { data: rawInventoryData, error } = await client
      .from("drum_inventory")
      .select("*");

    if (error) throw error;
    if (!rawInventoryData || rawInventoryData.length === 0)
      throw new Error("No data returned from the database");

    // Transform data for dashboard and pre-calculate colors
    // Group by code to combine raw and repro rows for each material
    const materialMap = new Map();

    // First pass: create entries in the map for each unique material code
    rawInventoryData.forEach((item: any) => {
      if (!materialMap.has(item.code)) {
        materialMap.set(item.code, {
          id: item.code || "",
          code: item.code,
          name: item.name,
          rawStock: 0,
          reproStock: 0,
          category: item.category,
          threshold: item.threshold || 10,
          total: 0,
        });
      }

      // Update the appropriate stock value based on type
      const material = materialMap.get(item.code);
      if (item.type === "raw") {
        material.rawStock = item.stock;
      } else if (item.type === "repro") {
        material.reproStock = item.stock;
      }

      // Update total (sum of raw and repro)
      material.total = material.rawStock + material.reproStock;
    });

    // Convert map to array for the final transformed data
    const transformedData = Array.from(materialMap.values());

    return { drumInventoryData: transformedData };
  } catch (error) {
    console.error("Error fetching inventory data:", error);
    return { drumInventoryData: [] };
  }
}

export default async function InventoryDashboardPage() {
  // Server-side data fetching for this page only
  const { drumInventoryData } = await fetchDashboardData();

  return (
    <div className="p-4 md:p-6">
      {/* Chemical Inventory Dashboard with pre-fetched data */}
      <ChemicalInventoryDashboard initialData={drumInventoryData} />
    </div>
  );
}
