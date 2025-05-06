"use client"; // Start with client component for SSE/realtime setup

import React, { useState, useEffect, useRef } from "react";
import { createServiceClient } from "@/lib/supabase/server"; // Import server client with service role
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
  Session,
} from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

// Fixed interface according to the database schema (id instead of scan_id)
interface StocktakeScanDetail {
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
  user_identifier?: string | null;
}

// Add type for the underlying table record
interface StocktakeScanRecord {
  id: string;
  stocktake_session_id: string;
  raw_barcode: string;
  barcode_type: "material" | "supplier" | "unknown" | "error";
  material_id?: string | null;
  supplier_id?: string | null;
  status: "success" | "error" | "ignored";
  scanned_at: string;
  user_id: string;
  device_id?: string | null;
  created_at: string;
  error_message?: string | null;
  metadata?: any | null;
}

function AnalyticsDashboardPage() {
  const router = useRouter();
  // State holds the view records now
  const [scans, setScans] = useState<StocktakeScanDetail[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<boolean>(false);
  const channelRef = useRef<RealtimeChannel | null>(null); // Ref to hold the channel
  const [session, setSession] = useState<Session | null>(null);

  const supabase = createServiceClient();

  // Handle force logout
  const handleForceLogout = async () => {
    // Just redirect to login since we're using service role client
    router.push("/login");
  };

  // Effect: Get auth session - with service role we don't need this
  // but keeping it for status tracking
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Using service client, so just set a placeholder session
        setSession({ user: { id: "service_role" } } as Session);
      } catch (err) {
        console.error("Error with service role client:", err);
        setError(`Service client error: ${err}`);
        setAuthError(true);
      }
    };

    checkSession();
  }, [supabase]);

  // Effect: Subscribe to Realtime
  useEffect(() => {
    // Don't subscribe until we have session information
    if (!session) {
      console.log("Waiting for service client initialization...");
      return;
    }

    // Prevent duplicate channels
    if (channelRef.current) {
      console.log("Realtime channel already exists.");
      return;
    }

    console.log("Attempting Realtime subscription with service role...");
    setError(null); // Clear previous errors

    // Important: Since we're using a view, we need to listen to the underlying table
    // because Realtime events only trigger on the actual table, not the view
    const handleScanInsert = (
      payload: RealtimePostgresChangesPayload<StocktakeScanRecord>
    ) => {
      console.log("Supabase Realtime: Payload received!", payload);
      if (payload.errors) {
        console.error("Supabase Realtime: Error in payload:", payload.errors);
        setError(`Realtime error receiving data: ${payload.errors[0]}`);
        setIsConnected(true); // Still technically subscribed, but receiving errors
        return;
      }

      if (payload.eventType === "INSERT") {
        // With service role, we can just use the data directly from the payload
        const newScan = payload.new as unknown as StocktakeScanDetail;
        console.log("New scan inserted:", newScan);
        setScans((prevScans) => [newScan, ...prevScans]);
        setError(null);
        setIsConnected(true);
      } else {
        console.log(
          `Supabase Realtime: Received event type ${payload.eventType}, ignoring.`
        );
      }
    };

    // Make sure channel has access to the auth token by using raw REST API headers
    // IMPORTANT: Subscribe to the underlying table, not the view
    const channel = supabase
      .channel("stocktake_scans_inserts", {
        config: {
          broadcast: { self: true },
        },
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "stocktake_scans",
        },
        handleScanInsert
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          console.log("Supabase Realtime: Successfully subscribed!");
          setIsConnected(true);
          setError(null);

          console.log("Using service role client for all operations");
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("Supabase Realtime: Subscription error:", err);
          setError(`Subscription error: ${err?.message || "Unknown issue"}`);
          setIsConnected(false);
          channelRef.current = null;
        } else if (status === "CLOSED") {
          console.log("Supabase Realtime: Channel closed.");
          setIsConnected(false);
          channelRef.current = null;
        }
      });

    channelRef.current = channel;

    // Fetch initial data
    const fetchInitialData = async () => {
      try {
        console.log("Fetching initial data with service role client...");
        const { data, error } = await supabase
          .from("stocktake_scans")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10);

        if (error) {
          console.error("Error fetching initial data:", error);
          setError(`Error loading initial data: ${error.message}`);
          return;
        }

        if (data && data.length > 0) {
          console.log("Initial data loaded:", data.length, "records");
          setScans(data as StocktakeScanDetail[]);
        } else {
          console.log("No initial data found");
        }
      } catch (err) {
        console.error("Error in fetchInitialData:", err);
      }
    };

    fetchInitialData();

    return () => {
      if (channelRef.current) {
        console.log("Supabase Realtime: Unsubscribing from channel");
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setIsConnected(false);
      }
    };
  }, [supabase, session]);

  // If we have an auth error, show recovery UI
  if (authError) {
    return (
      <div className="container mx-auto p-4 md:p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-amber-600">
              Authentication Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Your session appears to be invalid or expired. This can happen
              when:
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-1 text-sm">
              <li>Your login session has expired</li>
              <li>Your auth state is corrupted</li>
              <li>You have been logged out from another tab/device</li>
            </ul>
            <Button onClick={handleForceLogout} className="w-full mt-2">
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">
        Stocktake Analytics Dashboard (Realtime)
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Connection Status</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Simplified connection status */}
            <p
              className={
                isConnected
                  ? "text-green-600"
                  : error
                    ? "text-red-600"
                    : "text-orange-500"
              }
            >
              {isConnected ? "Subscribed" : error ? "Error" : "Connecting..."}
            </p>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Scans Received</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{scans.length}</p>
          </CardContent>
        </Card>
        {/* Add more summary cards here */}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Real-time Scan Feed</CardTitle>
        </CardHeader>
        <CardContent>
          {scans.length === 0 ? (
            <p>No scans received yet. Waiting for data...</p>
          ) : (
            <ul className="space-y-2 max-h-96 overflow-y-auto">
              {scans.map((scan) => (
                <li key={scan.id} className="p-2 border rounded text-sm">
                  [{new Date(scan.created_at).toLocaleTimeString()}] User{" "}
                  {scan.user_identifier || scan.user_id || "unknown"}... scanned{" "}
                  {scan.barcode_type === "material" && scan.material_name
                    ? `material: ${scan.material_name}`
                    : scan.barcode_type === "supplier" && scan.supplier_name
                      ? `supplier: ${scan.supplier_name}`
                      : `${scan.barcode_type}: ${scan.raw_barcode}`}{" "}
                  (Status: {scan.status})
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Placeholder for charts/graphs */}
      {/* <div className="mt-6">
        <Card>
          <CardHeader><CardTitle>Scan Distribution (Placeholder)</CardTitle></CardHeader>
          <CardContent>Chart component goes here</CardContent>
        </Card>
      </div> */}
    </div>
  );
}

export default AnalyticsDashboardPage;
