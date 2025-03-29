"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  Sector,
} from "recharts";
import { DrumWidgetProps } from "@/types/models/drums";

// Status colors with meaningful associations
const STATUS_COLORS = {
  pending: "#f59e0b", // Amber
  intake: "#3b82f6", // Blue
  processed: "#10b981", // Emerald
  loaded: "#8b5cf6", // Violet
  cancelled: "#ef4444", // Red
  failed: "#f43f5e", // Rose
  disposed: "#6b7280", // Gray
  lost: "#1f2937", // Dark Gray
  requeued: "#0ea5e9", // Sky
  scheduled: "#a855f7", // Purple
  default: "#64748b", // Slate
};

// Configuration
const MIN_PERCENTAGE_FOR_LABEL = 3; // Only show labels for segments that are at least 3% of the total

export function DrumStatusWidget({ drums }: DrumWidgetProps) {
  const { chartData, totalDrums, mostCommonStatus } = useMemo(() => {
    // Count drums by status
    const statusCounts: Record<string, number> = {};

    drums.forEach((drum) => {
      const status = drum.status.toLowerCase();
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const totalDrums = drums.length;

    // Calculate percentages and prepare chart data
    const statusData = Object.entries(statusCounts).map(([status, count]) => {
      const percentage = (count / totalDrums) * 100;
      const formattedName = status.charAt(0).toUpperCase() + status.slice(1); // Capitalize first letter

      return {
        name: formattedName,
        value: count,
        percentage,
        // Determine if this segment should have a visible label
        showLabel: percentage >= MIN_PERCENTAGE_FOR_LABEL,
        color:
          STATUS_COLORS[status as keyof typeof STATUS_COLORS] ||
          STATUS_COLORS.default,
      };
    });

    // Sort by count (descending)
    const sortedData = statusData.sort((a, b) => b.value - a.value);

    // Find the most common status
    const mostCommonStatus = sortedData.length > 0 ? sortedData[0] : null;

    return {
      chartData: sortedData,
      totalDrums,
      mostCommonStatus,
    };
  }, [drums]);

  // Active shape for hover effect
  const renderActiveShape = (props: any) => {
    const {
      cx,
      cy,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      fill,
      payload,
      percent,
    } = props;

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 12}
          outerRadius={outerRadius + 16}
          fill={fill}
        />
      </g>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Drum Status</CardTitle>
        <CardDescription>Distribution by current status</CardDescription>
      </CardHeader>
      <CardContent className="p-2 sm:p-6">
        {chartData.length > 0 ? (
          <div className="h-[350px] w-full flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="w-full h-full max-w-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    activeIndex={-1}
                    activeShape={renderActiveShape}
                    labelLine={false}
                    outerRadius={120}
                    innerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent, showLabel }) =>
                      showLabel ? `${name} ${(percent * 100).toFixed(0)}%` : ""
                    }
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name, entry) => {
                      const item = entry.payload;
                      return [
                        `${value} drums (${item.percentage.toFixed(1)}%)`,
                        name,
                      ];
                    }}
                  />
                  <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    wrapperStyle={{ paddingLeft: "20px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-col gap-4 w-full sm:max-w-[200px]">
              <div className="text-center sm:text-left">
                <p className="text-sm text-muted-foreground">Total Drums</p>
                <p className="text-2xl font-bold">{totalDrums}</p>
              </div>

              {mostCommonStatus && (
                <div className="text-center sm:text-left">
                  <p className="text-sm text-muted-foreground">
                    Most Common Status
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: mostCommonStatus.color }}
                    />
                    <p className="text-xl font-bold">{mostCommonStatus.name}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {mostCommonStatus.value} drums (
                    {mostCommonStatus.percentage.toFixed(1)}%)
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex h-[350px] items-center justify-center">
            <p className="text-muted-foreground">No drum data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
