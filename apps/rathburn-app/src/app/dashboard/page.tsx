import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

import { useState } from "react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import MetricCards from "@/components/widgets/metric-cards";
import OrderFormWidget from "@/components/widgets/order-form-widget";
import InventoryCharts from "@/components/widgets/inventory-charts";
import AlertsWidget, { type Alert } from "@/components/widgets/alerts-widget";
import { 
  InventoryData, 
  OrderData, 
  StockLevel 
} from "./workflow/types";

/**
 * Main dashboard page
 * This page will eventually redirect users tor their role-specific dashboard
 * Currently showing simple links until profiles table is set up
 */
export default async function DashboardPage() {
    const supabase = await createClient();

    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        // If no session, redirect to sign in
        redirect('/sign-in');
    }

    // Temporarily disabled profile-based routing until profiles table is set up
    /*
    // Get user profile with role
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    if (error || !profile) {
      // If error fetching profile, show a generic dashboard
      return (
        <div className="container mx-auto p-8">
          <h1 className="text-2xl font-bold mb-6">Welcome to your Dashboard</h1>
          <p>It looks like your user profile is not completely set up.</p>
          <p>Please contact an administrator to assign you a proper role.</p>
          <p>Email: <a href="mailto:conrad@rathburn.app">conrad@rathburn.app</a></p>
          <p>Phone: <a href="tel:+447375298220">07375 298220</a></p>
        </div>
      );
    }
    
    // Redirect based on role
    switch (profile.role) {
      case 'production':
        redirect('/dashboard/production');
        break;
      case "inventory":
        redirect("/dashboard/inventory");
        break;
      case "management":
        redirect("/dashboard/management");
        break;
      default:
        // Generic dashboard for users without a specific role
        return (
          <div className="container mx-auto p-8">
            <h1 className="text-2xl font-bold mb-6">Welcome to your Dashboard</h1>
            <p>Your role is not recognised. Please contact an administrator.</p>
          </div>
        );
    }
    */

    // In a real application, this would come from an API
    const inventoryData: InventoryData = {
        totalValue: 287450,
        belowSafetyStock: 12,
        pendingOrders: 8,
        stockAccuracy: 94.7,
        alerts: [
            { id: 1, name: "Aluminum Sheets", level: "critical", currentStock: 32, minRequired: 100 },
            { id: 2, name: "Steel Rods", level: "warning", currentStock: 145, minRequired: 200 },
            { id: 3, name: "Copper Wire", level: "warning", currentStock: 85, minRequired: 120 },
            { id: 4, name: "Plastic Pellets", level: "critical", currentStock: 50, minRequired: 300 },
            { id: 5, name: "Rubber Gaskets", level: "normal", currentStock: 210, minRequired: 150 }
        ],
        stockLevels: [
            { name: "Aluminum Sheets", quantity: 32, value: 12800 },
            { name: "Steel Rods", quantity: 145, value: 43500 },
            { name: "Copper Wire", quantity: 85, value: 34000 },
            { name: "Plastic Pellets", quantity: 50, value: 5000 },
            { name: "Rubber Gaskets", quantity: 210, value: 6300 },
            { name: "Silicon Chips", quantity: 620, value: 93000 },
            { name: "Glass Panels", quantity: 78, value: 39000 },
            { name: "Carbon Fiber", quantity: 54, value: 32400 },
            { name: "Nickel Alloy", quantity: 96, value: 28800 },
            { name: "Titanium Sheets", quantity: 23, value: 46000 }
        ],
        categories: [
            { name: "Metals", value: 163500 },
            { name: "Electronics", value: 93000 },
            { name: "Polymers", value: 11300 },
            { name: "Composites", value: 32400 },
            { name: "Glass", value: 39000 }
        ],
        trendData: [
            { date: "Jan", value: 245000 },
            { date: "Feb", value: 267000 },
            { date: "Mar", value: 278000 },
            { date: "Apr", value: 264000 },
            { date: "May", value: 274000 },
            { date: "Jun", value: 287450 }
        ]
    };

    const handleOrderSubmit = (orderData: OrderData) => {
        console.log("Order submitted:", orderData);
        // In a real app, this would make an API call
        // and update the inventory data accordingly
    };

    return (
        <DashboardLayout>
            <div className="p-4 md:p-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Inventory Dashboard</h1>
                
                {/* Key Metrics Row */}
                <div className="mb-6">
                    <MetricCards 
                        totalValue={inventoryData.totalValue} 
                        belowSafetyStock={inventoryData.belowSafetyStock}
                        pendingOrders={inventoryData.pendingOrders}
                        stockAccuracy={inventoryData.stockAccuracy}
                    />
                </div>
                
                {/* Two Column Layout for Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - 2/3 width on large screens */}
                    <div className="lg:col-span-2 space-y-6">
                        <InventoryCharts 
                            stockLevels={inventoryData.stockLevels}
                            categories={inventoryData.categories}
                            trendData={inventoryData.trendData}
                        />
                    </div>
                    
                    {/* Right Column - 1/3 width on large screens */}
                    <div className="space-y-6">
                        <OrderFormWidget onSubmit={handleOrderSubmit} />
                        <AlertsWidget alerts={inventoryData.alerts} />
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
