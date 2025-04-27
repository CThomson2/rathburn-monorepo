"use server"

import { executeServerDbOperation } from "@/lib/database";
import { SupabaseClient } from "@supabase/supabase-js";
import { OrdersView, OrderStatus } from "@/features/orders/types";
import { formatDate, formatDateYYYYMMDD } from "@/utils/format-date";
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
        material: order.item,
        date_ordered: formatDate(order.order_date),
        status: order.status as OrderStatus,
        eta: order.eta_date ? formatDate(order.eta_date) : undefined,
    }));
  });
}

/**
 * Fetches all materials for dropdown selection
 * Returns a simplified list of materials with id and name
 */
export async function fetchItems(): Promise<Array<{id: string, name: string}>> {
  return await executeServerDbOperation(async (supabase: SupabaseClient) => {
    const { data, error } = await supabase
      .schema('inventory')
      .from('materials')
      .select('material_id, name')
      .order('name');
    
    if (error) {
      console.error('Error fetching materials:', error);
      return [];
    }
    
    return data.map(material => ({
      id: material.material_id.toString(),
      name: material.name
    }));
  });
}

/**
 * Searches materials with a prefix filter
 * Much faster than a full text search for autocomplete purposes
 */
export async function searchItems(prefix: string): Promise<Array<{id: string, name: string}>> {
  // If empty prefix, return first 10 materials alphabetically
  if (!prefix.trim()) {
    return await executeServerDbOperation(async (supabase: SupabaseClient) => {
      const { data, error } = await supabase
        .schema('inventory')
        .from('materials')
        .select('material_id, name')
        .order('name')
        .limit(10);
      
      if (error) {
        console.error('Error fetching materials:', error);
        return [];
      }
      
      return data.map(material => ({
        id: material.material_id.toString(),
        name: material.name
      }));
    });
  }
  
  // Otherwise search with prefix
  return await executeServerDbOperation(async (supabase: SupabaseClient) => {
    const { data, error } = await supabase
      .schema('inventory')
      .from('materials')
      .select('material_id, name')
      .ilike('name', `${prefix}%`) 
      .order('name')
      .limit(10);
    
    if (error) {
      console.error('Error searching materials:', error);
      return [];
    }
    
    return data.map(material => ({
      id: material.material_id.toString(),
      name: material.name
    }));
  });
}

/**
 * Fetches items (supplier-specific materials) for a specific supplier
 * Returns a list of items with id and name
 */
export async function fetchItemsBySupplier(supplierId: string): Promise<Array<{id: string, name: string}>> {
  if (!supplierId) {
    return [];
  }
  
  return await executeServerDbOperation(async (supabase: SupabaseClient) => {
    const { data, error } = await supabase
      .schema('inventory')
      .from('items')
      .select('item_id, name, material_id')
      .eq('supplier_id', supplierId)
      .order('name');
    
    if (error) {
      console.error('Error fetching items by supplier:', error);
      return [];
    }
    
    return data.map(item => ({
      id: item.item_id,
      name: item.name,
      materialId: item.material_id
    }));
  });
}

/**
 * Searches items (supplier-specific materials) for a specific supplier with a prefix filter
 * Returns a filtered list of items with id and name
 */
export async function searchItemsBySupplier(supplierId: string, prefix: string): Promise<Array<{id: string, name: string, materialId: string}>> {
  if (!supplierId) {
    return [];
  }
  
  // If empty prefix, return first 10 items for this supplier
  if (!prefix.trim()) {
    return await executeServerDbOperation(async (supabase: SupabaseClient) => {
      const { data, error } = await supabase
        .schema('inventory')
        .from('items')
        .select('item_id, name, material_id')
        .eq('supplier_id', supplierId)
        .order('name')
        .limit(10);
      
      if (error) {
        console.error('Error fetching items by supplier:', error);
        return [];
      }
      
      return data.map(item => ({
        id: item.item_id,
        name: item.name,
        materialId: item.material_id
      }));
    });
  }
  
  // Otherwise search with prefix
  return await executeServerDbOperation(async (supabase: SupabaseClient) => {
    const { data, error } = await supabase
      .schema('inventory')
      .from('items')
      .select('item_id, name, material_id')
      .eq('supplier_id', supplierId)
      .ilike('name', `${prefix}%`)
      .order('name')
      .limit(10);
    
    if (error) {
      console.error('Error searching items by supplier:', error);
      return [];
    }
    
    return data.map(item => ({
      id: item.item_id,
      name: item.name,
      materialId: item.material_id
    }));
  });
}

/**
 * Fetches all suppliers for dropdown selection
 * Returns a simplified list of suppliers with id and name
 */
export async function fetchSuppliers(): Promise<Array<{id: string, name: string}>> {
  return await executeServerDbOperation(async (supabase: SupabaseClient) => {
    const { data, error } = await supabase
      .schema('inventory')  
      .from('suppliers')
      .select('supplier_id, name')
      .order('name');
    
    if (error) {
      console.error('Error fetching suppliers:', error);
      return [];
    }
    
    return data.map(supplier => ({
      id: supplier.supplier_id.toString(),
      name: supplier.name
    }));
  });
}

/**
 * Searches suppliers with a prefix filter
 * Much faster than a full text search for autocomplete purposes
 */
export async function searchSuppliers(prefix: string): Promise<Array<{id: string, name: string}>> {
  // If empty prefix, return first 10 suppliers alphabetically
  if (!prefix.trim()) {
    return await executeServerDbOperation(async (supabase: SupabaseClient) => {
      const { data, error } = await supabase
        .schema('inventory')  
        .from('suppliers')
        .select('supplier_id, name')
        .order('name')
        .limit(10);
      
      if (error) {
        console.error('Error fetching suppliers:', error);
        return [];
      }
      
      return data.map(supplier => ({
        id: supplier.supplier_id.toString(),
        name: supplier.name
      }));
    });
  }
  
  // Otherwise search with prefix
  return await executeServerDbOperation(async (supabase: SupabaseClient) => {
    const { data, error } = await supabase
      .schema('inventory')  
      .from('suppliers')
      .select('supplier_id, name')
      .ilike('name', `${prefix}%`)
      .order('name')
      .limit(10);
    
    if (error) {
      console.error('Error searching suppliers:', error);
      return [];
    }
    
    return data.map(supplier => ({
      id: supplier.supplier_id.toString(),
      name: supplier.name
    }));
  });
}

/**
 * Types for order form data
 */
interface OrderMaterial {
  itemId: string;
  quantity: number;
  weight?: number;
}

interface OrderData {
  poNumber: string;
  supplierId: string;
  orderDate: string;
  etaDate?: string;
  items: OrderMaterial[];
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
      const itemEntries = Array.from(formData.entries())
        .filter(([key]) => key.startsWith('material') && key.includes('name'))
        .map(([key]) => {
          // Extract index from key name (e.g., "material-1-name" -> "1")
          const index = key.split('-')[1];
          return index;
        });
        
      // Create items array
      const items: OrderMaterial[] = [];
      
      for (const index of itemEntries) {
        const itemId = formData.get(`material-${index}-id`) as string;
        const quantity = parseInt(formData.get(`material-${index}-quantity`) as string, 10);
        
        // Weight is optional
        const weightStr = formData.get(`material-${index}-weight`) as string;
        const weight = weightStr ? parseFloat(weightStr) : undefined;
        
        if (itemId && !isNaN(quantity) && quantity > 0) {
          items.push({
            itemId,
            quantity,
            weight
          });
        }
      }
      
      // Validate required fields
      if (!poNumber || !supplierId || !orderDate || items.length === 0) {
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
      const orderLines = items.map(item => ({
        po_id: orderData.po_id,
        item_id: item.itemId,
        quantity: item.quantity
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

export async function getNextPONumber(date: Date = new Date()) {
  try {
    return executeServerDbOperation(async (supabase: SupabaseClient) => {
      // Get today's date in YYYY-MM-DD format for database query
      const dateFormatted = formatDateYYYYMMDD(date); // yyyy-mm-dd
      
      // Query orders made today
      const startOfDay = `${dateFormatted}T00:00:00.000Z`;
      const endOfDay = `${dateFormatted}T23:59:59.999Z`;
      
      const { count, error } = await supabase
        .from('purchase_orders')
        .select('*', { count: 'exact', head: true })
        .gte('date_ordered', startOfDay)
        .lte('date_ordered', endOfDay);
      
      if (error) {
        throw error;
      }
      
      // Use count to determine letter (A, B, C)
      const todayOrdersCount = count || 0;
      const letterMap = ["A", "B", "C", "D", "E"];
      const orderLetter = letterMap[todayOrdersCount] || "X";
      
      // Generate PO number in format YY-MM-DD-A-RS
      return `${dateFormatted}${orderLetter}RS`; // TODO: Add manager initials as active user
      
    });
  } catch (error) {
    console.error('Error in getNextPONumber:', error);
    return null;
  }
}
