"use client";

import { useState, useEffect } from "react";
import { Notification, MessageType, AudienceType } from "../types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistance } from "date-fns";
import { createClient } from "@/lib/supabase/client";

interface NotificationsPanelProps {
  className?: string;
  limit?: number;
}

export function NotificationsPanel({
  className = "",
  limit = 10,
}: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  // Fetch recent notifications from the database
  useEffect(() => {
    async function fetchNotifications() {
      try {
        setLoading(true);

        // Get notifications from the last 24 hours
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        const { data, error } = await supabase
          .from("notification")
          .select("*")
          .gte("created_at", oneDayAgo.toISOString())
          .order("created_at", { ascending: false })
          .limit(limit);

        if (error) throw error;

        setNotifications(data || []);
      } catch (err) {
        console.error("Error fetching notifications:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    }

    fetchNotifications();

    // Set up a subscription for real-time notifications
    const channel = supabase
      .channel("notification-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notification",
        },
        (payload) => {
          // Add new notification to the list
          setNotifications((prev) => [
            payload.new as Notification,
            ...prev.slice(0, limit - 1),
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [limit, supabase]);

  // Function to get message type badge class
  const getMessageTypeBadgeClass = (messageType: MessageType) => {
    switch (messageType) {
      case "info":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "warning":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "urgent":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "error":
        return "bg-red-100 text-red-800 border-red-300";
      case "success":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  // Function to get audience type badge
  const getAudienceTypeBadge = (audienceType: AudienceType) => {
    switch (audienceType) {
      case "all":
        return (
          <Badge
            variant="outline"
            className="bg-blue-100 text-blue-800 border-blue-300"
          >
            All Users
          </Badge>
        );
      case "lab_workers":
        return (
          <Badge
            variant="outline"
            className="bg-purple-100 text-purple-800 border-purple-300"
          >
            Lab Workers
          </Badge>
        );
      case "inventory_workers":
        return (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 border-green-300"
          >
            Inventory Workers
          </Badge>
        );
      case "office_workers":
        return (
          <Badge
            variant="outline"
            className="bg-amber-100 text-amber-800 border-amber-300"
          >
            Office Workers
          </Badge>
        );
      case "managers":
        return (
          <Badge
            variant="outline"
            className="bg-gray-100 text-gray-800 border-gray-300"
          >
            Managers
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card className={`shadow-sm ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg font-medium">Notifications</CardTitle>
            <CardDescription>
              System notifications from the last 24 hours
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="bg-gray-100 text-gray-800 border-gray-300"
          >
            {notifications.length} messages
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-6 text-gray-500">
            Loading notifications...
          </div>
        ) : error ? (
          <div className="mb-3 p-2 bg-red-50 text-red-700 text-sm rounded border border-red-200">
            Error loading notifications: {error.message}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            No recent notifications
          </div>
        ) : (
          <ScrollArea className="h-[350px]">
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.notification_id}
                  className="p-3 border rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <Badge
                      variant="outline"
                      className={getMessageTypeBadgeClass(
                        notification.message_type as MessageType
                      )}
                    >
                      {notification.message_type}
                    </Badge>
                    <div className="text-xs text-gray-500">
                      {formatDistance(
                        new Date(notification.created_at),
                        new Date(),
                        {
                          addSuffix: true,
                        }
                      )}
                    </div>
                  </div>

                  <div className="text-sm mb-2">{notification.message}</div>

                  <div className="flex justify-between items-center mt-2">
                    {getAudienceTypeBadge(
                      notification.audience_type as AudienceType
                    )}
                    <span className="text-xs text-gray-500">
                      From: {notification.created_by.substring(0, 8)}...
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
      <CardFooter className="flex justify-end pt-2">
        <Button variant="outline" size="sm">
          View All
        </Button>
      </CardFooter>
    </Card>
  );
}
