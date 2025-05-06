import { createClient, createServiceClient } from "@/lib/supabase/server";
import { Lamp } from "@/components/lamp-view";
import { RealtimeFeedCentered } from "@/components/realtime-feed-centered";

// Interface for the view data
interface StocktakeScanFeedDetail {
  id: string;
  stocktake_session_id: string;
  scanned_at: string;
  created_at: string;
  raw_barcode: string;
  barcode_type: "material" | "supplier" | "unknown" | "error";
  status: "success" | "error" | "ignored";
  error_message?: string | null;
  user_id: string;
  device_id?: string | null;
  material_id?: string | null;
  material_name?: string | null;
  supplier_id?: string | null;
  supplier_name?: string | null;
  associated_supplier_name_for_material?: string | null;
}

export default async function Index() {
  // Create the Supabase client
  const supabase = createServiceClient();

  // Fetch initial scans for the feed
  const { data: initialScans, error } = await supabase
    .from("stocktake_scans_feed_details")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  // Get Supabase URL and anon key for client-side component
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  return (
    <div className="container mx-auto py-6">
      <Lamp>
        <RealtimeFeedCentered
          apiUrl={supabaseUrl}
          apiKey={supabaseAnonKey}
          initialScans={initialScans || []}
        />
      </Lamp>
    </div>
  );
}
