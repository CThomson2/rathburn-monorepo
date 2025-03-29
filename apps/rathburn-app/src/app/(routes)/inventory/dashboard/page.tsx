import { Suspense } from "react";
import {
  DrumBatch,
  queries as drumQueries,
  FormattedDrum,
} from "@/database/models/drums";
import {
  queries as orderQueries,
  Order,
  FormattedOrder,
} from "@/database/models/orders";
import { DrumStatus } from "@/types/models/drums/constant";
import { createFormatter } from "@/utils/formatters/data";

// Components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActionButton } from "@/components/table/action-button";

import { OrdersOverviewWidget } from "@/features/orders/components/widgets/orders-overview";
import { RecentOrdersWidget } from "@/features/orders/components/widgets/recent-orders";
import { DrumStatusWidget } from "@/features/drums-table/components/widgets/drum-status";
import { MaterialDistributionWidget } from "@/features/drums-table/components/widgets/material-distribution";
import { Skeleton } from "@/components/ui/skeleton";
import { CardSkeleton } from "@/components/patterns/skeletons/card-skeleton";

export const metadata = {
  title: "Inventory Dashboard | Rathburn Dashboard",
  description: "Comprehensive view of inventory, orders, and drum status",
};

// Loading fallbacks
const OrdersOverviewSkeleton = () => (
  <CardSkeleton
    title="Orders Overview"
    description="Summary of all material orders"
    contentClassName="grid grid-cols-3 gap-4"
  >
    {[1, 2, 3].map((i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-8 w-[120px]" />
      </div>
    ))}
  </CardSkeleton>
);

const RecentOrdersSkeleton = () => (
  <CardSkeleton title="Recent Orders" description="Latest material orders">
    <Skeleton className="h-[300px] w-full" />
  </CardSkeleton>
);

const DrumStatusSkeleton = () => (
  <CardSkeleton title="Drum Status" description="Current inventory status">
    <Skeleton className="h-[350px] w-full" />
  </CardSkeleton>
);

const MaterialDistributionSkeleton = () => (
  <CardSkeleton
    title="Material Distribution"
    description="Breakdown by material type"
  >
    <Skeleton className="h-[350px] w-full" />
  </CardSkeleton>
);

async function InventoryDashboardPage() {
  try {
    // Fetch initial data server-side (will be passed to client components)
    console.log("[Server] Fetching complete dashboard data");

    // Get all data by setting high limits or using special functions to bypass pagination
    const [drumsResponse, ordersResponse] = await Promise.all([
      drumQueries.getDrums({
        page: 1,
        limit: 1000, // Much higher limit to effectively get all drums
        sortField: "drum_id",
        sortOrder: "desc",
        status: Object.values(DrumStatus),
      }),
      orderQueries.getOrders({
        page: 1,
        limit: 1000, // Much higher limit to effectively get all orders
      }),
    ]);

    const orderFormatter = createFormatter<Order, FormattedOrder>([
      "date_ordered",
      "created_at",
      "updated_at",
      "eta_start",
      "eta_end",
      "po_number",
    ]);

    const drumFormatter = createFormatter<DrumBatch, FormattedDrum>([
      "date_processed",
      "date_ordered",
      "created_at",
      "updated_at",
    ]);

    const [ordersData, drumsData] = [
      ordersResponse.orders.map((order) => orderFormatter(order)),
      drumsResponse.drums.map((drum) => drumFormatter(drum)),
    ];

    console.log(
      `[Server] Successfully fetched ${drumsData.length} drums and ${ordersData.length} orders`
    );

    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold">Inventory Dashboard</h1>
          <div className="flex flex-wrap gap-2">
            <ActionButton text="Create Order" href="/inventory/orders/create" />
            <ActionButton text="View All Orders" href="/inventory/orders" />
            <ActionButton text="View All Drums" href="/inventory" />
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="w-full sm:w-auto mb-2">
            <TabsTrigger value="overview" className="flex-1 sm:flex-initial">
              Overview
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex-1 sm:flex-initial">
              Orders
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex-1 sm:flex-initial">
              Inventory
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Top row - Summary cards - Single column on mobile, 4 cols on large screens */}
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <Suspense fallback={<OrdersOverviewSkeleton />}>
                <OrdersOverviewWidget orders={ordersData} />
              </Suspense>
            </div>

            {/* Middle row - Charts and graphs - Single column on mobile, 2 cols on medium+ */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              <Suspense fallback={<DrumStatusSkeleton />}>
                <DrumStatusWidget drums={drumsData} />
              </Suspense>
              <Suspense fallback={<MaterialDistributionSkeleton />}>
                <MaterialDistributionWidget drums={drumsData} />
              </Suspense>
            </div>

            {/* Bottom row - Recent activity - Always full width */}
            <div className="grid gap-6 grid-cols-1">
              <Suspense fallback={<RecentOrdersSkeleton />}>
                <RecentOrdersWidget orders={ordersData} />
              </Suspense>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Orders Management</CardTitle>
                <CardDescription>
                  View and manage all material orders
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* We'll embed a simplified version of the orders grid here */}
                <p className="text-sm text-muted-foreground">
                  This tab will contain a more detailed view of all orders.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Drum Inventory</CardTitle>
                <CardDescription>
                  View and manage all drums in inventory
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* We'll embed a simplified version of the drums table here */}
                <p className="text-sm text-muted-foreground">
                  This tab will contain a more detailed view of all drums in
                  inventory.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  } catch (error) {
    console.error("[Server] Error fetching dashboard data:", error);
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold">Inventory Dashboard</h1>
          <div className="flex flex-wrap gap-2">
            <ActionButton text="Create Order" href="/inventory/orders/create" />
            <ActionButton text="View All Orders" href="/inventory/orders" />
            <ActionButton text="View All Drums" href="/inventory" />
          </div>
        </div>

        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">
              Error Loading Dashboard
            </CardTitle>
            <CardDescription className="text-red-600">
              There was a problem loading the dashboard data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">
              Please try refreshing the page. If the problem persists, contact
              support.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
}

export default InventoryDashboardPage;
