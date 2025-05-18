/**
 * Represents a batch of raw materials in the inventory
 */
export interface Batch {
  batch_id: string;
  batch_type: string;
  item_name: string;
  material_name: string;
  chemical_group: string;
  supplier_name: string | null;
  qty_drums: number;
  created_at: string;
  updated_at: string;
  po_number: string | null;
  input_recorded_at: string | null;
  batch_code: string | null;
  drum_count: number;
  drums_in_stock: number;
}

/**
 * Filter options for batches
 */
export interface BatchFilters {
  search?: string;
  batchType?: string;
  chemicalGroup?: string;
  dateFrom?: string;
  dateTo?: string;
} 