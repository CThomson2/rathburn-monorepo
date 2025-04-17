import ChemicalInventoryDashboard from "@/features/inventory/dashboard";
import { DrumInventory } from "@/features/inventory/types";

interface ChemicalInventoryDashboardClientProps {
  initialData: DrumInventory[];
}

export default function ChemicalInventoryDashboardClient({
  initialData,
}: ChemicalInventoryDashboardClientProps) {
  // You could implement additional client-side logic here if needed
  return <ChemicalInventoryDashboard initialData={initialData} />;
}
