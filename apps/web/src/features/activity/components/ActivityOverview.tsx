"use client";

import { useState, useEffect } from "react";
import { ScanType } from "../types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/core/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/core/ui/tabs";
import { createClient } from "@/lib/supabase/client";

interface ActivityData {
  total: number;
  byType: Record<ScanType, number>;
  byHour: Record<number, number>;
  successRate: number;
}

interface ActivityOverviewProps {
  className?: string;
  timeRange?: "today" | "week" | "month";
}

export function ActivityOverview({
  className = "",
  timeRange = "today",
}: ActivityOverviewProps) {
  const [activityData, setActivityData] = useState<ActivityData>({
    total: 0,
    byType: {
      intake: 0,
      transport: 0,
      distillation_loading: 0,
      distillation_start: 0,
      error: 0,
    },
    byHour: {},
    successRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function fetchActivityData() {
      try {
        setLoading(true);

        // Set start date based on time range
        const startDate = new Date();
        if (timeRange === "month") {
          startDate.setMonth(startDate.getMonth() - 1);
        } else if (timeRange === "week") {
          startDate.setDate(startDate.getDate() - 7);
        } else {
          // today
          startDate.setHours(0, 0, 0, 0);
        }

        // Fetch scan data
        const { data, error } = await supabase
          .from("log_drum_scan")
          .select("*")
          .gte("scanned_at", startDate.toISOString());

        if (error) throw error;

        if (data) {
          // Process data
          const byType: Record<ScanType, number> = {
            intake: 0,
            transport: 0,
            distillation_loading: 0,
            distillation_start: 0,
            error: 0,
          };

          const byHour: Record<number, number> = {};
          let successCount = 0;

          data.forEach((scan) => {
            // Count by type
            byType[scan.scan_type as ScanType] =
              (byType[scan.scan_type as ScanType] || 0) + 1;

            // Count by hour
            const hour = new Date(scan.scanned_at || "").getHours();
            byHour[hour] = (byHour[hour] || 0) + 1;

            // Count successes
            if (scan.scan_status === "success") {
              successCount++;
            }
          });

          setActivityData({
            total: data.length,
            byType,
            byHour,
            successRate:
              data.length > 0 ? (successCount / data.length) * 100 : 0,
          });
        }
      } catch (err) {
        console.error("Error fetching activity data:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    }

    fetchActivityData();
  }, [timeRange, supabase]);

  const renderActivityChart = () => {
    // This is a placeholder for where an actual chart would go
    // In a real implementation, you would use a library like Chart.js or Recharts
    return (
      <div className="h-[250px] flex items-center justify-center bg-gray-50 rounded-md border">
        <p className="text-gray-500">Activity chart would display here</p>
        <p className="text-gray-400 text-sm">(Using Chart.js or Recharts)</p>
      </div>
    );
  };

  const renderTypeCounts = () => {
    return (
      <div className="grid grid-cols-3 gap-4 mt-4">
        {Object.entries(activityData.byType).map(([type, count]) => (
          <div
            key={type}
            className="p-3 bg-white border rounded-md flex flex-col items-center"
          >
            <span className="text-2xl font-semibold">{count}</span>
            <span className="text-xs text-gray-500 mt-1">
              {type.replace("_", " ")}
            </span>
          </div>
        ))}
        <div className="p-3 bg-white border rounded-md flex flex-col items-center">
          <span className="text-2xl font-semibold">
            {activityData.successRate.toFixed(1)}%
          </span>
          <span className="text-xs text-gray-500 mt-1">Success Rate</span>
        </div>
      </div>
    );
  };

  return (
    <Card className={`shadow-sm ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg font-medium">
              Activity Overview
            </CardTitle>
            <CardDescription>
              Scan activity summary for selected period
            </CardDescription>
          </div>

          <Tabs defaultValue={timeRange} className="w-[300px]">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-6 text-gray-500">
            Loading activity data...
          </div>
        ) : error ? (
          <div className="mb-3 p-2 bg-red-50 text-red-700 text-sm rounded border border-red-200">
            Error loading activity data: {error.message}
          </div>
        ) : (
          <>
            <div className="text-3xl font-bold mb-4">
              {activityData.total}{" "}
              <span className="text-sm font-normal text-gray-500">
                total scans
              </span>
            </div>

            {renderActivityChart()}
            {renderTypeCounts()}
          </>
        )}
      </CardContent>
    </Card>
  );
}
