import { supabase } from '../lib/supabase';

// Interface for the stock count record
interface StockCountRecord {
  id?: string;
  supplier_id: string;
  material_id: string;
  quantity: number;
  created_at?: string;
  updated_at?: string;
}

// Current supplier context
let currentSupplierContext: string | null = null;

/**
 * Set the current supplier context
 * @param supplierId - UUID of the supplier
 */
export const setSupplierContext = (supplierId: string) => {
  currentSupplierContext = supplierId;
  return { success: true, supplierId };
};

/**
 * Get the current supplier context
 * @returns The current supplier ID or null if not set
 */
export const getSupplierContext = () => {
  return currentSupplierContext;
};

/**
 * Clear the current supplier context
 */
export const clearSupplierContext = () => {
  currentSupplierContext = null;
  return { success: true };
};

/**
 * Process a barcode scan
 * @param barcode - The scanned barcode value
 * @returns Result object with status and data
 */
export const processBarcodeScan = async (barcode: string) => {
  try {
    // Check if this is a supplier or material barcode
    const { data: supplierData } = await supabase
      .from('inventory.suppliers')
      .select('supplier_id, name')
      .eq('supplier_id', barcode)
      .single();

    if (supplierData) {
      // This is a supplier barcode, set context
      setSupplierContext(supplierData.supplier_id);
      return {
        success: true,
        type: 'supplier',
        data: supplierData,
        message: `Supplier context set to: ${supplierData.name}`
      };
    }

    // Check if this is a material barcode
    const { data: materialData } = await supabase
      .from('inventory.materials')
      .select('material_id, name, code')
      .eq('material_id', barcode)
      .single();

    if (materialData) {
      // This is a material barcode, increment count
      // First, check if we have a supplier context
      if (!currentSupplierContext) {
        return {
          success: false,
          type: 'error',
          message: 'No supplier context set. Please scan a supplier barcode first.'
        };
      }

      // Increment the count for this supplier/material combo
      const { data, error } = await supabase.rpc('increment_stock_count', {
        p_supplier_id: currentSupplierContext,
        p_material_id: materialData.material_id
      });

      if (error) {
        console.error('Error incrementing stock count:', error);
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
          supplier_id: currentSupplierContext,
          new_quantity: data
        },
        message: `Recorded 1 unit of ${materialData.name} (${materialData.code})`
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
 */
export const getStockCountData = async (filters?: {
  supplier_id?: string;
  material_id?: string;
}) => {
  try {
    let query = supabase
      .from('stock_count')
      .select(`
        id,
        supplier_id,
        material_id,
        quantity,
        created_at,
        updated_at,
        inventory.suppliers!supplier_id (name),
        inventory.materials!material_id (name, code, chemical_group)
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