import { createClient, createServiceClient } from "@/lib/supabase/server";
import { SupabaseClient } from "@supabase/supabase-js";
import ChemicalInventoryDashboard from "@/features/dashboard";
import { RealtimeFeed } from "@/components/realtime-feed";

// Define the type for the view data used in the page
// This should match the interface in RealtimeFeed
interface StocktakeScanFeedDetail {
  id: string;
  stocktake_session_id: string;
  scanned_at: string;
  created_at: string;
  raw_barcode: string;
  barcode_type: "material" | "supplier" | "unknown" | "error";
  status: "success" | "error" | "ignored";
  error_message?: string | null;
  user_id: string;
  device_id?: string | null;
  material_id?: string | null;
  material_name?: string | null;
  supplier_id?: string | null;
  supplier_name?: string | null;
  associated_supplier_name_for_material?: string | null;
}

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

/**
 * Fetch initial scan data for the realtime feed FROM THE VIEW
 */
async function fetchInitialScans(): Promise<StocktakeScanFeedDetail[]> {
  try {
    // Use service client to bypass RLS
    const supabase = createServiceClient();

    // Fetch the latest scans from the VIEW
    const { data, error } = await supabase
      .from("stocktake_scans_feed_details")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching initial scans from view:", error);
      return [];
    }

    // Cast the data to the expected type
    return (data as StocktakeScanFeedDetail[]) || [];
  } catch (error) {
    console.error("Error in fetchInitialScans:", error);
    return [];
  }
}

export default async function InventoryDashboardPage() {
  // Server-side data fetching
  const { drumInventoryData } = await fetchDashboardData();
  const initialScans = await fetchInitialScans();

  // Get the Supabase URL and anon key for client-side usage
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  return (
    <div className="p-4 md:p-6">
      {/* Realtime Stocktake Feed - props type matches fetched data */}
      <RealtimeFeed
        apiUrl={supabaseUrl}
        apiKey={supabaseAnonKey}
        initialScans={initialScans}
      />

      {/* Chemical Inventory Dashboard with pre-fetched data */}
      <ChemicalInventoryDashboard initialData={drumInventoryData} />
    </div>
  );
}
