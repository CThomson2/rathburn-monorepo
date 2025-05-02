"use client"; // Start with client component for SSE/realtime setup

import React, { useState, useEffect, useRef } from "react";
import {
  createClient as createAuthCheckClient, // Client for OLD DB (Auth Check Only)
  createNewClient as createDataClient, // Client for NEW DB (Data & Realtime)
} from "@/lib/supabase/client"; // Import browser client
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
  Session,
} from "@supabase/supabase-js";

// Interface matching the columns in logs.stocktake_scans
// Adjust types as necessary based on actual schema if different
interface StocktakeScanRecord {
  id: string; // Changed from scanId to match DB
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false); // Track auth status via OLD DB
  const channelRef = useRef<RealtimeChannel | null>(null); // Ref to hold the channel

  // Explicitly create both clients
  const authCheckClient = createAuthCheckClient(); // OLD DB
  const dataClient = createDataClient(); // NEW DB

  // Effect 1: Check Authentication using OLD DB client
  useEffect(() => {
    console.log("Checking authentication status using Auth DB client...");
    authCheckClient.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        console.log("Auth check successful (session found in OLD DB).");
        setIsAuthenticated(true);
        setError(null); // Clear any previous auth errors
      } else {
        console.log("Auth check failed (no session found in OLD DB).");
        setIsAuthenticated(false);
        setError("Not authenticated. Realtime updates unavailable.");
      }
    });

    // Listen for auth changes on the OLD DB client
    const { data: authListener } = authCheckClient.auth.onAuthStateChange(
      (_event, session) => {
        console.log("Auth state changed (OLD DB), new session:", !!session);
        const authenticated = !!session;
        setIsAuthenticated(authenticated);
        if (!authenticated) {
          setError("Not authenticated. Realtime updates unavailable.");
          // If user logs out via old system, tear down new system's channel
          if (channelRef.current) {
            console.log(
              "User logged out (OLD DB), removing Realtime channel (NEW DB)."
            );
            dataClient.removeChannel(channelRef.current);
            channelRef.current = null;
            setIsConnected(false);
          }
        } else {
          setError(null); // Clear error if user logs back in
        }
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
    // Add authCheckClient and dataClient to dependency array
  }, [authCheckClient, dataClient]);

  // Effect 2: Subscribe to Realtime using NEW DB client, dependent on auth status
  useEffect(() => {
    // Only subscribe if authenticated via OLD DB client
    if (!isAuthenticated) {
      console.log(
        "Not authenticated, skipping Realtime subscription on NEW DB."
      );
      // Ensure cleanup if auth status changes rapidly
      if (channelRef.current) {
        console.log("Cleaning up existing channel due to auth change.");
        dataClient.removeChannel(channelRef.current);
        channelRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Prevent duplicate channels
    if (channelRef.current) {
      console.log("Realtime channel (NEW DB) already exists.");
      return;
    }

    console.log(
      "Authenticated (OLD DB), attempting Realtime subscription (NEW DB)..."
    );
    setError(null); // Clear previous errors before attempting subscription

    const handleScanInsert = (
      payload: RealtimePostgresChangesPayload<StocktakeScanRecord>
    ) => {
      console.log("Supabase Realtime (NEW DB): Payload received!", payload);
      if (payload.errors) {
        console.error(
          "Supabase Realtime (NEW DB): Error in payload:",
          payload.errors
        );
        // Potentially set a different error state to distinguish subscription vs payload errors
        setError(`Realtime error receiving data: ${payload.errors[0]}`);
        setIsConnected(true); // Still technically subscribed, but receiving errors
        return;
      }

      if (payload.eventType === "INSERT") {
        const newScan = payload.new;
        console.log("Supabase Realtime (NEW DB): New scan inserted:", newScan);
        // Add to the beginning of the list
        setScans((prevScans) => [newScan, ...prevScans]);
        setError(null); // Clear errors on successful data
      } else {
        console.log(
          `Supabase Realtime (NEW DB): Received event type ${payload.eventType}, ignoring.`
        );
      }
    };

    // Use the dataClient (NEW DB) for the subscription
    const channel = dataClient
      .channel("stocktake_scans_inserts")
      .on<StocktakeScanRecord>(
        "postgres_changes",
        { event: "INSERT", schema: "logs", table: "stocktake_scans" },
        handleScanInsert
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          console.log("Supabase Realtime (NEW DB): Successfully subscribed!");
          setIsConnected(true);
          setError(null);
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("Supabase Realtime (NEW DB): Subscription error:", err);
          setError(`Subscription error: ${err?.message || "Unknown issue"}`);
          setIsConnected(false);
          channelRef.current = null;
        } else if (status === "CLOSED") {
          console.log("Supabase Realtime (NEW DB): Channel closed.");
          setIsConnected(false);
          channelRef.current = null;
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        console.log("Supabase Realtime (NEW DB): Unsubscribing from channel");
        dataClient.removeChannel(channelRef.current);
        channelRef.current = null;
        setIsConnected(false);
      }
    };
    // Depend on isAuthenticated status and the dataClient
  }, [isAuthenticated, dataClient]);

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
            {/* Show Auth status separately from connection status */}
            {!isAuthenticated ? (
              <p className="text-red-600">Not Authenticated</p>
            ) : (
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
            )}
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
          {!isAuthenticated ? (
            <p>Please log in to view real-time scans.</p>
          ) : scans.length === 0 ? (
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
