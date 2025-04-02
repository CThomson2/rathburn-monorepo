import {
  Package2,
  RefreshCcw,
  Truck,
  ClipboardList,
  Calendar,
  Tag,
  ArchiveX,
  ListChecks,
} from "lucide-react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { WorkflowCard } from "@/components/cards/workflow-card";
import { Alert } from "@/components/widgets/alerts-widget";
import MetricCards from "@/components/widgets/metric-cards";
import OrderFormWidget from "@/components/widgets/order-form-widget";
import InventoryCharts from "@/components/widgets/inventory-charts";
import AlertsWidget from "@/components/widgets/alerts-widget";
import { createClient } from "@/lib/supabase/server";
import { InventoryData, OrderData, StockLevel } from "./types";

function calculateAlertLevel(
  currentStock: number,
  minRequired: number
): "critical" | "warning" | "normal" | null {
  const ratio = currentStock / minRequired;

  if (ratio <= 0.75) return "critical";
  if (ratio <= 1) return "warning";
  if (ratio <= 1.25) return "normal";
  return null;
}

export default async function Page() {
  const supabase = createClient();

  // Fetch inventory data
  const { data: inventoryData, error: inventoryError } = await supabase
    .from("vw_current_inventory")
    .select("*");

  const { data: materialData, error: materialError } = await supabase
    .from("ref_materials")
    .select("*");

  // const { data: chemicalGroups, error: groupsError } = await supabase
  //   .from("chemical_group_kind")
  //   .select("value");

  if (inventoryError || materialError) {
    console.error("Error fetching data:", inventoryError || materialError);
    // You might want to handle this error appropriately
    return (
      <div>
        <h2>Error loading inventory data</h2>
        <p>{inventoryError?.message}</p>
        <p>{materialError?.message}</p>
      </div>
    );
  }

  // Process inventory data
  const alerts: Alert[] = inventoryData
    .map((item) => {
      const alertLevel = calculateAlertLevel(
        item.total_drums,
        item.min_required
      );
      if (!alertLevel) return null;

      return {
        id: materialData.find((m) => m.value == item.material)?.code || "",
        name: item.material,
        group:
          materialData.find((m) => m.value === item.material)?.chemical_group ||
          "",
        level: alertLevel,
        currentStock: item.total_drums,
        minRequired: item.min_required,
      };
    })
    .filter((alert): alert is Alert => alert !== null);

  // Calculate category totals
  const categoryTotals = inventoryData.reduce(
    (acc: { [key: string]: number }, item) => {
      if (item.chemical_group) {
        acc[item.chemical_group] =
          (acc[item.chemical_group] || 0) + item.total_drums;
      }
      return acc;
    },
    {}
  );

  // Format data for the UI
  const processedData: InventoryData = {
    totalValue: inventoryData.reduce(
      (sum, item) => sum + (item.total_drums || 0),
      0
    ),
    belowSafetyStock: alerts.filter((a) => a.level === "critical").length,
    pendingOrders: 0, // This would come from a different table in a real app
    stockAccuracy: 100, // This would be calculated differently in a real app
    alerts,
    stockLevels: inventoryData.map((item) => ({
      name: item.material,
      quantity: item.total_drums,
      value: item.total_drums, // In a real app, you'd multiply by unit price
    })),
    categories: Object.entries(categoryTotals)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({
        name,
        value,
      })),
    trendData: [], // This would come from historical data in a real app
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Inventory Dashboard
        </h1>

        {/* Key Metrics Row */}
        <div className="mb-6">
          <MetricCards
            totalValue={processedData.totalValue}
            belowSafetyStock={processedData.belowSafetyStock}
            pendingOrders={processedData.pendingOrders}
            stockAccuracy={processedData.stockAccuracy}
          />
        </div>

        {/* Two Column Layout for Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - 2/3 width on large screens */}
          <div className="lg:col-span-2 space-y-6">
            <InventoryCharts
              stockLevels={processedData.stockLevels}
              categories={processedData.categories}
              trendData={processedData.trendData}
            />
          </div>

          {/* Right Column - 1/3 width on large screens */}
          <div className="space-y-6">
            <OrderFormWidget onSubmit={() => {}} />
            <AlertsWidget alerts={processedData.alerts} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
