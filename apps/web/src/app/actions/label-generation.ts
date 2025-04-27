"use server";

import { executeServerDbOperation } from "@/lib/database";
import { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

interface DrumLabelData {
  serialNumber: string;
  materialName: string;
  supplierName: string;
  purchaseOrderId: string;
  purchaseOrderLineId: string;
}

interface PurchaseOrderLineForLabel {
  purchaseOrderLineId: string;
  purchaseOrderId: string;
  purchaseOrderNumber: string;
  materialName: string;
  supplierName: string;
  quantity: number;
  pendingLabels: number;
}

interface DrumLabelQueryResult {
  pod_id: string;
  serial_number: string;
  pol_id: string;
  purchase_order_lines: {
    item_id: string;
    po_id: string;
    items: {
      name: string;
      supplier_id: string;
      suppliers: {
        name: string;
      }[];
    }[];
    purchase_orders: {
      po_number: string;
      supplier_id: string;
      suppliers: {
        name: string;
      }[];
    }[];
  };
}

/**
 * Fetches drum label data for purchase order line
 *
 * @param polId The purchase order line ID
 * @returns Array of drum label data
 */
export async function fetchDrumLabelData(polId: string): Promise<DrumLabelData[]> {
  return await executeServerDbOperation(async (supabase: SupabaseClient) => {
    try {
      // Join the purchase_order_drums, purchase_order_lines, items, suppliers, and purchase_orders tables
      const { data, error } = await supabase
        .schema('inventory')
        .from('purchase_order_drums')
        .select(`
          pod_id,
          serial_number,
          pol_id,
          purchase_order_lines:pol_id!inner (
            item_id,
            po_id,
            items:item_id!inner (
              name
            ),
            purchase_orders:po_id!inner (
              po_number,
              supplier_id,
              suppliers:supplier_id!inner (
                name
              )
            )
          )
        `)
        .eq('pol_id', polId)
        .eq('is_printed', false);

      if (error) {
        console.error('Error fetching drum label data:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Transform the data into the format needed for labels
      return data.map(drum => ({
        serialNumber: drum.serial_number,
        materialName: drum.purchase_order_lines.items.name,
        supplierName: drum.purchase_order_lines.purchase_orders.suppliers.name,
        purchaseOrderId: drum.purchase_order_lines.po_id,
        purchaseOrderLineId: drum.pol_id
      }));
    } catch (error) {
      console.error('Error in fetchDrumLabelData:', error);
      throw error;
    }
  });
}

/**
 * Marks drum labels as printed
 *
 * @param polId The purchase order line ID
 * @returns Success status and count of updated records
 */
export async function markDrumLabelsAsPrinted(polId: string): Promise<{success: boolean, count: number}> {
  return await executeServerDbOperation(async (supabase: SupabaseClient) => {
    try {
      // Update the is_printed status
      const { data, error, count } = await supabase
        .schema('inventory')
        .from('purchase_order_drums')
        .update({ is_printed: true })
        .eq('pol_id', polId)
        .select();

      if (error) {
        console.error('Error marking drum labels as printed:', error);
        throw error;
      }

      return {
        success: true,
        count: count || 0
      };
    } catch (error) {
      console.error('Error in markDrumLabelsAsPrinted:', error);
      return {
        success: false,
        count: 0
      };
    }
  });
}

/**
 * Gets all purchase order lines that need labels generated
 * 
 * @param poId Optional purchase order ID to filter by
 * @returns Array of purchase order lines with pending labels
 */
export async function getPurchaseOrderLinesForLabels(poId?: string): Promise<PurchaseOrderLineForLabel[]> {
  return await executeServerDbOperation(async (supabase: SupabaseClient) => {
    try {
      let query = supabase
        .schema('inventory') // TODO insert first row with serial 18000
        .from('purchase_order_drums')
        .select(`
          pol_id,
          purchase_order_lines!pol_id (
            po_id,
            item_id,
            quantity,
            items!item_id (
              name
            ),
            purchase_orders!po_id (
              po_number,
              supplier_id,
              suppliers!supplier_id (
                name
              )
            )
          )
        `)
        .eq('is_printed', false)
        .limit(1000);

      // Add filter for specific purchase order if provided
      if (poId) {
        query = query.eq('purchase_order_lines.po_id', poId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching purchase order lines for labels:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Group by purchase order line ID to avoid duplicates
      const polMap = new Map<string, PurchaseOrderLineForLabel>();
      
      data.forEach(record => {
        if (!polMap.has(record.pol_id)) {
          polMap.set(record.pol_id, {
            purchaseOrderLineId: record.pol_id,
            purchaseOrderId: record.purchase_order_lines.po_id,
            purchaseOrderNumber: record.purchase_order_lines.purchase_orders.po_number,
            materialName: record.purchase_order_lines.items.name,
            supplierName: record.purchase_order_lines.purchase_orders.suppliers.name,
            quantity: record.purchase_order_lines.quantity,
            pendingLabels: 0
          });
        }
        
        // Increment the count of pending labels
        const item = polMap.get(record.pol_id);
        if (item) {
          item.pendingLabels++;
        }
      });

      return Array.from(polMap.values());
    } catch (error) {
      console.error('Error in getPurchaseOrderLinesForLabels:', error);
      return [];
    }
  });
} 