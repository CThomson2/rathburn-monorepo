import { useQuery } from "@tanstack/react-query";

interface InventoryStats {
  totalItems: number;
  lowStockItems: number;
}

async function getInventoryStats(): Promise<InventoryStats> {
  const response = await fetch("/api/inventory/stats");
  if (!response.ok) {
    throw new Error("Failed to fetch inventory stats");
  }
  return response.json();
}

export function useInventoryStats() {
  return useQuery({
    queryKey: ["inventory", "stats"],
    queryFn: getInventoryStats,
  });
}
