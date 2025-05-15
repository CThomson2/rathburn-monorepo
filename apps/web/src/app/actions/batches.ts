'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Type definition for the data expected from v_batches_with_drums view
export interface BatchDataFromView {
  batch_id: string;
  batch_code: string | null;
  item_name: string | null; // This might be the product name if different from material_name
  material_name: string | null; // The actual chemical/material name
  supplier_name: string | null;
  total_volume: number | null;
  batch_type: string | null; // e.g., 'New', 'Repro'
  created_at: string; // Timestamp of batch creation
  drum_count: number | null; // Total number of drums associated with the batch
  drums_in_stock: number | null; // Number of drums from this batch currently in stock
  // Add other relevant fields from v_batches_with_drums as needed for display
  // Example: po_number, chemical_group, etc.
}

export async function fetchActiveBatches(): Promise<BatchDataFromView[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('v_batches_with_drums') // This view is in the public schema by default
    .select('*')
    .gt('total_volume', 0) // Filter for total_volume > 0
    .order('created_at', { ascending: false }); // Optional: order by creation date

  if (error) {
    console.error('Error fetching active batches:', error);
    return [];
  }

  return data as BatchDataFromView[];
}

// Server action to fetch drum serial numbers for a specific batch_id
export async function fetchDrumSerialsByBatchId(batchId: string): Promise<Array<{ serial_number: string }>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .schema('inventory') // Assuming drums table is in 'inventory' schema
    .from('drums')
    .select('serial_number')
    .eq('batch_id', batchId);

  if (error) {
    console.error(`Error fetching drum serials for batch ${batchId}:`, error);
    return [];
  }
  return data || [];
} 