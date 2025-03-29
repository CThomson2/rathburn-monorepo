import { Metadata } from "next";
import { getDrumStockData } from "@/features/inventory/drum-stock/data-utils";
import { DrumStockColumns } from "@/features/inventory/drum-stock/columns";
import DataTable from "@/components/dashboard/data-tables/data-table-one";

export const metadata: Metadata = {
  title: "Drums Stock | Dashboard",
  description: "Inventory management for drums stock",
};

export default async function DrumStockPage() {
  // Fetch data from the database
  const drumStockData = await getDrumStockData();

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Drums Stock</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Manage and track inventory for all drums
        </p>
      </div>

      <DataTable columns={DrumStockColumns} data={drumStockData} />
    </div>
  );
}
