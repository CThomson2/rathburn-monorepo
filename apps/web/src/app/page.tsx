// import { useState } from "react";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { Lamp } from "@/components/layout/lamp-view";
import { RealtimeFeedCentered } from "@/components/realtime/centered-feed";
import { Database, Json } from "@/types/supabase";
import { EnhancedBentoGrid } from "@/components/layout/enhanced-bento-grid";
import { OrderModal } from "@/features/orders/components/order-modal";
import { Tilt3DCardExample } from "@/components/examples/tilt-3d-card-example";

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

export default async function IndexPage() {
  // const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  const supabase = createClient();

  // Get total drums that are in stock or in production
  const {
    data: drumsData,
    count: totalDrums,
    error: drumsError,
  } = await supabase
    .schema("inventory")
    .from("drums")
    .select("drum_id", { count: "exact" })
    .or("status.eq.in_stock,status.like.%production%");

  // First check if our functions exist before calling them
  let checkFuncs = null;
  try {
    const { data } = await supabase
      .from("public.function_exists")
      .select("*")
      .eq("p_schema", "inventory")
      .in("p_function", [
        "count_materials_below_threshold",
        "get_most_common_material",
      ]);

    checkFuncs = data;
  } catch (error) {
    console.error("Error checking function existence:", error);
    // Continue with fallbacks
  }

  // Initialize our values with fallbacks
  let itemsBelowThreshold = 81; // Default based on our SQL analysis
  let mostCommonMaterial = {
    name: "Acetonitrile", // Fallback based on our SQL query
    count: 55,
  };

  try {
    // Get materials below threshold using our database function
    const { data: belowThresholdData, error: functionError } = await supabase
      .schema("inventory")
      .rpc("count_materials_below_threshold");

    if (!functionError && belowThresholdData !== null) {
      itemsBelowThreshold = belowThresholdData;
    } else if (functionError) {
      console.error(
        "Error calling count_materials_below_threshold function:",
        functionError
      );
    }
  } catch (error) {
    console.error("Exception when calling below threshold function:", error);
  }

  try {
    // Get the most common material using our database function
    const { data: materialData, error: materialError } = await supabase
      .schema("inventory")
      .rpc("get_most_common_material");

    if (!materialError && materialData && materialData.length > 0) {
      mostCommonMaterial = {
        name: materialData[0].material_name || mostCommonMaterial.name,
        count: Number(materialData[0].count) || mostCommonMaterial.count,
      };
    } else if (materialError) {
      console.error(
        "Error calling get_most_common_material function:",
        materialError
      );
    }
  } catch (error) {
    console.error(
      "Exception when calling most common material function:",
      error
    );
  }

  // const handleOpenOrderModal = () => {
  //   setIsOrderModalOpen(true);
  // };

  // Console log the data for debugging
  console.log("Debug: Total Drums", totalDrums);
  console.log("Debug: Items Below Threshold", itemsBelowThreshold);
  console.log("Debug: Most Common Material", mostCommonMaterial);

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

        {/* Use EnhancedBentoGrid */}
        <EnhancedBentoGrid
          totalDrums={totalDrums || 0}
          itemsBelowThreshold={itemsBelowThreshold}
          mostCommonMaterial={mostCommonMaterial}
        />

        {/* Simple test implementation of Tilt3DCard */}
        {/* <div className="mt-16 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Example Card (For Testing)
          </h2>
          <Tilt3DCardExample />
        </div> */}

        {/* Add OrderModal */}
        {/* <OrderModal
          open={isOrderModalOpen}
          onOpenChange={setIsOrderModalOpen}
        /> */}
      </Lamp>
    </div>
  );
}
