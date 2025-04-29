"use client";

import { useState, useEffect } from "react";
import { useServerSentEvents } from "@/hooks/useServerSentEvents";
import { ScanEvent, actionType, ScanStatus } from "../types";

/**
 * Hook to subscribe to real-time scan events via SSE
 *
 * @param options Configuration options
 * @returns Connection state and event data
 */
export function useScanEvents(
  options: {
    onScanEvent?: (event: ScanEvent) => void;
    onConnectionOpen?: () => void;
    onConnectionError?: (error: Event) => void;
    enabled?: boolean;
  } = {}
) {
  const {
    onScanEvent,
    onConnectionOpen,
    onConnectionError,
    enabled = true,
  } = options;

  // State to store recent scan events (newest first)
  const [recentScans, setRecentScans] = useState<ScanEvent[]>([]);

  // Define event types to listen for
  const eventTypes = ["connected", "scanEvent"];

  // Use the generic SSE hook with our event types
  const { connectionState, lastEventData, error, isConnected } =
    useServerSentEvents<ScanEvent>("/api/activity/sse/scans", eventTypes, {
      onOpen: onConnectionOpen,
      onError: onConnectionError,
      onEvent: (type, data) => {
        if (type === "scanEvent" && onScanEvent) {
          onScanEvent(data);

          // Add to recent scans (keep last 50)
          setRecentScans((prev) => [data, ...prev].slice(0, 50));
        }
      },
      enabled,
    });

  return {
    connectionState,
    lastScan: lastEventData["scanEvent"] as ScanEvent | undefined,
    recentScans,
    error,
    isConnected,
  };
}
