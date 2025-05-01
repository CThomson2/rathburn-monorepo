import { createClient } from '../lib/supabase/client';

// Interface for the stock count record
interface StockCountRecord {
  id?: string;
  supplier_id: string;
  material_id: string;
  quantity: number;
  created_at?: string;
  updated_at?: string;
}

// Define return types for better type safety
interface StockCountResult<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  type?: string;
  error?: string;
}

// Store current supplier context in localStorage to persist across app reloads
const SUPPLIER_CONTEXT_KEY = 'current_supplier_context';

/**
 * Set the current supplier context
 * @param supplierId - UUID of the supplier
 * @param supplierName - Name of the supplier for display purposes
 */
export const setSupplierContext = (supplierId: string, supplierName: string) => {
  try {
    localStorage.setItem(SUPPLIER_CONTEXT_KEY, JSON.stringify({
      id: supplierId,
      name: supplierName,
      timestamp: new Date().toISOString()
    }));
    
    return { 
      success: true, 
      supplierId,
      supplierName
    };
  } catch (error) {
    console.error('Error setting supplier context:', error);
    return { 
      success: false, 
      error: 'Failed to store supplier context'
    };
  }
};

/**
 * Get the current supplier context
 * @returns The current supplier context object or null if not set
 */
export const getSupplierContext = () => {
  try {
    const contextStr = localStorage.getItem(SUPPLIER_CONTEXT_KEY);
    if (!contextStr) return null;
    
    return JSON.parse(contextStr);
  } catch (error) {
    console.error('Error getting supplier context:', error);
    return null;
  }
};

/**
 * Clear the current supplier context
 */
export const clearSupplierContext = () => {
  try {
    localStorage.removeItem(SUPPLIER_CONTEXT_KEY);
    return { success: true };
  } catch (error) {
    console.error('Error clearing supplier context:', error);
    return { 
      success: false, 
      error: 'Failed to clear supplier context'
    };
  }
};

/**
 * Process a barcode scan
 * @param barcode - The scanned barcode value
 * @returns Result object with status and data
 */
export const processBarcodeScan = async (barcode: string): Promise<StockCountResult> => {
  try {
    const supabase = createClient();
    // Handle shortened UUIDs (10 chars) or full UUIDs
    const isShortUUID = barcode.length === 10;
    
    // Use type assertion to bypass type checking since we know the actual schema
    const client = supabase as any;
    
    // Check if this is a supplier or material barcode
    let supplierData;
    
    if (isShortUUID) {
      // Using "like" query for shortened UUIDs
      const { data, error } = await client
        .from('suppliers')
        .select('supplier_id, name')
        .like('supplier_id', `${barcode}%`)
        .limit(1);
      
      supplierData = data && data.length > 0 ? data[0] : null;
    } else {
      // Direct equality for full UUIDs
      const { data, error } = await client
        .from('suppliers')
        .select('supplier_id, name')
        .eq('supplier_id', barcode)
        .single();
      
      supplierData = data;
    }

    if (supplierData) {
      // This is a supplier barcode, set context
      const result = setSupplierContext(supplierData.supplier_id, supplierData.name);
      
      return {
        success: result.success,
        type: 'supplier',
        data: supplierData,
        message: result.success 
          ? `Supplier context set to: ${supplierData.name}`
          : 'Failed to set supplier context'
      };
    }

    // Check if this is a material barcode
    let materialData;
    
    if (isShortUUID) {
      // Using "like" query for shortened UUIDs
      const { data, error } = await client
        .from('materials')
        .select('material_id, name, code')
        .like('material_id', `${barcode}%`)
        .limit(1);
      
      materialData = data && data.length > 0 ? data[0] : null;
    } else {
      // Direct equality for full UUIDs
      const { data, error } = await client
        .from('materials')
        .select('material_id, name, code')
        .eq('material_id', barcode)
        .single();
      
      materialData = data;
    }

    if (materialData) {
      // This is a material barcode, increment count
      // First, check if we have a supplier context
      const currentContext = getSupplierContext();
      if (!currentContext || !currentContext.id) {
        return {
          success: false,
          type: 'error',
          message: 'No supplier context set. Please scan a supplier barcode first.'
        };
      }

      // Perform the upsert operation directly since we might not have RPC access
      // First check if a record exists
      const { data: existingRecord, error: checkError } = await client
        .from('stock_count')
        .select('id, quantity')
        .eq('supplier_id', currentContext.id)
        .eq('material_id', materialData.material_id)
        .maybeSingle();

      let newQuantity;
      let error;

      if (existingRecord) {
        // Update existing record
        newQuantity = (existingRecord.quantity || 0) + 1;
        const { error: updateError } = await client
          .from('stock_count')
          .update({ 
            quantity: newQuantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRecord.id);
          
        error = updateError;
      } else {
        // Create new record
        newQuantity = 1;
        const { error: insertError } = await client
          .from('stock_count')
          .insert({
            supplier_id: currentContext.id,
            material_id: materialData.material_id,
            quantity: newQuantity
          });
          
        error = insertError;
      }

      if (error) {
        console.error('Error recording stock count:', error);
        return {
          success: false,
          type: 'error',
          message: `Error recording count: ${error.message}`
        };
      }

      return {
        success: true,
        type: 'material',
        data: {
          ...materialData,
          supplier_id: currentContext.id,
          supplier_name: currentContext.name,
          new_quantity: newQuantity
        },
        message: `Recorded 1 unit of ${materialData.name} (${materialData.code}), total: ${newQuantity}`
      };
    }

    // If we got here, the barcode doesn't match any known supplier or material
    return {
      success: false,
      type: 'unknown',
      message: 'Unknown barcode. Please try again or contact support.'
    };
  } catch (error) {
    console.error('Error processing barcode:', error);
    return {
      success: false,
      type: 'error',
      message: `Error processing barcode: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

/**
 * Get current stock count data
 * @param filters Optional filters to apply
 * @returns Promise with stock count data or error message
 */
export const getStockCountData = async (filters?: {
  supplier_id?: string;
  material_id?: string;
}): Promise<StockCountResult<any[]>> => {
  try {
    const supabase = createClient();
    // Use type assertion to bypass type checking
    const client = supabase as any;
    
    let query = client
      .from('stock_count')
      .select(`
        id,
        supplier_id,
        material_id,
        quantity,
        created_at,
        updated_at,
        suppliers:supplier_id(name),
        materials:material_id(name, code, chemical_group)
      `);

    // Apply filters if provided
    if (filters?.supplier_id) {
      query = query.eq('supplier_id', filters.supplier_id);
    }
    if (filters?.material_id) {
      query = query.eq('material_id', filters.material_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching stock count data:', error);
      return {
        success: false,
        message: `Error fetching data: ${error.message}`
      };
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error in getStockCountData:', error);
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}; 