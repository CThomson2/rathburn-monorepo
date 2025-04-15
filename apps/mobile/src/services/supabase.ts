// services/supabase.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Custom passcode authentication
export const authenticateWithPasscode = async (passcode: string) => {
  // This would typically use Supabase Auth, but for a simple passcode system
  // you might need to use a custom solution with Supabase tables
  const { data, error } = await supabase
    .from("users")
    .select("id, role")
    .eq("passcode", passcode)
    .single();

  if (error || !data) {
    throw new Error("Invalid passcode");
  }

  return data;
};

// Save scan data
export const saveScan = async (scanData: {
  barcode: string;
  timestamp: string;
  userId: string;
  itemType?: string;
}) => {
  return await supabase.from("scans").insert([scanData]);
};

// Get scan history
export const getScanHistory = async (userId: string, limit = 50) => {
  return await supabase
    .from("scans")
    .select("*")
    .eq("userId", userId)
    .order("timestamp", { ascending: false })
    .limit(limit);
};
