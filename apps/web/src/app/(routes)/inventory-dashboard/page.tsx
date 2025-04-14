"use client";

import { useQuery } from "@tanstack/react-query";
import MetricCards from "@/components/desktop/widgets/MetricCards";
import OrderFormWidget from "@/components/desktop/widgets/OrderFormWidget";
import InventoryCharts from "@/components/desktop/widgets/InventoryCharts";
import AlertsWidget, {
  type Alert,
} from "@/components/desktop/widgets/AlertsWidget";
import { Database } from "@/types/models/orders/database.types";

// Type definitions for our API data
interface StockMaterial {
  material: string;
  count: number;
}

interface StockData {
  totalStock: number;
  lowStockCount: number;
  lowStockMaterials: StockMaterial[];
  topMaterials: StockMaterial[];
}

interface OrderData {
  recentOrders: {
    id: number;
    date: string;
    supplier: string;
    status: string;
    items: number;
  }[];
  pendingOrders: number;
}

// Create default empty data for initial state or error fallback
const DEFAULT_DATA = {
  totalValue: 0,
  belowSafetyStock: 0,
  pendingOrders: 0,
  stockAccuracy: 0,
  alerts: [],
  stockLevels: [],
  categories: [],
  trendData: [],
  isLoading: false,
  error: null,
};

// Function to fetch dashboard data
async function fetchDashboardData() {
  try {
    // Fetch stock data
    const stockResponse = await fetch("/api/dashboard/current-stock");
    const stockData: StockData = await stockResponse.json();

    // Fetch recent orders data
    const ordersResponse = await fetch("/api/dashboard/recent-orders");
    const ordersData: OrderData = await ordersResponse.json();

    // Calculate total value (this would typically come from a dedicated endpoint)
    const totalValue = stockData.topMaterials.reduce((total, material) => {
      // Assign an average value per unit for demonstration
      const valuePerUnit = 1000;
      return total + material.count * valuePerUnit;
    }, 0);

    // Generate alerts from low stock materials
    const alerts: Alert[] = stockData.lowStockMaterials.map(
      (material, index) => ({
        id: index + 1,
        name: material.material,
        level: material.count < 5 ? "critical" : "warning",
        currentStock: material.count,
        minRequired: 10, // This would typically be a configured value per material
      })
    );

    // Add some sample alerts if we don't have enough from the API
    if (alerts.length < 3) {
      alerts.push({
        id: alerts.length + 1,
        name: "Sample Material",
        level: "normal",
        currentStock: 25,
        minRequired: 20,
      });
    }

    // Prepare stock levels for charts
    const stockLevels = stockData.topMaterials.map((material) => ({
      name: material.material,
      quantity: material.count,
      value: material.count * 1000, // Simplified value calculation
    }));

    // Group materials by category (simplified)
    const categories = [
      { name: "Solvents", value: totalValue * 0.4 },
      { name: "Reagents", value: totalValue * 0.3 },
      { name: "Catalysts", value: totalValue * 0.2 },
      { name: "Others", value: totalValue * 0.1 },
    ];

    // Generate trend data (would come from a dedicated API in a real app)
    const trendData = [
      { date: "Jan", value: totalValue * 0.85 },
      { date: "Feb", value: totalValue * 0.9 },
      { date: "Mar", value: totalValue * 0.95 },
      { date: "Apr", value: totalValue * 0.92 },
      { date: "May", value: totalValue * 0.97 },
      { date: "Jun", value: totalValue },
    ];

    return {
      totalValue,
      belowSafetyStock: stockData.lowStockCount,
      pendingOrders: ordersData.pendingOrders,
      stockAccuracy: 94.7, // This would come from a dedicated endpoint in a real app
      alerts,
      stockLevels,
      categories,
      trendData,
      isLoading: false,
      error: null,
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return {
      ...DEFAULT_DATA,
      isLoading: false,
      error: "Failed to load dashboard data",
    };
  }
}

export default function InventoryDashboardPage() {
  // Use React Query to fetch and cache dashboard data
  const {
    data: inventoryData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["dashboardData"],
    queryFn: fetchDashboardData,
    // Mock data for initial render and fallback
    initialData: {
      totalValue: 287450,
      belowSafetyStock: 12,
      pendingOrders: 8,
      stockAccuracy: 94.7,
      alerts: [
        {
          id: 1,
          name: "Aluminum Sheets",
          level: "critical",
          currentStock: 32,
          minRequired: 100,
        },
        {
          id: 2,
          name: "Steel Rods",
          level: "warning",
          currentStock: 145,
          minRequired: 200,
        },
        {
          id: 3,
          name: "Copper Wire",
          level: "warning",
          currentStock: 85,
          minRequired: 120,
        },
      ],
      stockLevels: [
        { name: "Aluminum Sheets", quantity: 32, value: 12800 },
        { name: "Steel Rods", quantity: 145, value: 43500 },
        { name: "Copper Wire", quantity: 85, value: 34000 },
        { name: "Plastic Pellets", quantity: 50, value: 5000 },
        { name: "Rubber Gaskets", quantity: 210, value: 6300 },
      ],
      categories: [
        { name: "Metals", value: 163500 },
        { name: "Electronics", value: 93000 },
        { name: "Polymers", value: 11300 },
        { name: "Composites", value: 32400 },
      ],
      trendData: [
        { date: "Jan", value: 245000 },
        { date: "Feb", value: 267000 },
        { date: "Mar", value: 278000 },
        { date: "Apr", value: 264000 },
        { date: "May", value: 274000 },
        { date: "Jun", value: 287450 },
      ],
      isLoading: false,
      error: null,
    },
  });

  const dashboardData = inventoryData || DEFAULT_DATA;

  const handleOrderSubmit = (orderData: any) => {
    console.log("Order submitted:", orderData);
    // In a real app, this would make an API call
    // and update the inventory data accordingly
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Inventory Dashboard
        </h1>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-4 md:p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Inventory Dashboard
        </h1>
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-700">
            Error loading inventory data. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Inventory Dashboard
      </h1>

      {/* Key Metrics Row */}
      <div className="mb-6">
        <MetricCards
          totalValue={dashboardData.totalValue}
          belowSafetyStock={dashboardData.belowSafetyStock}
          pendingOrders={dashboardData.pendingOrders}
          stockAccuracy={dashboardData.stockAccuracy}
        />
      </div>

      {/* Two Column Layout for Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width on large screens */}
        <div className="lg:col-span-2 space-y-6">
          <InventoryCharts
            stockLevels={dashboardData.stockLevels}
            categories={dashboardData.categories}
            trendData={dashboardData.trendData}
          />
        </div>

        {/* Right Column - 1/3 width on large screens */}
        <div className="space-y-6">
          <OrderFormWidget onSubmit={handleOrderSubmit} />
          <AlertsWidget alerts={dashboardData.alerts as Alert[]} />
        </div>
      </div>
    </div>
  );
}
