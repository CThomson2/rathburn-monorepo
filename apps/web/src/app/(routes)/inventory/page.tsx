import { selectFromTable } from "@/lib/database";
import { DrumInventory } from "@/features/inventory/types";
import { getBarColor } from "@/features/inventory/utils/colors";
import ChemicalInventoryDashboardClient from "./client";

/**
 * Server-side function to fetch dashboard data with pre-calculated colors
 */
async function fetchDashboardData() {
  try {
    // Fetch inventory data directly from the database
    const rawInventoryData = await selectFromTable<"vw_drum_inventory">("vw_drum_inventory");

    if (!rawInventoryData) throw new Error("No data returned from the database");

    // Transform data for dashboard and pre-calculate colors
    const transformedData = rawInventoryData.map((item) => ({
      id: item.code || "",
      code: item.code,
      name: item.value,
      newStock: item.raw_drums || 0,
      reproStock: item.repro_drums || 0,
      category: item.ch_group,
      chGroup: item.ch_group,
      threshold: item.threshold || 10,
      total: (item.raw_drums || 0) + (item.repro_drums || 0),
      // Pre-calculate colors for server-side rendering
      groupColour: {
        new: getBarColor(item.ch_group, false),
        repro: getBarColor(item.ch_group, true),
      },
    }));

    return { drumInventoryData: transformedData };
  } catch (error) {
    console.error("Error fetching inventory data:", error);
    return { drumInventoryData: [] };
  }
}

export default async function InventoryDashboardPage() {
  // Server-side data fetching
  const { drumInventoryData } = await fetchDashboardData();

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Inventory Dashboard
      </h1>

      {/* Key Metrics Row */}
      {/* <div className="mb-6">
        <MetricCards
          totalValue={dashboardData.totalValue}
          belowSafetyStock={dashboardData.belowSafetyStock}
          pendingOrders={dashboardData.pendingOrders}
          stockAccuracy={dashboardData.stockAccuracy}
        />
      </div> */}

      {/* Two Column Layout for Main Content */}
      {/* <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6"> */}
      {/* Left Column - 2/3 width on large screens */}
      {/* <div className="lg:col-span-2 space-y-6">
          <InventoryCharts
            stockLevels={dashboardData.stockLevels}
            categories={dashboardData.categories}
            trendData={dashboardData.trendData}
          />
        </div> */}

      {/* Right Column - 1/3 width on large screens */}
      {/* <div className="space-y-6">
          <OrderFormWidget onSubmit={() => {}} />
          <AlertsWidget alerts={dashboardData.alerts as Alert[]} />
        </div>
      </div> */}

      {/* Chemical Inventory Dashboard with pre-fetched data */}
      <ChemicalInventoryDashboardClient initialData={drumInventoryData} />
    </div>
  );
}
