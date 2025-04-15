"use client";

import { useState } from "react";
import { LiveActivitySidebar } from "./LiveActivitySidebar";
import { NotificationsPanel } from "./NotificationsPanel";
import { ActivityOverview } from "./ActivityOverview";
import { CreateNotification } from "./CreateNotification";
import DrumStatusListener from "@/components/real-time/DrumStatusListener";
import OrderUpdatesListener from "@/components/real-time/OrderUpdatesListener";

interface ActivityDashboardProps {
  className?: string;
}

export function ActivityDashboard({ className = "" }: ActivityDashboardProps) {
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month">(
    "today"
  );
  const [notificationsKey, setNotificationsKey] = useState(0); // Used to force refresh

  // Handler for when a new notification is created
  const handleNotificationCreated = () => {
    // Increment the key to force refresh the notifications panel
    setNotificationsKey((prev) => prev + 1);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="grid grid-cols-12 gap-6">
        {/* Main content - 9 columns */}
        <div className="col-span-12 lg:col-span-9 space-y-6">
          {/* Activity overview */}
          <ActivityOverview timeRange={timeRange} />

          {/* Real-time panels */}
          <div className="grid grid-cols-2 gap-6">
            <DrumStatusListener />
            <OrderUpdatesListener />
          </div>
        </div>

        {/* Sidebar - 3 columns */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <LiveActivitySidebar className="sticky top-4" />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Notifications panel - 8 columns */}
        <div className="col-span-12 lg:col-span-8">
          <NotificationsPanel key={notificationsKey} />
        </div>

        {/* Create notification form - 4 columns */}
        <div className="col-span-12 lg:col-span-4">
          <CreateNotification
            onNotificationCreated={handleNotificationCreated}
          />
        </div>
      </div>
    </div>
  );
}
