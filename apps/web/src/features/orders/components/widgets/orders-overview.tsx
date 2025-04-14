"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/core/ui/card";
import { useMemo } from "react";
import { OrdersOverviewWidgetProps } from "@/database/models/types/orders";
import {
  TrendingDown,
  TrendingUp,
  Banknote,
  Package,
  Truck,
  Calendar,
} from "lucide-react";

export function OrdersOverviewWidget({ orders }: OrdersOverviewWidgetProps) {
  const stats = useMemo(() => {
    // Calculate summary statistics
    const pendingOrders = orders.filter(
      (order) => order.status.toLowerCase() === "pending"
    ).length;

    const totalQuantityOrdered = orders.reduce(
      (sum, order) => sum + order.quantity,
      0
    );

    const totalQuantityReceived = orders.reduce(
      (sum, order) => sum + order.quantity_received,
      0
    );

    const pendingQuantity = totalQuantityOrdered - totalQuantityReceived;
    const fulfillmentRate =
      totalQuantityOrdered > 0
        ? (totalQuantityReceived / totalQuantityOrdered) * 100
        : 0;

    // Get unique suppliers and materials
    const uniqueSuppliers = new Set(orders.map((order) => order.supplier)).size;
    const uniqueMaterials = new Set(orders.map((order) => order.material)).size;

    // Time-based analysis
    const now = new Date();
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(now.getFullYear() - 1);

    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(now.getMonth() - 6);

    // Get orders in the last year and last 6 months
    const ordersLastYear = orders.filter(
      (order) => new Date(order.date_ordered) >= oneYearAgo
    );
    const ordersLastSixMonths = orders.filter(
      (order) => new Date(order.date_ordered) >= sixMonthsAgo
    );

    // Calculate order counts
    const totalOrders = orders.length;
    const ordersLastYearCount = ordersLastYear.length;
    const ordersLastSixMonthsCount = ordersLastSixMonths.length;

    // Calculate trend
    const trend =
      ordersLastSixMonthsCount /
      (ordersLastYearCount - ordersLastSixMonthsCount);
    const isIncreasing = trend > 1;

    return {
      pendingOrders,
      totalQuantityOrdered,
      totalQuantityReceived,
      pendingQuantity,
      fulfillmentRate,
      uniqueSuppliers,
      uniqueMaterials,
      totalOrders,
      ordersLastYearCount,
      ordersLastSixMonthsCount,
      trend,
      isIncreasing,
    };
  }, [orders]);

  return (
    <>
      {/* Pending Orders */}
      <Card className="overflow-hidden">
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium">
              Pending Orders
            </CardTitle>
            <CardDescription className="text-xs">
              Orders awaiting delivery
            </CardDescription>
          </div>
          <div className="rounded-full bg-amber-100 p-2">
            <Package className="h-4 w-4 text-amber-600" />
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <div className="text-2xl font-bold">{stats.pendingOrders}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.pendingOrders > 0
              ? `${stats.pendingQuantity} units pending delivery`
              : "All orders fulfilled"}
          </p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-amber-500"
              style={{
                width: `${
                  stats.pendingOrders > 0
                    ? Math.min(
                        100,
                        (stats.pendingOrders / stats.totalOrders) * 100
                      )
                    : 0
                }%`,
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Total Ordered */}
      <Card className="overflow-hidden">
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium">Total Ordered</CardTitle>
            <CardDescription className="text-xs">
              All time quantity
            </CardDescription>
          </div>
          <div className="rounded-full bg-blue-100 p-2">
            <Truck className="h-4 w-4 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <div className="text-2xl font-bold">{stats.totalQuantityOrdered}</div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-muted-foreground">
              Across {stats.totalOrders} orders
            </p>
            <div className="flex items-center text-xs">
              {stats.isIncreasing ? (
                <>
                  <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
                  <span className="text-green-600">
                    {Math.round((stats.trend - 1) * 100)}% up
                  </span>
                </>
              ) : (
                <>
                  <TrendingDown className="mr-1 h-3 w-3 text-red-600" />
                  <span className="text-red-600">
                    {Math.round((1 - stats.trend) * 100)}% down
                  </span>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Received */}
      <Card className="overflow-hidden">
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium">Received</CardTitle>
            <CardDescription className="text-xs">
              Total received quantity
            </CardDescription>
          </div>
          <div className="rounded-full bg-green-100 p-2">
            <Banknote className="h-4 w-4 text-green-600" />
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <div className="text-2xl font-bold">
            {stats.totalQuantityReceived}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {Math.round(stats.fulfillmentRate)}% of ordered
          </p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-green-500"
              style={{ width: `${Math.round(stats.fulfillmentRate)}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Materials */}
      <Card className="overflow-hidden">
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium">Materials</CardTitle>
            <CardDescription className="text-xs">
              Unique materials ordered
            </CardDescription>
          </div>
          <div className="rounded-full bg-purple-100 p-2">
            <Calendar className="h-4 w-4 text-purple-600" />
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <div className="text-2xl font-bold">{stats.uniqueMaterials}</div>
          <p className="text-xs text-muted-foreground mt-1">
            From {stats.uniqueSuppliers} suppliers
          </p>
          <div className="mt-4 flex justify-between text-xs text-muted-foreground">
            <div className="text-center">
              <div className="font-medium text-sm">{stats.uniqueSuppliers}</div>
              <div>Suppliers</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-sm">{stats.uniqueMaterials}</div>
              <div>Materials</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-sm">
                {Math.round(stats.totalOrders / stats.uniqueMaterials)}
              </div>
              <div>Avg. Orders</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
