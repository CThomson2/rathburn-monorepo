"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
  createClient,
  SupabaseClient,
} from "@supabase/supabase-js";

// Interface for the view data (should be consistent across components)
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
  user_email?: string | null;
  device_id?: string | null;
  material_id?: string | null;
  material_name?: string | null;
  supplier_id?: string | null;
  supplier_name?: string | null;
  associated_supplier_name_for_material?: string | null;
}

// Props expected by the sidebar component
interface RealtimeFeedSidebarProps {
  apiUrl: string;
  apiKey: string;
  initialScans: StocktakeScanFeedDetail[];
}

// Helper functions (copied from realtime-feed.tsx)
function getStatusColor(status: StocktakeScanFeedDetail["status"]): string {
  switch (status) {
    case "success":
      return "bg-green-500";
    case "error":
      return "bg-red-500";
    case "ignored":
      return "bg-gray-400";
    default:
      return "bg-amber-500";
  }
}

function getStatusBadgeVariant(
  status: StocktakeScanFeedDetail["status"]
): "default" | "destructive" | "secondary" | "outline" | null | undefined {
  switch (status) {
    case "success":
      return "default";
    case "error":
      return "destructive";
    case "ignored":
      return "secondary";
    default:
      return "outline";
  }
}

export function RealtimeFeedSidebar({
  apiUrl,
  apiKey,
  initialScans = [],
}: RealtimeFeedSidebarProps) {
  const [scans, setScans] = useState<StocktakeScanFeedDetail[]>(initialScans);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Memoize the Supabase client creation
  const supabase = useMemo(() => {
    if (!apiUrl || !apiKey) {
      console.error(
        "RealtimeFeedSidebar: Missing apiUrl or apiKey for client creation."
      );
      setError("Configuration error: Missing Supabase URL or API Key.");
      setIsConnected(false); // Explicitly set connected to false
      return null;
    }
    console.log("Realtime Sidebar: Creating Supabase client with:", apiUrl);
    return createClient(apiUrl, apiKey, {
      realtime: { params: { eventsPerSecond: 10 } },
    });
  }, [apiUrl, apiKey]);

  useEffect(() => {
    // If the client isn't created (e.g., missing env vars), don't proceed.
    if (!supabase) {
      // Error state should already be set by useMemo if apiUrl/apiKey are missing
      return;
    }

    console.log("Realtime Sidebar (subscription useEffect): Using client.");

    // Clear previous channel if exists, to prevent multiple subscriptions if supabase client instance changes
    // This is a double safety, primary cleanup is in the return function.
    if (channelRef.current) {
      console.log(
        "Realtime Sidebar: Removing existing channel before re-subscribing (pre-check)."
      );
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    console.log(
      "Realtime Sidebar: Attempting to subscribe to base table changes..."
    );

    const channelName = `stocktake_scans_sidebar_feed_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on<any>( // Using `any` for base table payload, then casting/fetching enriched
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "stocktake_scans",
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          console.log(
            `Realtime Sidebar (${channelName}): Received payload from base table:`,
            payload
          );
          if (payload.errors) {
            console.error(
              `Realtime Sidebar (${channelName}) error (base table):`,
              payload.errors
            );
            setError(`Realtime error: ${payload.errors[0]}`);
            return;
          }

          if (
            (payload.eventType === "INSERT" ||
              payload.eventType === "UPDATE") &&
            payload.new &&
            payload.new.id
          ) {
            const changedScanId = payload.new.id;
            console.log(`New/Updated scan ID (${channelName}):`, changedScanId);

            supabase // Use the memoized client here
              .from("stocktake_scans_feed_details")
              .select("*")
              .eq("id", changedScanId)
              .single()
              .then(({ data: enrichedScan, error: fetchError }) => {
                if (fetchError) {
                  console.error(
                    `Error fetching enriched scan data (${channelName}):`,
                    fetchError
                  );
                  return;
                }
                if (enrichedScan) {
                  console.log(
                    `Fetched enriched scan data (${channelName}):`,
                    enrichedScan
                  );
                  setScans((prevScans) => {
                    const existingIndex = prevScans.findIndex(
                      (s) => s.id === enrichedScan.id
                    );
                    let updatedScans;
                    if (existingIndex !== -1) {
                      updatedScans = [...prevScans];
                      updatedScans[existingIndex] =
                        enrichedScan as StocktakeScanFeedDetail;
                    } else {
                      updatedScans = [
                        enrichedScan as StocktakeScanFeedDetail,
                        ...prevScans,
                      ];
                    }
                    return updatedScans.slice(0, 50);
                  });
                  setError(null);
                }
              });
          } else if (
            payload.eventType === "DELETE" &&
            payload.old &&
            payload.old.id
          ) {
            const deletedScanId = payload.old.id;
            console.log(`Scan deleted (${channelName}):`, deletedScanId);
            setScans((prevScans) =>
              prevScans.filter((s) => s.id !== deletedScanId)
            );
          }
        }
      )
      .subscribe((status, err) => {
        console.log(
          `Realtime Sidebar subscription status (${channelName}): ${status}`
        );
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
          setError(null);
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error(
            `Realtime Sidebar subscription error (${channelName}):`,
            err
          );
          setError(`Subscription error: ${err?.message || "Unknown issue"}`);
          setIsConnected(false);
        } else if (status === "CLOSED") {
          setIsConnected(false);
        } else {
          // For other statuses like 'CONNECTING', 'RECONNECTING', etc. can keep isConnected as is or false
          // setIsConnected(false); // Or set to false for any non-subscribed state
        }
      });

    channelRef.current = channel;

    return () => {
      console.log(`Cleaning up Realtime Sidebar subscription (${channelName})`);
      if (channelRef.current && supabase) {
        // Ensure supabase client exists for cleanup
        supabase
          .removeChannel(channelRef.current)
          .then((removeStatus) =>
            console.log(
              `Sidebar channel ${channelName} removed, status:`,
              removeStatus
            )
          )
          .catch((removeError) =>
            console.error(
              `Error removing sidebar channel ${channelName}:`,
              removeError
            )
          );
        channelRef.current = null;
      }
    };
    // This useEffect now depends on the memoized `supabase` client instance.
    // It will re-run if `supabase` itself changes (i.e., if apiUrl/apiKey change).
  }, [supabase]);

  // Update state if initialScans prop changes externally
  useEffect(() => {
    setScans(initialScans);
  }, [initialScans]);

  // Use a div container for sidebar structure instead of Card
  return (
    <div className="h-full flex flex-col border-l bg-background w-72 dark:border-gray-700">
      {/* Sidebar styling */}
      <div className="p-4 border-b">
        <h3 className="text-sm font-medium flex justify-between items-center">
          <span>Stocktake Scan Feed</span>
          <div className="flex items-center">
            <span
              className={cn(
                "h-2 w-2 rounded-full mr-2",
                isConnected
                  ? getStatusColor("success")
                  : error
                    ? getStatusColor("error")
                    : getStatusColor("ignored")
              )}
            />
            <span className="text-xs text-muted-foreground">
              {isConnected ? "Connected" : error ? "Error" : "Connecting..."}
            </span>
          </div>
        </h3>
      </div>
      <ScrollArea className="flex-grow p-4">
        {error && <p className="text-red-500 text-xs pb-2">{error}</p>}
        {scans.length === 0 && !error ? (
          <p className="text-sm text-muted-foreground pt-4 text-center">
            Waiting for scans...
          </p>
        ) : (
          <ul className="space-y-3">
            {scans.map((scan) => (
              <li
                key={scan.id}
                className={cn(
                  "text-xs border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow duration-200 max-w-full overflow-hidden", // max-w-full to allow content to use available space
                  scan.status === "ignored"
                    ? "bg-gray-100 dark:bg-gray-800"
                    : "bg-card"
                )}
              >
                <div className="flex justify-between items-start mb-1.5">
                  {" "}
                  {/* items-start to align timestamp and badge at top */}
                  <div>
                    <span className="font-medium text-muted-foreground block">
                      {new Date(scan.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                    {scan.user_email && (
                      <span
                        className="text-xs text-gray-500 dark:text-gray-400 block truncate"
                        title={scan.user_email}
                      >
                        {scan.user_email}
                      </span>
                    )}
                  </div>
                  <Badge
                    variant={getStatusBadgeVariant(scan.status)}
                    className="capitalize text-xs px-2 py-0.5 ml-2 flex-shrink-0" // Added ml-2 and flex-shrink-0
                  >
                    {scan.status}
                  </Badge>
                </div>
                <div
                  className="font-mono text-sm truncate mb-1"
                  title={scan.raw_barcode}
                >
                  {scan.barcode_type === "material" && scan.material_name ? (
                    <>
                      <span className="font-semibold">Material:</span>{" "}
                      {scan.material_name}
                      {scan.associated_supplier_name_for_material && (
                        <span className="text-muted-foreground text-xs block mt-0.5">
                          (Supplier:{" "}
                          {scan.associated_supplier_name_for_material})
                        </span>
                      )}
                    </>
                  ) : scan.barcode_type === "supplier" && scan.supplier_name ? (
                    <>
                      <span className="font-semibold">Supplier:</span>{" "}
                      {scan.supplier_name}
                    </>
                  ) : (
                    <>
                      <span className="font-semibold capitalize">
                        {scan.barcode_type}:
                      </span>{" "}
                      {scan.raw_barcode}
                    </>
                  )}
                </div>
                {scan.status === "error" && scan.error_message && (
                  <p className="text-red-600 text-xs mt-1">
                    Error: {scan.error_message}
                  </p>
                )}
                {/* Add specific message for ignored if needed, or remove */}
                {/* {scan.status === "ignored" && (
                   <p className="text-gray-500 text-xs mt-1">Reason: Ignored</p>
                 )} */}
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>
    </div>
  );
}
