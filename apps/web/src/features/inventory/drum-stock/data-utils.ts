import { executeDbOperation } from "@/lib/database";
import { Tables } from "@/types/models/database.types";

export type DrumRecord = Tables<"stock_drum"> & {
  order_detail?: Tables<"order_detail"> | null;
};

export interface OrderGroup {
  order_id: number;
  po_number: string | null;
  supplier: string;
  material_name: string;
  date_ordered: string | null;
  total_drums: number;
  count: {
    pending: number;
    available: number;
    processed: number;
  };
  subRows: DrumRecord[];
}

/**
 * Fetches drum stock data from the database and groups it by order_id
 */
export async function getDrumStockData(): Promise<OrderGroup[]> {
  // Fetch all drums with their related order information
  const drums = await executeDbOperation(async (supabase) => {
    const { data, error } = await supabase
      .from("stock_drum")
      .select(
        `
        *,
        order_detail:order_detail_id (
          *,
          order:order_id (
            order_id,
            supplier_id,
            po_number,
            date_ordered,
            supplier:supplier_id (
              supplier_name
            )
          )
        )
      `
      )
      .order("order_detail_id", { ascending: false });

    if (error) throw error;
    return data;
  });

  // Process the data to group by order_id
  const orderMap = new Map<number, OrderGroup>();

  drums.forEach((drum) => {
    if (!drum.order_detail?.order_id || drum.order_detail.order_id <= 47)
      return; // Skip any drums without order_id

    const order_id = drum.order_detail.order_id;
    const orderRecord = orderMap.get(order_id);

    // Create a status for counting - simplified to the three main statuses
    const countStatus =
      drum.status === "available"
        ? "available"
        : drum.status === "processed"
          ? "processed"
          : "pending";

    if (orderRecord) {
      // Add to existing order group
      orderRecord.subRows.push(drum);
      orderRecord.total_drums++;
      // Update counts based on status
      orderRecord.count[countStatus]++;
    } else {
      // Create a new order group
      const initialCount = {
        pending: 0,
        available: 0,
        processed: 0,
      };
      // Increment the count for the order group
      initialCount[countStatus]++;

      orderMap.set(order_id, {
        order_id,
        po_number: drum.order_detail.order?.po_number || null,
        supplier: drum.order_detail.order?.supplier?.supplier_name || "Unknown",
        material_name: drum.order_detail.material_name || "Unknown",
        date_ordered: drum.order_detail.order?.date_ordered || null,
        total_drums: 1,
        count: initialCount,
        subRows: [drum],
      });
    }
  });

  // Convert the map to an array
  return Array.from(orderMap.values());
}
