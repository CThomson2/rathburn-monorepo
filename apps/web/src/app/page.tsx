import { createClient, createServiceClient } from "@/lib/supabase/server";
import { Lamp } from "@/components/layout/lamp-view";
import { RealtimeFeedCentered } from "@/components/realtime/centered-feed";
import { Database, Json } from "@/types/supabase";

// Updated interface to match public.session_scans
interface SessionScanData {
  id: string;
  session_id: string | null;
  scanned_at: string;
  created_at: string;
  raw_barcode: string;
  scan_status: "success" | "error" | "ignored";
  scan_action: "check_in" | "transport" | "process" | "context" | "cancel";
  error_message?: string | null;
  user_id?: string | null;
  user_email?: string | null; // For display, might need a join
  device_id?: string | null;
  pol_id?: string | null;
  pod_id?: string | null;
  item_name?: string | null;
  cancelled_scan_id?: string | null;
  metadata?: Json | null;
}

export default async function Index() {
  const supabase = createServiceClient();

  // Fetch initial scans from the new public.session_scans table
  const { data: initialScans, error } = await supabase
    .from("session_scans") // UPDATED table name
    .select("*, user_profiles(email)") // Example of joining user_profiles if you have it and want email
    // If user_profiles table is not set up or desired, use .select("*")
    .order("created_at", { ascending: false })
    .limit(20); // Fetch a bit more for the sidebar initially

  if (error) {
    console.error("Error fetching initial session scans:", error);
    // Handle error appropriately, maybe pass an empty array or an error state
  }

  // Transform data if necessary to match the expected structure for RealtimeFeedCentered
  // or RealtimeScanLogSidebar. For now, assuming direct compatibility or minor adjustments.
  const typedInitialScans: SessionScanData[] =
    initialScans?.map((scan) => ({
      ...(scan as any), // Cast to any to handle potential joined fields like user_profiles
      user_email: (scan as any).user_profiles?.email || null,
    })) || [];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  return (
    <div className="container mx-auto py-6">
      <Lamp>
        {/* 
          The RealtimeFeedCentered component was for the previous feed. 
          The new RealtimeScanLogSidebar will be part of DashboardLayout.
          This page.tsx might display other content or a different view of scans.
          For now, I'll keep it, but its role might change.
        */}
        <RealtimeFeedCentered
          apiUrl={supabaseUrl}
          apiKey={supabaseAnonKey}
          initialScans={typedInitialScans} // Pass the correctly typed and potentially transformed scans
        />
      </Lamp>
    </div>
  );
}
