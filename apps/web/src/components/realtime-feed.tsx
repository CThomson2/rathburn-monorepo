"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
  createClient,
} from "@supabase/supabase-js";

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

interface RealtimeFeedProps {
  apiUrl: string;
  apiKey: string;
  initialScans: StocktakeScanFeedDetail[];
}

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

export function RealtimeFeed({
  apiUrl,
  apiKey,
  initialScans = [],
}: RealtimeFeedProps) {
  const [scans, setScans] = useState<StocktakeScanFeedDetail[]>(initialScans);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const supabase = createClient(apiUrl, apiKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });

    console.log("Realtime Feed: Setting up client with:", apiUrl);

    if (channelRef.current) {
      console.log("Realtime channel already exists.");
      return;
    }

    console.log("Attempting to subscribe to Realtime changes on view...");

    const channel = supabase
      .channel("stocktake_scans_feed_details_realtime", {
        config: {
          broadcast: { self: true },
        },
      })
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "stocktake_scans_feed_details",
        },
        (payload: RealtimePostgresChangesPayload<StocktakeScanFeedDetail>) => {
          console.log("Realtime View: Received payload:", payload);
          if (payload.errors) {
            console.error("Realtime View error:", payload.errors);
            setError(`Realtime error: ${payload.errors[0]}`);
            return;
          }

          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE"
          ) {
            const newScan = payload.new;
            console.log("New scan from view:", newScan);
            if (newScan && newScan.id) {
              setScans((prev) => [newScan, ...prev].slice(0, 20));
              setError(null);
            } else {
              console.warn(
                "Received scan payload without valid data:",
                payload
              );
            }
          }
        }
      )
      .subscribe((status, err) => {
        console.log(`Realtime subscription status (View): ${status}`);
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
          setError(null);
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("Realtime subscription error (View):", err);
          setError(`Subscription error: ${err?.message || "Unknown issue"}`);
          setIsConnected(false);
        } else if (status === "CLOSED") {
          setIsConnected(false);
        }
      });

    channelRef.current = channel;

    return () => {
      console.log("Cleaning up Realtime subscription (View)");
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [apiUrl, apiKey, initialScans]);

  return (
    <Card className="mb-6 h-[300px] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">
          Realtime Stocktake Scan Feed
        </CardTitle>
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
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden p-0">
        {error && <p className="text-red-500 text-xs px-4 pb-2">{error}</p>}
        <ScrollArea className="h-full px-4 pb-4">
          {scans.length === 0 && !error ? (
            <p className="text-sm text-muted-foreground pt-4 text-center">
              No scans received yet. Waiting for data...
            </p>
          ) : (
            <ul className="space-y-2 pt-2">
              {scans.map((scan) => (
                <li
                  key={scan.id}
                  className="text-xs border rounded-md p-2 bg-card shadow-sm"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-muted-foreground">
                      {new Date(scan.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                    <Badge
                      variant={getStatusBadgeVariant(scan.status)}
                      className="capitalize"
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
                          <span className="text-muted-foreground text-xs block">
                            (Supplier:{" "}
                            {scan.associated_supplier_name_for_material})
                          </span>
                        )}
                      </>
                    ) : scan.barcode_type === "supplier" &&
                      scan.supplier_name ? (
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
                  {scan.status === "ignored" && (
                    <p className="text-gray-500 text-xs mt-1">
                      Reason: Ignored
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
