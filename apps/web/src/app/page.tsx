"use client";

import { useState } from "react";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { Lamp } from "@/components/layout/lamp-view";
import { RealtimeFeedCentered } from "@/components/realtime/centered-feed";
import { Database, Json } from "@/types/supabase";
import { BentoGrid } from "@/components/layout/bento-grid";
import { OrderModal } from "@/features/orders/components/order-modal";

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

export default function IndexPage() {
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  const handleOpenOrderModal = () => {
    setIsOrderModalOpen(true);
  };

  // Placeholder KPI data - replace with actual data fetching if needed
  const placeholderTotalDrums = 125; // Example value
  const placeholderItemsBelowThreshold = 15; // Example value

  return (
    <div className="container mx-auto">
      <Lamp>
        {/* 
          The RealtimeFeedCentered component was for the previous feed. 
          The new RealtimeScanLogSidebar will be part of DashboardLayout.
          This page.tsx might display other content or a different view of scans.
          For now, I'll keep it, but its role might change.
        */}
        {/* <RealtimeFeedCentered
          apiUrl={supabaseUrl}
          apiKey={supabaseAnonKey}
          initialScans={typedInitialScans} // Pass the correctly typed and potentially transformed scans
        /> */}

        {/* Add BentoGrid below Lamp */}
        <BentoGrid
          onOpenOrderModal={handleOpenOrderModal}
          totalDrums={placeholderTotalDrums}
          itemsBelowThreshold={placeholderItemsBelowThreshold}
        />

        {/* Add OrderModal */}
        <OrderModal
          open={isOrderModalOpen}
          onOpenChange={setIsOrderModalOpen}
        />
      </Lamp>
    </div>
  );
}
