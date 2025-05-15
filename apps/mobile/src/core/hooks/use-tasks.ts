import { useQuery } from '@tanstack/react-query';
import { createClient } from "@/core/lib/supabase/client";
import { PostgrestError } from "@supabase/supabase-js";
import { PurchaseOrderLineTask, RpcPendingPurchaseOrderLine } from '@/core/stores/session-store'; // Assuming types are exported or accessible

const fetchTasksQueryFn = async (): Promise<PurchaseOrderLineTask[]> => {
  console.log("[TanStackQuery] Fetching purchase order tasks (lines)...");
  const supabase = createClient();
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_pending_purchase_orders') as { data: RpcPendingPurchaseOrderLine[] | null; error: PostgrestError | null };

  if (rpcError) {
    console.error("Error fetching PO lines (tasks) from RPC:", rpcError);
    throw rpcError; // React Query will handle this as an error state
  }

  const tasks: PurchaseOrderLineTask[] = [];
  if (rpcData) {
    for (const line of rpcData) {
      // This part fetching receivedCount for each line can lead to N+1 if not careful.
      // If get_pending_purchase_orders could return receivedCount directly, it'd be more performant.
      // For now, keeping existing logic:
      const { data: drumsData, error: drumsError } = await supabase
        .schema('inventory')
        .from('purchase_order_drums')
        .select('serial_number, is_received', { count: 'exact' })
        .eq('pol_id', line.pol_id)
        .eq('is_received', true);

      let receivedCount = 0;
      if (drumsError) {
        console.warn(`[TanStackQuery] Error fetching received drums for pol_id ${line.pol_id}:`, drumsError);
      } else {
        receivedCount = drumsData?.length || 0;
      }
      
      console.log(`[TanStackQuery] Task Check: PO: ${line.po_number}, Item: ${line.item}, Line Quantity: ${line.quantity}, Received Count: ${receivedCount}`);

      if (line.quantity - receivedCount > 0) {
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

export function usePurchaseOrderTasks() {
  return useQuery<PurchaseOrderLineTask[], Error>({
    queryKey: ['purchaseOrderTasks'],
    queryFn: fetchTasksQueryFn,
    // Configure staleTime and cacheTime as needed
    // staleTime: 5 * 60 * 1000, // 5 minutes
    // cacheTime: 15 * 60 * 1000, // 15 minutes
  });
}
