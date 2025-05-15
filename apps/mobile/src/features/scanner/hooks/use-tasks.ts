import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/core/lib/supabase/client";
import { PostgrestError } from "@supabase/supabase-js";
import {
  PurchaseOrderLineTask,
  RpcPendingPurchaseOrderLine,
} from "@/core/stores/session-store"; // Assuming types are exported or accessible

/**
 * Fetches pending purchase order tasks from the Supabase RPC call.
 *
 * This function retrieves purchase order lines that have pending tasks
 * and calculates the number of received items for each line. It filters
 * out tasks that are fully completed.
 *
 * @returns {Promise<PurchaseOrderLineTask[]>} An array of purchase order line tasks
 *          with details including total quantity, received quantity, and remaining quantity.
 *
 * @throws {PostgrestError} If the RPC call fails to fetch purchase order lines.
 *
 * Logs the task details and any errors encountered during the process.
 */


const fetchTasksQueryFn = async (): Promise<PurchaseOrderLineTask[]> => {
  console.log("[TanStackQuery] Fetching purchase order tasks (lines)...");
  const supabase = createClient();
  const { data: rpcData, error: rpcError } = (await supabase.rpc(
    "get_pending_purchase_orders"
  )) as {
    data: RpcPendingPurchaseOrderLine[] | null;
    error: PostgrestError | null;
  };

  console.log("[TanStackQuery] Raw RPC Data:", JSON.stringify(rpcData, null, 2));

  if (rpcError) {
    console.error("Error fetching PO lines (tasks) from RPC:", rpcError);
    throw rpcError;
  }

  const tasks: PurchaseOrderLineTask[] = [];
  if (rpcData) {
    console.log(`[TanStackQuery] Processing ${rpcData.length} lines from RPC.`);
    for (const line of rpcData) {
      console.log("[TanStackQuery] Processing line:", JSON.stringify(line, null, 2));
      console.log(`[TanStackQuery]   Type of line.quantity: ${typeof line.quantity}, Value: ${line.quantity}`);
      console.log(`[TanStackQuery]   Type of line.received_count: ${typeof line.received_count}, Value: ${line.received_count}`);

      const receivedCount = line.received_count; // Should be number if RPC definition and cast are correct

      console.log(
        `[TanStackQuery] Task Check: PO: ${line.po_number}, Item: ${line.item}, Line Quantity: ${line.quantity} (type: ${typeof line.quantity}), Received Count: ${receivedCount} (type: ${typeof receivedCount})`
      );

      // Ensure calculations are done with numbers
      const totalQuantityNumber = Number(line.quantity);
      const receivedCountNumber = Number(receivedCount);

      if (isNaN(totalQuantityNumber) || isNaN(receivedCountNumber)) {
        console.error(`[TanStackQuery] Invalid number encountered for PO: ${line.po_number}, Item: ${line.item}. Quantity: ${line.quantity}, Received: ${receivedCount}`);
        // Optionally skip this line or handle error appropriately
        continue;
      }

      if (totalQuantityNumber - receivedCountNumber > 0) {
        tasks.push({
          id: line.pol_id,
          po_id: line.po_id,
          poNumber: line.po_number,
          supplier: line.supplier,
          item: line.item,
          totalQuantity: line.quantity,
          receivedQuantity: receivedCount,
          remainingQuantity: line.quantity - receivedCount,
        });
      }
    }
  }
  return tasks;
};

export function usePurchaseOrderTasks(options?: { enabled: boolean }) {
  return useQuery<PurchaseOrderLineTask[], Error>({
    queryKey: ["purchaseOrderTasks"],
    queryFn: fetchTasksQueryFn,
    // Configure staleTime and cacheTime as needed
    // staleTime: 5 * 60 * 1000, // 5 minutes
    // cacheTime: 15 * 60 * 1000, // 15 minutes
    enabled: options?.enabled ?? true,
  });
}
