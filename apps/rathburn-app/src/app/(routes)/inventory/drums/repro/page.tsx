import { Metadata } from "next";
import path from "path";
import fs from "fs/promises";
import { parseCSV } from "@/utils/csv";
import { ReproStockTable } from "@/features/old-inventory/repro-stock";
import type { ReproStock } from "@/features/old-inventory/types";

export const metadata: Metadata = {
  title: "Repro Drums Stock | Dashboard",
  description: "Inventory management for repro drums",
};

// Replace for SSR prisma query on repro_drums table
async function getReproStockData() {
  try {
    // Read the CSV file from the data directory
    const filePath = path.join(process.cwd(), "data", "repro-data.csv");
    const csvData = await fs.readFile(filePath, "utf8");

    // Parse the CSV data into an array of ReproStock objects
    return parseCSV<ReproStock>(csvData);
  } catch (error) {
    console.error("Error loading repro stock data:", error);
    return [];
  }
}

export default async function ReproDrumsPage() {
  const reproStockData = await getReproStockData();

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Repro Drums Stock</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Manage and track inventory for all repro drums
        </p>
      </div>

      <div className="bg-white dark:bg-boxdark rounded-lg shadow p-6">
        <ReproStockTable data={reproStockData} />
      </div>
    </div>
  );
}
