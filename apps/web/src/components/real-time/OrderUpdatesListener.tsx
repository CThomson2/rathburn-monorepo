"use client";

import { useState } from "react";
import { useOrderEvents } from "@/hooks/useOrderEvents";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/core/ui/card";
import { Badge } from "@/components/core/ui/badge";
import { Package } from "lucide-react";

/**
 * OrderUpdatesListener component demonstrates real-time order quantity updates.
 *
 * This component uses the useOrderEvents hook to receive real-time updates about
 * order quantity changes via Server-Sent Events. It displays the connection status,
 * and keeps a record of recent order updates received.
 */
export default function OrderUpdatesListener() {
  // State to keep track of recent updates (most recent first)
  const [recentUpdates, setRecentUpdates] = useState<
    Array<{
      orderId: number;
      drumId: number;
      newQuantityReceived: number;
      timestamp: Date;
    }>
  >([]);

  // Use the order events hook to receive updates
  const { connectionState, lastOrderEvent, error } = useOrderEvents({
    onOrderUpdate: (orderId, drumId, newQuantityReceived) => {
      // Add the new update to the beginning of our list
      setRecentUpdates((prev) => [
        {
          orderId,
          drumId,
          newQuantityReceived,
          timestamp: new Date(),
        },
        ...prev.slice(0, 9),
      ]); // Keep only the 10 most recent updates
    },
  });

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
            Order Quantity Updates
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
              ? "Waiting for order updates..."
              : "Connect to receive real-time updates"}
          </div>
        ) : (
          <div className="space-y-2">
            {recentUpdates.map((update, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center p-2 border rounded-md"
              >
                <div className="flex items-center">
                  <Package className="h-4 w-4 mr-2 text-slate-500" />
                  <div>
                    <span className="font-medium">Order #{update.orderId}</span>
                    <span className="mx-2">•</span>
                    <span>Drum #{update.drumId}</span>
                    <span className="mx-2">•</span>
                    <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                      {update.newQuantityReceived} received
                    </Badge>
                  </div>
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
