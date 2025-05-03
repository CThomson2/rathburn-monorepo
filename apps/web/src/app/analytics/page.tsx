"use client"; // Start with client component for SSE/realtime setup

import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client"; // Import browser client
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
  Session,
} from "@supabase/supabase-js";

// Interface matching the columns in logs.stocktake_scans
interface StocktakeScanRecord {
  id: string;
  stocktake_session_id: string;
  raw_barcode: string;
  barcode_type: "material" | "supplier" | "unknown" | "error";
  material_id?: string | null;
  supplier_id?: string | null;
  status: "success" | "error" | "ignored";
  scanned_at: string; // ISO string date
  user_id: string;
  device_id?: string | null;
  created_at: string;
  error_message?: string | null;
  metadata?: any | null; // Or a more specific type if known
}

function AnalyticsDashboardPage() {
  // State holds the actual DB records now
  const [scans, setScans] = useState<StocktakeScanRecord[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null); // Ref to hold the channel

  const supabase = createClient();

  // Effect: Subscribe to Realtime
  useEffect(() => {
    // Prevent duplicate channels
    if (channelRef.current) {
      console.log("Realtime channel already exists.");
      return;
    }

    console.log("Attempting Realtime subscription using anon key...");
    setError(null); // Clear previous errors

    const handleScanInsert = (
      payload: RealtimePostgresChangesPayload<StocktakeScanRecord>
    ) => {
      console.log("Supabase Realtime: Payload received!", payload);
      if (payload.errors) {
        console.error("Supabase Realtime: Error in payload:", payload.errors);
        setError(`Realtime error receiving data: ${payload.errors[0]}`);
        setIsConnected(true); // Still technically subscribed, but receiving errors
        // If the error is specifically 401, it means RLS is still blocking anon
        if (payload.errors[0]?.includes("401")) {
          setError(
            "Realtime Error: Not authorized to read scans. Check RLS policy for 'anon' role on logs.stocktake_scans."
          );
        }
        return;
      }

      if (payload.eventType === "INSERT") {
        const newScan = payload.new;
        console.log("Supabase Realtime: New scan inserted:", newScan);
        setScans((prevScans) => [newScan, ...prevScans]);
        setError(null); // Clear errors on successful data
        // Ensure connection status reflects success if it was previously erroring
        if (!isConnected) setIsConnected(true);
      } else {
        console.log(
          `Supabase Realtime: Received event type ${payload.eventType}, ignoring.`
        );
      }
    };

    const channel = supabase
      .channel("stocktake_scans_inserts")
      .on<StocktakeScanRecord>(
        "postgres_changes",
        { event: "INSERT", schema: "logs", table: "stocktake_scans" },
        handleScanInsert
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          console.log("Supabase Realtime: Successfully subscribed!");
          setIsConnected(true);
          setError(null);
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

    return () => {
      if (channelRef.current) {
        console.log("Supabase Realtime: Unsubscribing from channel");
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setIsConnected(false);
      }
    };
    // Depend only on the supabase client instance (which shouldn't change)
  }, [supabase]);

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
                  {scan.user_id || "unknown"}... scanned {scan.barcode_type}:{" "}
                  {scan.raw_barcode} (Status: {scan.status})
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
