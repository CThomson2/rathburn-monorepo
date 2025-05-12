"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
  createClient,
} from "@supabase/supabase-js";
import { motion } from "framer-motion";
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
  user_email?: string | null;
  device_id?: string | null;
  pol_id?: string | null;
  pod_id?: string | null;
  item_name?: string | null;
  cancelled_scan_id?: string | null;
  metadata?: Json | null;
}

// Props expected by the component
interface RealtimeFeedCenteredProps {
  apiUrl: string;
  apiKey: string;
  initialScans: SessionScanData[];
}

// Helper functions (update parameter types)
function getStatusColor(status: SessionScanData["scan_status"]): string {
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
  status: SessionScanData["scan_status"]
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

export function RealtimeFeedCentered({
  apiUrl,
  apiKey,
  initialScans = [],
}: RealtimeFeedCenteredProps) {
  const [scans, setScans] = useState<SessionScanData[]>(initialScans);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Memoize the Supabase client creation
  const supabase = useMemo(() => {
    if (!apiUrl || !apiKey) {
      console.error(
        "RealtimeFeedCentered: Missing apiUrl or apiKey for client creation."
      );
      setError("Configuration error: Missing Supabase URL or API Key.");
      setIsConnected(false);
      return null;
    }
    console.log("Realtime Centered: Creating Supabase client with:", apiUrl);
    return createClient(apiUrl, apiKey, {
      realtime: { params: { eventsPerSecond: 10 } },
    });
  }, [apiUrl, apiKey]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    console.log("Realtime Centered (subscription useEffect): Using client.");

    if (channelRef.current) {
      console.log(
        "Realtime Centered: Removing existing channel before re-subscribing."
      );
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    console.log(
      "Realtime Centered: Attempting to subscribe to session_scans changes..."
    );

    const channelName = `session_scans_centered_feed_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on<SessionScanData>(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "session_scans",
        },
        (payload: RealtimePostgresChangesPayload<SessionScanData>) => {
          console.log(
            `Realtime Centered (${channelName}): Received payload from session_scans:`,
            payload
          );
          if (payload.errors) {
            console.error(
              `Realtime Centered (${channelName}) error (session_scans):`,
              payload.errors
            );
            setError(`Realtime error: ${payload.errors[0]}`);
            return;
          }

          if (payload.eventType === "INSERT" && payload.new) {
            const newScan = payload.new as SessionScanData;
            console.log(`New session scan ID (${channelName}):`, newScan.id);
            setScans((prevScans) => {
              const updatedScans = [newScan, ...prevScans];
              return updatedScans.slice(0, 50);
            });
            setError(null);
          } else if (payload.eventType === "UPDATE" && payload.new) {
            const updatedScan = payload.new as SessionScanData;
            console.log(
              `Updated session scan ID (${channelName}):`,
              updatedScan.id
            );
            setScans((prevScans) =>
              prevScans.map((s) => (s.id === updatedScan.id ? updatedScan : s))
            );
            setError(null);
          } else if (
            payload.eventType === "DELETE" &&
            payload.old &&
            (payload.old as SessionScanData).id
          ) {
            const deletedScanId = (payload.old as SessionScanData).id;
            console.log(
              `Session scan deleted (${channelName}):`,
              deletedScanId
            );
            setScans((prevScans) =>
              prevScans.filter((s) => s.id !== deletedScanId)
            );
          }
        }
      )
      .subscribe((status, err) => {
        console.log(
          `Realtime Centered subscription status (${channelName}): ${status}`
        );
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
          setError(null);
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error(
            `Realtime Centered subscription error (${channelName}):`,
            err
          );
          setError(`Subscription error: ${err?.message || "Unknown issue"}`);
          setIsConnected(false);
        } else if (status === "CLOSED") {
          setIsConnected(false);
        }
      });

    channelRef.current = channel;

    return () => {
      console.log(
        `Cleaning up Realtime Centered subscription (${channelName})`
      );
      if (channelRef.current && supabase) {
        supabase
          .removeChannel(channelRef.current)
          .then((removeStatus) =>
            console.log(
              `Centered channel ${channelName} removed, status:`,
              removeStatus
            )
          )
          .catch((removeError) =>
            console.error(
              `Error removing centered channel ${channelName}:`,
              removeError
            )
          );
        channelRef.current = null;
      }
    };
  }, [supabase]);

  // Update state if initialScans prop changes externally
  useEffect(() => {
    setScans(initialScans);
  }, [initialScans]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-semibold text-white">
          Realtime Session Scans
        </h3>
        <div className="flex items-center px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50">
          <span
            className={cn(
              "h-2.5 w-2.5 rounded-full mr-2",
              isConnected
                ? getStatusColor("success")
                : error
                  ? getStatusColor("error")
                  : getStatusColor("ignored")
            )}
          />
          <span className="text-sm font-medium text-slate-200">
            {isConnected ? "Live" : error ? "Error" : "Connecting..."}
          </span>
        </div>
      </div>

      {error && (
        <Card className="mb-6 border-red-500/50 bg-red-900/20">
          <CardContent className="p-4">
            <p className="text-red-300">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="relative">
        {scans.length === 0 && !error ? (
          <Card className="border-dashed border-2 border-slate-700/50 bg-slate-900/30">
            <CardContent className="flex flex-col items-center justify-center p-10">
              <div className="w-12 h-12 mb-4 rounded-full border-2 border-slate-600 border-dashed animate-pulse"></div>
              <p className="text-lg text-slate-400">
                Waiting for incoming scans...
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 w-full">
            {scans.map((scan, index) => (
              <motion.div
                key={scan.id}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: index === 0 ? 0 : 0,
                  ease: "easeOut",
                }}
              >
                <Card
                  className={cn(
                    "w-full transition-all duration-300 ease-in-out shadow-md bg-slate-900/50 border-slate-700/50",
                    scan.scan_status === "error"
                      ? "border-red-500/50"
                      : scan.scan_status === "success"
                        ? "border-green-500/50"
                        : "border-slate-600/50"
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="font-medium text-lg block text-slate-200">
                          {new Date(scan.scanned_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </span>
                        {scan.user_email && (
                          <span
                            className="text-sm text-slate-400 block truncate"
                            title={scan.user_email}
                          >
                            {scan.user_email.slice(
                              0,
                              scan.user_email.indexOf("@") !== -1
                                ? scan.user_email.indexOf("@")
                                : undefined
                            )}
                          </span>
                        )}
                      </div>
                      <Badge
                        variant={getStatusBadgeVariant(scan.scan_status)}
                        className="capitalize px-3 py-1 text-sm"
                      >
                        {scan.scan_status}
                      </Badge>
                    </div>

                    <div
                      className="font-mono text-base mb-2 px-3 py-2 bg-slate-800/70 rounded-md text-slate-200 flex justify-between items-start"
                      title={scan.raw_barcode}
                    >
                      <div>
                        <span className="font-semibold capitalize text-blue-400">
                          [{scan.scan_action.replace("_", " ")}]
                        </span>{" "}
                        {scan.item_name || scan.raw_barcode}
                        {scan.item_name && (
                          <span className="text-slate-400 text-sm block mt-1">
                            Barcode: {scan.raw_barcode}
                          </span>
                        )}
                      </div>
                    </div>

                    {scan.scan_status === "error" && scan.error_message && (
                      <p className="text-red-400 text-sm mt-1 px-3 py-2 bg-red-900/20 rounded-md">
                        Error: {scan.error_message}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
