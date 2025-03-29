"use client";

import { useEffect, useState } from "react";
import { supabase, type StockOrder } from "@/lib/supabase";

export function SupabaseTest() {
  const [stockOrders, setStockOrders] = useState<StockOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStockOrders() {
      try {
        console.log("Fetching stock orders...");
        const { data, error } = await supabase
          .schema("inventory")
          .from("stock_orders")
          .select("*")
          .order("date_ordered", { ascending: false });

        if (error) {
          console.error("Supabase error:", error);
          throw error;
        }

        console.log("Fetched data:", data);
        setStockOrders(data || []);
      } catch (err) {
        console.error("Full error:", err);
        setError(
          err instanceof Error
            ? err.message
            : "An error occurred while fetching stock orders"
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchStockOrders();
  }, []);

  if (isLoading) {
    return <div className="p-4">Loading stock orders...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Stock Orders (Supabase Test)</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 border">PO Number</th>
              <th className="px-4 py-2 border">Date Ordered</th>
              <th className="px-4 py-2 border">Supplier ID</th>
              <th className="px-4 py-2 border">ETA</th>
              <th className="px-4 py-2 border">Notes</th>
            </tr>
          </thead>
          <tbody>
            {stockOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 border">{order.po_number}</td>
                <td className="px-4 py-2 border">
                  {new Date(order.date_ordered).toLocaleDateString()}
                </td>
                <td className="px-4 py-2 border">{order.supplier_id}</td>
                <td className="px-4 py-2 border">{order.eta}</td>
                <td className="px-4 py-2 border">{order.notes || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
