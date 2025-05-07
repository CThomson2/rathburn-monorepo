"use server";

import { executeServerDbOperation } from "@/lib/database";
import { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";

interface DrumLabelData {
  serialNumber: string;
  materialName: string;
  supplierName: string;
  purchaseOrderId: string;
  purchaseOrderLineId: string;
  unitWeight: number;
}

interface PurchaseOrderLineForLabel {
  purchaseOrderLineId: string;
  purchaseOrderId: string;
  purchaseOrderNumber: string;
  materialName: string;
  supplierName: string;
  quantity: number;
  unitWeight: number;
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
    unit_weight: number;
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
  console.log(
    `[DB] Fetching drum label data for purchase order line: ${polId}`
  );
  return await executeServerDbOperation(async (supabase: SupabaseClient) => {
    try {
      // Join the purchase_order_drums, purchase_order_lines, items, suppliers, and purchase_orders tables
      console.log(
        `[DB] Executing query to fetch drum labels for POL: ${polId}`
      );
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
            unit_weight,
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
        console.error("[DB] Error fetching drum label data:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log(`[DB] No unprinted drum labels found for POL: ${polId}`);
        return [];
      }

      console.log(`[DB] Found ${data.length} drum labels for POL: ${polId}`);
      console.log(data);

      // Transform the data into the format needed for labels
      return data.map((drum) => ({
        serialNumber: drum.serial_number,
        materialName: drum.purchase_order_lines.items.name,
        supplierName:
          drum.purchase_order_lines.purchase_orders.suppliers.name,
        purchaseOrderId: drum.purchase_order_lines.po_id,
        purchaseOrderLineId: drum.pol_id,
        unitWeight: drum.purchase_order_lines.unit_weight,
      }));
    } catch (error) {
      console.error("[DB] Error in fetchDrumLabelData:", error);
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
  console.log(`[DB] Marking drum labels as printed for POL: ${polId}`);
  return await executeServerDbOperation(async (supabase: SupabaseClient) => {
    try {
      // Update the is_printed status
      console.log(
        `[DB] Executing update query to mark drums as printed for POL: ${polId}`
      );
      const { error, count } = await supabase
        .schema("inventory")
        .from("purchase_order_drums")
        .update({ is_printed: true })
        .eq("pol_id", polId);

      if (error) {
        console.error("[DB] Error marking drum labels as printed:", error);
        throw error;
      }

      console.log(
        `[DB] Successfully marked ${count} drum labels as printed for POL: ${polId}`
      );
      return {
        success: true,
        count: count || 0,
      };
    } catch (error) {
      console.error("[DB] Error in markDrumLabelsAsPrinted:", error);
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
            unit_weight,
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
              unitWeight: pol.unit_weight,
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

/**
 * Finds an existing drum label PDF file for a purchase order line
 * 
 * @param polId The purchase order line ID
 * @returns Buffer containing the PDF file and filename if found, null otherwise
 */
export async function findExistingDrumLabelPdf(
  polId: string
): Promise<{ buffer: Buffer; filename: string } | null> {
  console.log("[LABEL] Finding existing drum label PDF for polId:", polId);
  return await executeServerDbOperation(async (supabase: SupabaseClient) => {
    try {
      // Get the first serial number for this POL to construct the filename
      console.log("[LABEL] Querying for first drum serial number");
      const { data: firstDrumData, error } = await supabase
        .schema("inventory")
        .from("purchase_order_drums")
        .select("serial_number")
        .eq("pol_id", polId)
        .order("serial_number", { ascending: true })
        .limit(1)
        .single();

      if (error || !firstDrumData?.serial_number) {
        console.log("[LABEL] No serial number found or error:", error);
        return null;
      }

      const serialPrefix = firstDrumData.serial_number;
      console.log("[LABEL] Found serial prefix:", serialPrefix);
      
      // Look for existing PDF in the public directory
      const labelsDir = path.join(process.cwd(), "public", "labels");
      console.log("[LABEL] Looking for PDF in directory:", labelsDir);
      
      // Ensure directory exists to avoid errors
      if (!fs.existsSync(labelsDir)) {
        console.log("[LABEL] Labels directory does not exist");
        return null;
      }
      
      const files = fs.readdirSync(labelsDir);
      console.log("[LABEL] Found files in directory:", files.length);

      // Find file starting with DR_ followed by the serial number
      const existingFile = files.find(
        (file) =>
          file.startsWith(`DR_${serialPrefix}`) && file.endsWith(".pdf")
      );

      if (existingFile) {
        console.log("[LABEL] Found existing file:", existingFile);
        // Return the existing file buffer and filename
        const filePath = path.join(labelsDir, existingFile);
        const fileBuffer = fs.readFileSync(filePath);
        console.log("[LABEL] Successfully read file buffer, size:", fileBuffer.length);
        return {
          buffer: fileBuffer,
          filename: existingFile
        };
      }
      
      console.log("[LABEL] No existing file found for serial prefix:", serialPrefix);
      return null;
    } catch (error) {
      console.error("Error finding existing drum label PDF:", error);
      return null;
    }
  });
}
