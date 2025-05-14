"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js"; // Import directly from supabase-js
import { createClient } from "@/lib/supabase/client"; // Import your client creator
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
// Import the specific type from the centralized file
import { Database } from "@/types/supabase";

// Define the interface for scan data from public.session_scans
// Based on the supabase.ts provided:
type SessionScanData = Database["public"]["Tables"]["session_scans"]["Row"];
// Using a more explicit interface for clarity in the component:
// interface SessionScanData { ... }

// Remove apiUrl and apiKey, make initialScans optional (will fetch if not provided)
interface RealtimeScanLogSidebarProps {
  initialScans?: SessionScanData[];
}

// Helper functions for styling (can be expanded)
function getStatusColor(status: SessionScanData["scan_status"]): string {
  switch (status) {
    case "success":
      return "bg-green-500";
    case "error":
      return "bg-red-500";
    case "ignored":
      return "bg-slate-500"; // Adjusted from gray-400 for dark theme
    default:
      return "bg-amber-500"; // For any other unexpected status
  }
}

function getStatusBadgeVariant(
  status: SessionScanData["scan_status"]
): "default" | "destructive" | "secondary" | "outline" | null | undefined {
  switch (status) {
    case "success":
      return "default"; // Often green or primary
    case "error":
      return "destructive"; // Often red
    case "ignored":
      return "secondary"; // Often gray
    default:
      return "outline";
  }
}

/**
 * RealtimeScanLogSidebar component for displaying a list of recent scans.
 *
 * It will fetch initial scans from the database if not provided and
 * subscribe to the "session_scans_feed" channel to receive real-time updates.
 *
 * @property {SessionScanData[]} [initialScans] - Initial scans to display (optional)
 */
const RealtimeScanLogSidebar = ({
  initialScans,
}: RealtimeScanLogSidebarProps) => {
  // If initialScans are provided, use them, otherwise start empty
  const [scans, setScans] = useState<SessionScanData[]>(initialScans || []);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingInitial, setIsLoadingInitial] = useState(!initialScans);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Use the imported createClient directly
  const supabase = useMemo(() => createClient(), []);

  // Effect to fetch initial scans if not provided
  useEffect(() => {
    async function fetchInitialScans() {
      if (!initialScans && supabase) {
        setIsLoadingInitial(true);
        const { data, error: fetchError } = await supabase
          .from("session_scans")
          .select("*")
          //   .select("*", "profiles(email)") // Keep the join if needed for user_email
          .order("created_at", { ascending: false })
          .limit(25);

        if (fetchError) {
          console.error("Error fetching initial scans:", fetchError.message);
          setError("Failed to load initial scan data.");
          setScans([]);
        } else {
          // Map data similarly to how dashboard-layout did, if join is used
          const mappedData =
            data?.map((scan) => ({
              ...scan,
              // Adjust if profiles join isn't used or changes structure
              user_email: (scan as any).profiles?.email || null,
            })) || [];
          setScans(mappedData);
          setError(null);
        }
        setIsLoadingInitial(false);
      }
    }

    fetchInitialScans();
    // Dependency array includes initialScans and supabase instance
  }, [initialScans, supabase]);

  // Effect for Realtime subscription (mostly unchanged)
  useEffect(() => {
    if (!supabase) {
      setIsConnected(false);
      return;
    }

    const channelName = `session_scans_feed_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on<
        // Use the specific Table Row type for the payload
        Database["public"]["Tables"]["session_scans"]["Row"]
      >(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "session_scans",
        },
        (payload) => {
          // Type assertion for payload.new/old if needed, based on your exact type
          type ScanRow = Database["public"]["Tables"]["session_scans"]["Row"];

          console.log(
            `RealtimeScanLogSidebar (${channelName}): Received payload:`,
            payload
          );
          if (payload.errors) {
            console.error(
              `RealtimeScanLogSidebar (${channelName}) error:`,
              payload.errors
            );
            setError(`Realtime error: ${payload.errors[0]}`);
            return;
          }

          if (payload.eventType === "INSERT" && payload.new) {
            // Map the new scan data if necessary (e.g., for joined user_email)
            const newScan = {
              ...(payload.new as ScanRow),
              user_email: (payload.new as any).profiles?.email || null,
            };
            setScans((prevScans) => [newScan, ...prevScans].slice(0, 50));
            setError(null);
          } else if (payload.eventType === "UPDATE" && payload.new) {
            const updatedScan = {
              ...(payload.new as ScanRow),
              user_email: (payload.new as any).profiles?.email || null,
            };
            setScans((prevScans) =>
              prevScans.map((s) => (s.id === updatedScan.id ? updatedScan : s))
            );
            setError(null);
          } else if (
            payload.eventType === "DELETE" &&
            payload.old &&
            (payload.old as ScanRow).id
          ) {
            const deletedScanId = (payload.old as ScanRow).id;
            setScans((prevScans) =>
              prevScans.filter((s) => s.id !== deletedScanId)
            );
          }
        }
      )
      .subscribe((status, err) => {
        console.log(
          `RealtimeScanLogSidebar subscription status (${channelName}): ${status}`
        );
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
          setError(null);
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error(
            `RealtimeScanLogSidebar subscription error (${channelName}):`,
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
      if (channelRef.current && supabase) {
        supabase
          .removeChannel(channelRef.current)
          .then((status) =>
            console.log(
              `RealtimeScanLogSidebar channel ${channelName} removed, status:`,
              status
            )
          )
          .catch((error) =>
            console.error(
              `Error removing RealtimeScanLogSidebar channel ${channelName}:`,
              error
            )
          );
        channelRef.current = null;
      }
    };
  }, [supabase]); // Dependency only on supabase client

  // Auto-scroll to top when new scan comes in, if desired
  useEffect(() => {
    if (scrollAreaRef.current) {
      // Simple scroll to top, or implement more complex logic (e.g., scroll only if user is near the top)
      // scrollAreaRef.current.scrollTop = 0;
    }
  }, [scans]);

  // --- UI Rendering based on scan-log-sidebar.tsx mockup ---
  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 p-4 text-white font-sans overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Session Scan Log</h2>
          <p className="text-slate-400 text-sm mt-1">
            Real-time scanning activity
          </p>
        </div>
        <div className="flex items-center px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50">
          <span
            className={cn(
              "h-2.5 w-2.5 rounded-full mr-2",
              isConnected
                ? getStatusColor("success") // Green for connected
                : error
                  ? getStatusColor("error") // Red for error
                  : getStatusColor("ignored") // Gray for connecting/disconnected
            )}
          />
          <span className="text-sm font-medium text-slate-200">
            {isConnected ? "Live" : error ? "Error" : "Connecting..."}
          </span>
        </div>
      </div>

      {/* Placeholder for Stats cards - can be made dynamic later */}
      {/* <div className="grid grid-cols-2 gap-2 mb-4"> ... stats cards ... </div> */}

      {/* Filter controls - Placeholder for now */}
      {/* <div className="mb-4 flex flex-col sm:flex-row gap-3"> ... filter inputs ... </div> */}

      {error && (
        <Card className="mb-4 border-red-500/50 bg-red-900/20">
          <CardContent className="p-3">
            <p className="text-red-300 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading indicator for initial fetch */}
      {isLoadingInitial && (
        <Card className="border-dashed border-2 border-slate-700/50 bg-slate-900/30">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="w-10 h-10 mb-3 rounded-full border-2 border-slate-600 border-dashed animate-pulse"></div>
            <p className="text-md text-slate-400">Loading initial scans...</p>
          </CardContent>
        </Card>
      )}

      <ScrollArea className="flex-grow" ref={scrollAreaRef}>
        <div className="space-y-2 w-full pr-2">
          {/* Show empty state only if not loading and no scans */}
          {scans.length === 0 && !error && !isLoadingInitial && (
            <Card className="border-dashed border-2 border-slate-700/50 bg-slate-900/30">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="w-10 h-10 mb-3 rounded-full border-2 border-slate-600 border-dashed animate-pulse"></div>
                <p className="text-md text-slate-400">Waiting for scans...</p>
              </CardContent>
            </Card>
          )}
          {scans.map((scan) => (
            <Card
              key={scan.id}
              className={cn(
                "w-full shadow-sm bg-slate-900/50 border-l-4 border border-slate-800/50 rounded-md",
                scan.scan_status === "success"
                  ? "border-l-green-500"
                  : scan.scan_status === "error"
                    ? "border-l-red-500"
                    : "border-l-slate-500"
              )}
            >
              <div className="p-3">
                <div className="flex justify-between items-center">
                  {/* Scan Content */}
                  <div className="flex items-center space-x-2 overflow-hidden">
                    {/* Icon could be based on scan_action or scan_status */}
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        getStatusColor(scan.scan_status)
                      )}
                    ></div>
                    <div className="font-mono text-sm text-slate-200 truncate">
                      <span className="font-semibold capitalize">
                        {scan.scan_action.replace("_", " ")}:
                      </span>{" "}
                      {scan.item_name || scan.raw_barcode}
                    </div>
                  </div>

                  {/* Time and Status Badge */}
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <span className="text-xs text-slate-400">
                      {new Date(scan.scanned_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        // second: "2-digit", // Optional: for more precision
                      })}
                    </span>
                    <Badge
                      variant={getStatusBadgeVariant(scan.scan_status)}
                      className="capitalize px-2 py-0.5 text-xs h-5"
                    >
                      {scan.scan_status}
                    </Badge>
                  </div>
                </div>
                {/* Additional Details */}
                {scan.item_name && scan.raw_barcode !== scan.item_name && (
                  <p className="text-slate-500 text-xs mt-1 pl-4 truncate">
                    Barcode: {scan.raw_barcode}
                  </p>
                )}
                {scan.scan_status === "error" && scan.error_message && (
                  <p className="text-red-400 text-xs mt-1 pl-4 truncate">
                    Error: {scan.error_message}
                  </p>
                )}
                {/* Optionally display user_email or pol_id if available and desired */}
                {/* {scan.user_email && <p className="text-slate-500 text-xs mt-1 pl-4">User: {scan.user_email.split(\'@\')[0]}</p>} */}
                {/* {scan.pol_id && <p className="text-slate-500 text-xs mt-1 pl-4">Task ID: {scan.pol_id.substring(0,8)}</p>} */}
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
      {/* Quick filters placeholder */}
      {/* <div className="flex justify-center gap-2 mt-4 pt-2 border-t border-slate-800"> ... quick filter buttons ... </div> */}
    </div>
  );
};

export default RealtimeScanLogSidebar;
