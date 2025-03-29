import { createClient } from "@supabase/supabase-js";

// Debug environment variables
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Supabase Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for the stock_orders table
export interface StockOrder {
  id: number;
  po_number: string;
  date_ordered: string;
  supplier_id: number;
  eta: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
