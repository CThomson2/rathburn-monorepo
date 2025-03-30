import { OrdersGrid } from "@/features/orders/components";
import Link from "next/link";
import { getDb } from "@/database";
import { queries as q } from "@/database/models/orders/queries";

export const metadata = {
  title: "Orders | Inventory Management",
  description: "View and manage material orders",
};

// Server component that fetches data server-side
async function OrdersPage() {
  // Fetch initial data server-side
  const page = 1;
  const limit = 30;

  console.log(
    `[Server] Fetching initial orders data with page=${page}, limit=${limit}`
  );

  try {
    // Use the same query function that the API route uses
    const ordersData = await q.getOrders({ page, limit });

    console.log(
      `[Server] Successfully fetched ${ordersData.orders.length} orders`
    );

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Orders Management</h1>
          <Link
            href="/inventory/orders/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            New Order
          </Link>
        </div>
        {/* Pass the initial data to the client component */}
        <OrdersGrid initialData={ordersData} />
      </div>
    );
  } catch (error) {
    console.error("[Server] Error fetching orders:", error);
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Orders Management</h1>
          <Link
            href="/inventory/orders/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            Create New Order
          </Link>
        </div>
        <div className="p-6 bg-red-50 text-red-600 rounded-md">
          <h2 className="text-xl font-semibold mb-2">Error Loading Orders</h2>
          <p>
            There was a problem loading the orders data. Please try again later.
          </p>
        </div>
      </div>
    );
  }
}

export default OrdersPage;
