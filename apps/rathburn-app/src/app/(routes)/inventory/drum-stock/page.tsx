import { DrumsTable } from "@/features/drums-table/components/";
import Link from "next/link";
import { queries as q } from "@/database/models/drums";
import { DrumStatus } from "@/types/models/drums/constant";

export const metadata = {
  title: "Drum Inventory | Rathburn Dashboard",
  description: "View and manage drum inventory",
};

const InventoryPage = async () => {
  try {
    // Fetch initial data server-side
    console.log("[Server] Fetching initial drums data");
    const initialData = await q.getDrums({
      page: 1,
      limit: 50,
      sortField: "drum_id",
      sortOrder: "desc",
      status: Object.values(DrumStatus),
    });

    console.log(
      `[Server] Successfully fetched ${initialData.drums.length} drums`
    );

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Order History</h1>
          <Link
            href="/inventory/orders"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            View Orders
          </Link>
        </div>
        <DrumsTable initialData={initialData} />
      </div>
    );
  } catch (error) {
    console.error("[Server] Error fetching drums:", error);
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Drum Inventory</h1>
          <Link
            href="/inventory/orders"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            View Orders
          </Link>
        </div>
        <div className="p-6 bg-red-900/20 border border-red-700 rounded-lg text-red-100">
          <h2 className="text-xl font-semibold mb-2">Error Loading Drums</h2>
          <p>
            There was a problem loading the inventory data. Please try again
            later.
          </p>
        </div>
      </div>
    );
  }
};

export default InventoryPage;
