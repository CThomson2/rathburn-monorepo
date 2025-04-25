"use client";

import { useState, useEffect } from "react";
import { useScanEvents } from "../hooks/useScanEvents";
import { ScanEvent, ScanType } from "../types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistance } from "date-fns";

interface LiveActivitySidebarProps {
  className?: string;
  maxItems?: number;
}

export function LiveActivitySidebar({
  className = "",
  maxItems = 20,
}: LiveActivitySidebarProps) {
  // Use the scan events hook to receive updates
  const { connectionState, recentScans, error } = useScanEvents({
    onScanEvent: (event) => {
      // You could add additional handling here if needed
      console.log("New scan event:", event);
    },
  });

  // Function to get appropriate color for each scan type
  const getScanTypeBadgeClass = (scanType: ScanType) => {
    switch (scanType) {
      case "intake":
        return "bg-green-100 text-green-800 border-green-300";
      case "transport":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "distillation_loading":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "distillation_start":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "error":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  // Function to get status badge class
  const getStatusBadgeClass = (status: string) => {
    return status === "success"
      ? "bg-green-100 text-green-800 border-green-300"
      : "bg-red-100 text-red-800 border-red-300";
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
    <Card className={`h-full shadow-sm ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg font-medium">Live Activity</CardTitle>
            <CardDescription>Real-time drum scans</CardDescription>
          </div>
          {getConnectionBadge()}
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-3 p-2 bg-red-50 text-red-700 text-sm rounded border border-red-200">
            Connection error: {error.message}
          </div>
        )}

        {recentScans.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            {connectionState === "open"
              ? "Waiting for scan activity..."
              : "Connect to receive real-time updates"}
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-13rem)]">
            <div className="space-y-3">
              {recentScans.slice(0, maxItems).map((scan, idx) => (
                <div
                  key={scan.scanId || idx}
                  className="p-3 border rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={getScanTypeBadgeClass(
                          scan.scanType as ScanType
                        )}
                      >
                        {scan.scanType}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={getStatusBadgeClass(scan.scanStatus)}
                      >
                        {scan.scanStatus}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDistance(new Date(scan.scannedAt), new Date(), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>

                  <div className="text-sm">
                    <span className="font-medium">
                      {scan.drumId ? `Drum #${scan.drumId}` : "Unknown drum"}
                    </span>
                    <span className="text-gray-500 ml-2">
                      by User #{scan.userId}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
