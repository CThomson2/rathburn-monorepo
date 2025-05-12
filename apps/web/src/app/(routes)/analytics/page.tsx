import { Metadata } from "next";
import { Suspense } from "react";
import DrumInventoryGrid from "@/features/drum-index/components/inventory-grid";

export const metadata: Metadata = {
  title: "Analytics | Raw Material Tracking",
  description: "Analytics dashboard for raw material inventory and tracking",
};

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>

      <div className="grid gap-6">
        <section>
          <h2 className="text-2xl font-semibold mb-4">
            Raw Material Inventory
          </h2>
          <div className="bg-white rounded-lg shadow">
            <Suspense
              fallback={
                <div className="p-8 text-center">Loading inventory data...</div>
              }
            >
              <DrumInventoryGrid />
            </Suspense>
          </div>
        </section>
      </div>
    </div>
  );
}
