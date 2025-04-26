"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { ChartDrumInventory } from "../types";
import {
  useColorScheme,
  getCategoryColor,
  getInventoryStatusVariant,
  getChartCssVariables,
} from "../utils/theme-colors";

interface DrumInventoryChartProps {
  data: ChartDrumInventory[];
  title?: string;
  description?: string;
  className?: string;
}

export function DrumInventoryChart({
  data,
  title,
  description,
  className,
}: DrumInventoryChartProps) {
  const colors = useColorScheme();
  const chartVars = getChartCssVariables();

  // Fixed constants for chart dimensions
  const CHART_BAR_HEIGHT = 25; // Height of each bar
  const CHART_BAR_GAP = 5; // Gap between bars
  const MIN_CHART_HEIGHT = 400; // Minimum chart container height in pixels

  // Sort by status (critical first, then warning, then ok)
  const sortedData = React.useMemo(() => {
    return [...data].sort((a, b) => {
      const aStatus = getInventoryStatusVariant(
        a.total,
        a.threshold,
        a.criticalThreshold
      );
      const bStatus = getInventoryStatusVariant(
        b.total,
        b.threshold,
        b.criticalThreshold
      );

      // Sort first by status severity
      if (aStatus === "error" && bStatus !== "error") return -1;
      if (aStatus !== "error" && bStatus === "error") return 1;
      if (aStatus === "warning" && bStatus === "success") return -1;
      if (aStatus === "success" && bStatus === "warning") return 1;

      // Then sort by proximity to threshold
      const aPercent = a.total / a.threshold;
      const bPercent = b.total / b.threshold;
      return aPercent - bPercent;
    });
  }, [data]);

  // Calculate chart container height based on number of items
  const calculateChartContainerHeight = () => {
    // Each item needs space for the bar plus the gap
    const itemHeight = CHART_BAR_HEIGHT + CHART_BAR_GAP;
    // Minimum number of items to show
    const minItems = Math.ceil(MIN_CHART_HEIGHT / itemHeight);
    // Get the max between actual items and minimum items
    const visibleItems = Math.max(sortedData.length, minItems);
    // Add extra space for chart padding, legend, and labels
    return visibleItems * itemHeight + 100;
  };

  // Custom tooltip formatter to show both drum types
  const tooltipFormatter = (value: any, name: string) => {
    if (name === "newDrums") return [value, "New Drums"];
    if (name === "reproDrums") return [value, "Repro Drums"];
    return [value, name];
  };

  // Custom tooltip label formatter
  const tooltipLabelFormatter = (label: string) => {
    const item = sortedData.find((item) => item.chemical === label);
    if (!item) return label;
    return `${item.code} - ${label} (${item.category})`;
  };

  return (
    <div className={cn("space-y-4", className)} style={chartVars}>
      {title && (
        <div>
          <h3 className="text-lg font-medium">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      <div
        className="transition-all duration-300 ease-in-out overflow-y-auto"
        style={{
          height: `${calculateChartContainerHeight()}px`,
        }}
      >
        {/* Important: Setting width/height to 100% and avoiding animation makes the chart stable */}
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sortedData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis dataKey="chemical" stroke="var(--chart-axis)" />
            <YAxis stroke="var(--chart-axis)" />
            <Tooltip
              formatter={(value, name) => {
                if (name === "criticalThreshold" || name === "threshold") {
                  return [
                    `${value} ${data[0]?.unit || ""}`,
                    name === "criticalThreshold"
                      ? "Critical Threshold"
                      : "Threshold",
                  ];
                }
                return [
                  `${value} ${data[0]?.unit || ""}`,
                  name === "newDrums" ? "New" : "Repro",
                ];
              }}
              contentStyle={{
                backgroundColor: "var(--chart-tooltip-bg)",
                borderColor: "var(--chart-tooltip-border)",
              }}
            />
            <Legend />
            <Bar dataKey="newDrums" name="New" fill="var(--chart-success)" />
            <Bar
              dataKey="reproDrums"
              name="Repro"
              fill="var(--chart-hydrocarbon)"
            />
            <Bar
              dataKey="threshold"
              name="Threshold"
              fill="var(--chart-warning)"
            />
            <Bar
              dataKey="criticalThreshold"
              name="Critical Threshold"
              fill="var(--chart-error)"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend for thresholds */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-sm"
            style={{ backgroundColor: "var(--chart-success)" }}
          ></div>
          <span>New Drums</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-sm"
            style={{ backgroundColor: "var(--chart-hydrocarbon)" }}
          ></div>
          <span>Repro Drums</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-6 border-r-2 border-dashed"
            style={{ borderColor: "var(--chart-warning)" }}
          ></div>
          <span>Threshold</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: "var(--chart-error)" }}
          ></div>
          <span>Critical</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: "var(--chart-warning)" }}
          ></div>
          <span>Warning</span>
        </div>
      </div>
    </div>
  );
}
