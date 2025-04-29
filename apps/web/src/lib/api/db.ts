// lib/api/db.ts
// Supabase client and database operations

import { createClient } from '@supabase/supabase-js';
import { BarcodeData, StoredScanData } from '@/lib/types';
import { config } from '@/lib/api/config';
import { createLogger } from '@/lib/api/utils/logger';

const logger = createLogger('db');

// Create Supabase client with service role key for server-side operations
const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey, {
  auth: {
    persistSession: false,
  },
});

/**
 * Database table names
 */
export const DB_TABLES = {
  LOG_DRUM_SCAN: 'log_drum_scan',
};

/**
 * Insert a new barcode scan into the database
 * @param scanData - The validated scan data to insert
 * @returns The inserted record or null if error
 */
export async function insertBarcodeScan(scanData: BarcodeData): Promise<StoredScanData | null> {
  // Prepare the data for insertion with defaults if needed
  const dataToInsert: BarcodeData = {
    ...scanData,
    scan_timestamp: scanData.scan_timestamp || new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(DB_TABLES.LOG_DRUM_SCAN)
    .insert(dataToInsert)
    .select()
    .single();

  if (error) {
    // Check if this is a unique constraint violation
    if (error.code === '23505') {
      throw new Error(`Duplicate scan_id: ${scanData.scan_id}`);
    }
    
    throw new Error(`Database error: ${error.message}`);
  }

  return data as StoredScanData;
}

/**
 * Check if a barcode scan_id already exists in the database
 * @param scanId - The scan_id to check
 * @returns True if the scan_id exists, false otherwise
 */
export async function checkScanIdExists(scanId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from(DB_TABLES.LOG_DRUM_SCAN)
    .select('scan_id')
    .eq('scan_id', scanId)
    .maybeSingle();

  if (error) {
    throw new Error(`Database error checking scan_id: ${error.message}`);
  }

  return !!data;
}

/**
 * Get a barcode scan by scan_id
 * @param scanId - The scan_id to retrieve
 * @returns The scan data or null if not found
 */
export async function getScanById(scanId: string): Promise<StoredScanData | null> {
  const { data, error } = await supabase
    .from(DB_TABLES.LOG_DRUM_SCAN)
    .select('*')
    .eq('scan_id', scanId)
    .maybeSingle();

  if (error) {
    throw new Error(`Database error retrieving scan: ${error.message}`);
  }

  return data as StoredScanData | null;
}