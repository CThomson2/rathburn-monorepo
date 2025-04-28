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

interface PurchaseOrderDrumRecord {
  pod_id: string;
  serial_number: string;
  pol_id: string;
  purchase_order_lines: {
    po_id: string;
    item_id: string;
    quantity: number;
    items: Array<{
      name: string;
    }>;
    purchase_orders: {
      po_number: string;
      suppliers: Array<{
        name: string;
      }>;
    };
  };
}

/**
 * Fetches drum label data for purchase order line
 *
 * @param polId The purchase order line ID
 * @returns Array of drum label data
 */
export async function fetchDrumLabelData(
  polId: string
): Promise<DrumLabelData[]> {
  return await executeServerDbOperation(async (supabase: SupabaseClient) => {
    try {
      // Join the purchase_order_drums, purchase_order_lines, items, suppliers, and purchase_orders tables
      const { data, error } = await supabase
        .schema("inventory")
        .from("purchase_order_drums")
        .select(
          `
          pod_id,
          serial_number,
          pol_id,
          purchase_order_lines:pol_id!inner (
            item_id,
            po_id,
            items!inner (
              name
            ),
            purchase_orders!inner (
              po_number,
              suppliers!inner (
                name
              )
            )
          )
        `
        )
        .eq("pol_id", polId)
        .eq("is_printed", false);

      if (error) {
        console.error("Error fetching drum label data:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Transform the data into the format needed for labels
      return data.map((drum) => ({
        serialNumber: drum.serial_number,
        materialName: drum.purchase_order_lines[0]?.items[0]?.name,
        supplierName: drum.purchase_order_lines[0]?.purchase_orders[0]?.suppliers[0]?.name,
        purchaseOrderId: drum.purchase_order_lines[0]?.po_id,
        purchaseOrderLineId: drum.pol_id,
      }));
    } catch (error) {
      console.error("Error in fetchDrumLabelData:", error);
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
export async function markDrumLabelsAsPrinted(
  polId: string
): Promise<{ success: boolean; count: number }> {
  return await executeServerDbOperation(async (supabase: SupabaseClient) => {
    try {
      // Update the is_printed status
      const { data, error, count } = await supabase
        .schema("inventory")
        .from("purchase_order_drums")
        .update({ is_printed: true })
        .eq("pol_id", polId)
        .select();

      if (error) {
        console.error("Error marking drum labels as printed:", error);
        throw error;
      }

      return {
        success: true,
        count: count || 0,
      };
    } catch (error) {
      console.error("Error in markDrumLabelsAsPrinted:", error);
      return {
        success: false,
        count: 0,
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
export async function getPurchaseOrderLinesForLabels(
  poId: string
): Promise<PurchaseOrderLineForLabel[]> {
  return await executeServerDbOperation(async (supabase: SupabaseClient) => {
    try {
      const { data, error } = await supabase
        .schema("inventory")
        .from("purchase_order_drums")
        .select(
          `
          pod_id,
          serial_number,
          pol_id,
          purchase_order_lines!inner (
            po_id,
            item_id,
            quantity,
            items!inner (
              name
            ),
            purchase_orders!inner (
              po_number,
              suppliers!inner (
                name
              )
            )
          )
        `
        )
        .eq("is_printed", false)
        .eq("purchase_order_lines.po_id", poId)
        .limit(1000);

      if (error) {
        console.error("Error fetching purchase order lines for labels:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      console.log("[DB] purchase order lines data");
      console.log(data);

      // Group by purchase order line ID to avoid duplicates
      const polMap = new Map<string, PurchaseOrderLineForLabel>();

      const records = data as unknown as PurchaseOrderDrumRecord[];
      records.forEach((record) => {
        console.log("[DB] record");
        console.log(record);
        const pol = record.purchase_order_lines;
        if (!polMap.has(record.pol_id) && pol) {
          const supplier = pol.purchase_orders.suppliers;
          const item = pol.items;
          console.log("[DB] supplier");
          console.log(supplier);
          console.log("[DB] item");
          console.log(item);

          if (supplier && item) {
            polMap.set(record.pol_id, {
              purchaseOrderLineId: record.pol_id,
              purchaseOrderId: pol.po_id,
              purchaseOrderNumber: pol.purchase_orders.po_number,
              // @ts-expect-error - item is not an array, but a single object due to many-to-one relationship
              materialName: (<{ name: string }>item).name,
              // @ts-expect-error - supplier is not an array, but a single object due to many-to-one relationship
              supplierName: (<{ name: string }>supplier).name,
              quantity: pol.quantity,
              pendingLabels: 0,
            });
          }
        }

        console.log(`[DB] polMap item ${record.pol_id}`);
        console.log(polMap.get(record.pol_id));

        // Increment the count of pending labels
        const mapItem = polMap.get(record.pol_id);
        if (mapItem) {
          mapItem.pendingLabels++;
        }
      });

      console.log("[DB] polMap");
      console.log(Array.from(polMap.values()));

      return Array.from(polMap.values());
    } catch (error) {
      console.error("Error in getPurchaseOrderLinesForLabels:", error);
      return [];
    }
  });
}
