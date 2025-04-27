"use server"

import { executeServerDbOperation } from "@/lib/database";
import { SupabaseClient } from "@supabase/supabase-js";
import { OrdersView, OrderStatus } from "@/features/orders/types";
import { formatDate } from "@/utils/format-date";
import { revalidatePath } from "next/cache";

/** 
 * Fetches all raw material purchase orders and constituent order line item details
 * 
 * @returns {Promise<OrdersView[]>} Array of purchase orders with line item details
 */
export async function fetchOrders(): Promise<OrdersView[]> {
  return await executeServerDbOperation(async (supabase: SupabaseClient) => {
    const { data: orders, error } = await supabase
        .from('v_goods_in')
        .select('*');

    if (error) {
        console.error('Error fetching orders:', error);
        return [];
    }
    return orders.map((order) => ({
        ...order,
        date_ordered: formatDate(order.order_date),
        status: order.status as OrderStatus,
        eta: order.eta_date ? formatDate(order.eta_date) : undefined,
    }));
  });
}

/**
 * Types for order form data
 */
interface OrderMaterial {
  materialId: string;
  quantity: number;
  weight?: number;
}

interface OrderData {
  poNumber: string;
  supplierId: string;
  orderDate: string;
  etaDate?: string;
  materials: OrderMaterial[];
}

/**
 * Handles inserting new purchase orders into the database
 * 
 * @param formData - The form data containing order details
 * @returns {Promise<{success: boolean, message?: string, orderId?: string}>} Result of order creation
 */
export async function createOrder(formData: FormData): Promise<{success: boolean, message?: string, orderId?: string}> {
  return await executeServerDbOperation(async (supabase: SupabaseClient) => {
    try {
      // Parse form data
      const poNumber = formData.get('poNumber') as string;
      const supplierId = formData.get('supplier') as string;
      const orderDate = formData.get('orderDate') as string;
      const etaDate = formData.get('etaDate') as string || null;
      
      // Count how many materials are in the form by looking for material names
      const materialEntries = Array.from(formData.entries())
        .filter(([key]) => key.startsWith('material') && key.includes('name'))
        .map(([key]) => {
          // Extract index from key name (e.g., "material-1-name" -> "1")
          const index = key.split('-')[1];
          return index;
        });
        
      // Create materials array
      const materials: OrderMaterial[] = [];
      
      for (const index of materialEntries) {
        const materialId = formData.get(`material-${index}-id`) as string;
        const quantity = parseInt(formData.get(`material-${index}-quantity`) as string, 10);
        
        // Weight is optional
        const weightStr = formData.get(`material-${index}-weight`) as string;
        const weight = weightStr ? parseFloat(weightStr) : undefined;
        
        if (materialId && !isNaN(quantity) && quantity > 0) {
          materials.push({
            materialId,
            quantity,
            weight
          });
        }
      }
      
      // Validate required fields
      if (!poNumber || !supplierId || !orderDate || materials.length === 0) {
        return {
          success: false, 
          message: 'Missing required fields for order creation'
        };
      }
      
      // Start a transaction
      const { data: orderData, error: orderError } = await supabase
        .schema('inventory')
        .from('purchase_orders')
        .insert({
          po_number: poNumber,
          supplier_id: supplierId,
          order_date: orderDate,
          eta_date: etaDate,
          status: 'pending'
        })
        .select('po_id')
        .single();
      
      if (orderError) {
        console.error('Error creating order:', orderError);
        return {
          success: false, 
          message: `Failed to create order: ${orderError.message}`
        };
      }
      
      // Insert order lines
      const orderLines = materials.map(material => ({
        po_id: orderData.po_id,
        item_id: material.materialId,
        quantity: material.quantity
      }));
      
      const { error: linesError } = await supabase
        .schema('inventory')
        .from('purchase_order_lines')
        .insert(orderLines);
      
      if (linesError) {
        console.error('Error creating order lines:', linesError);
        return {
          success: false, 
          message: `Order created but failed to add materials: ${linesError.message}`
        };
      }
      
      // Revalidate the orders page to show the new order
      revalidatePath('/orders');
      
      return {
        success: true,
        orderId: orderData.po_id
      };
    } catch (error) {
      console.error('Error in createOrder:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  });
}