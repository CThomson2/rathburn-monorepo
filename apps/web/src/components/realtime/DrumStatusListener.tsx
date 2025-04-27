"use client";

import { useState, useEffect } from "react";
import { useDrumEvents } from "@/hooks/useDrumEvents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * DrumStatusListener component demonstrates real-time status updates for drums.
 *
 * This component uses the useDrumEvents hook to receive real-time updates about
 * drum status changes via Server-Sent Events. It displays the connection status,
 * and keeps a record of recent status updates received.
 */
export default function DrumStatusListener() {
  // State to keep track of recent updates (most recent first)
  const [recentUpdates, setRecentUpdates] = useState<
    Array<{
      drumId: number;
      status: string;
      timestamp: Date;
    }>
  >([]);

  // Use the drum events hook to receive status updates
  const { connectionState, lastDrumEvent, error } = useDrumEvents({
    onDrumStatusChange: (drumId, newStatus) => {
      // Add the new update to the beginning of our list
      setRecentUpdates((prev) => [
        {
          drumId,
          status: newStatus,
          timestamp: new Date(),
        },
        ...prev.slice(0, 9),
      ]); // Keep only the 10 most recent updates
    },
  });

  // Function to get an appropriate color for each status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800 border-green-300";
      case "processed":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "damaged":
        return "bg-red-100 text-red-800 border-red-300";
      case "in_transit":
        return "bg-amber-100 text-amber-800 border-amber-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  // Function to get connection status badge
  const getConnectionBadge = () => {
    switch (connectionState) {
      case "connecting":
        return (
          <Badge
            variant="outline"
            className="bg-amber-100 text-amber-800 border-amber-300"
          >
            Connecting...
          </Badge>
        );
      case "open":
        return (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 border-green-300"
          >
            Connected
          </Badge>
        );
      case "error":
        return (
          <Badge
            variant="outline"
            className="bg-red-100 text-red-800 border-red-300"
          >
            Error
          </Badge>
        );
      case "closed":
        return (
          <Badge
            variant="outline"
            className="bg-gray-100 text-gray-800 border-gray-300"
          >
            Disconnected
          </Badge>
        );
    }
  };

  return (
    <Card className="w-full shadow-sm hover:shadow transition-all duration-200">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium">
            Drum Status Updates
          </CardTitle>
          {getConnectionBadge()}
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-3 p-2 bg-red-50 text-red-700 text-sm rounded border border-red-200">
            Connection error: {error.message}
          </div>
        )}

        {recentUpdates.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            {connectionState === "open"
              ? "Waiting for drum status updates..."
              : "Connect to receive real-time updates"}
          </div>
        ) : (
          <div className="space-y-2">
            {recentUpdates.map((update, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center p-2 border rounded-md"
              >
                <div>
                  <span className="font-medium">Drum #{update.drumId}</span>
                  <span className="mx-2">→</span>
                  <Badge
                    variant="outline"
                    className={getStatusColor(update.status)}
                  >
                    {update.status}
                  </Badge>
                </div>
                <div className="text-xs text-gray-500">
                  {update.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
