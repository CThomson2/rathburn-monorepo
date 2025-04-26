"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { DrumInventory } from "../../types";
import { useColorScheme, getThemeBarColor } from "../utils/theme-colors";

interface DrumInventoryChartProps {
  inventory: DrumInventory[];
  isExpanded: boolean;
  onItemClick: (item: DrumInventory) => void;
}

export function DrumInventoryChart({
  inventory,
  isExpanded,
  onItemClick,
}: DrumInventoryChartProps) {
  const { theme } = useTheme();
  const colors = useColorScheme(theme);
  
  // Fixed constants for chart dimensions
  const CHART_BAR_HEIGHT = 25; // Height of each bar
  const CHART_BAR_GAP = 5; // Gap between bars
  const MIN_CHART_HEIGHT = 400; // Minimum chart container height in pixels

  // Calculate chart container height based on number of items
  const calculateChartContainerHeight = () => {
    // Each item needs space for the bar plus the gap
    const itemHeight = CHART_BAR_HEIGHT + CHART_BAR_GAP;
    // Minimum number of items to show
    const minItems = Math.ceil(MIN_CHART_HEIGHT / itemHeight);
    // Get the max between actual items and minimum items
    const visibleItems = Math.max(inventory.length, minItems);
    // Add extra space for chart padding, legend, and labels
    return visibleItems * itemHeight + 100;
  };

  // Custom tooltip formatter to show both drum types
  const tooltipFormatter = (value: any, name: string) => {
    if (name === "newStock") return [value, "New Drums"];
    if (name === "reproStock") return [value, "Repro Drums"];
    return [value, name];
  };

  // Custom tooltip label formatter
  const tooltipLabelFormatter = (label: string) => {
    const item = inventory.find((item) => item.name === label);
    if (!item) return label;
    return `${item.code} - ${label} (${item.category})`;
  };

  return (
    <div
      className={cn(
        "transition-all duration-300 ease-in-out",
        isExpanded ? "" : "h-[75vh] overflow-y-auto"
      )}
      style={{
        // Fixed size container to prevent layout shift
        height: isExpanded
          ? `${calculateChartContainerHeight()}px`
          : "75vh",
      }}
    >
      {/* Important: Setting width/height to 100% and avoiding animation makes the chart stable */}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={inventory}
          margin={{ top: 5, right: 30, left: 120, bottom: 25 }}
          barSize={CHART_BAR_HEIGHT}
          barCategoryGap={CHART_BAR_GAP}
          barGap={0}
          className="transition-none" // Prevent any transitions on the chart itself
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={colors.chartGrid}
          />
          <XAxis
            type="number"
            label={{
              value: "Number of Drums",
              position: "insideBottom",
              offset: -5,
              style: {
                fill: theme === "dark" ? "#9ca3af" : "#64748b",
                fontWeight: 500,
              },
            }}
            stroke={colors.chartAxis}
            tickLine={{ stroke: colors.chartAxis }}
            tick={{ fill: colors.chartText }}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{
              fontSize: 12,
              textAnchor: "end",
              fill: colors.chartText,
            }}
            tickFormatter={(value) =>
              value.toUpperCase().replace(/\s/g, "\u00A0")
            }
            width={120}
            interval={
              isExpanded
                ? 0
                : Math.ceil(inventory.length / 15)
            }
            onClick={(data) => {
              // Find the corresponding inventory item by name
              const item = inventory.find(
                (entry) => entry.name === data
              );
              if (item) onItemClick(item);
            }}
            stroke={colors.chartAxis}
          />

          {/* Add a second axis that shows categories in collapsed view */}
          {!isExpanded && (
            <YAxis
              yAxisId="category"
              orientation="right"
              type="category"
              dataKey={(entry) => {
                // Find important breakpoints - highest value items in each category
                const isHighValue = entry.total > 50;
                const isLowStock = entry.total < entry.threshold;
                return isHighValue || isLowStock ? entry.name : "";
              }}
              tick={{
                fontSize: 10,
                textAnchor: "start",
                fill: theme === "dark" ? "#9ca3af" : "#64748b",
              }}
              tickFormatter={(value) => {
                if (!value) return "";
                return value.length > 10
                  ? value.substring(0, 10) + "..."
                  : value;
              }}
              onClick={(data) => {
                // Find the corresponding inventory item by name
                const item = inventory.find(
                  (entry) => entry.name === data
                );
                if (item) onItemClick(item);
              }}
              width={80}
              axisLine={false}
              tickLine={false}
            />
          )}

          <Tooltip
            formatter={tooltipFormatter}
            labelFormatter={tooltipLabelFormatter}
            contentStyle={{
              borderRadius: "6px",
              border: `1px solid ${colors.chartTooltipBorder}`,
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              backgroundColor: colors.chartTooltipBg,
              color: colors.chartText,
            }}
          />
          <Legend
            wrapperStyle={{
              paddingTop: 15,
              paddingBottom: 5,
              borderTop: `1px solid ${colors.chartGrid}`,
            }}
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            iconType="circle"
            payload={[
              // Hydrocarbons
              {
                value: "Hydrocarbons",
                type: "circle",
                color: colors.groups.Hydrocarbons,
                id: "hydrocarbons",
              },
              // General Solvents
              {
                value: "General Solvents",
                type: "circle",
                color: colors.groups["Gen Solvents"],
                id: "generalSolvents",
              },
              // Aromatics
              {
                value: "Aromatics",
                type: "circle",
                color: colors.groups.Aromatics,
                id: "aromatics",
              },
            ]}
          />

          {/* New Drums Bar */}
          <Bar
            dataKey="newStock"
            name="New Drums"
            stackId="a"
            minPointSize={3}
            isAnimationActive={false}
          >
            {inventory.map((entry, index) => (
              <Cell
                key={`new-${index}`}
                fill={
                  theme === "dark"
                    ? getThemeBarColor(entry.chGroup, false, theme)
                    : entry.groupColour?.new || getThemeBarColor(entry.chGroup, false, theme)
                }
                onClick={() => onItemClick(entry)}
                style={{ cursor: "pointer" }}
              />
            ))}
          </Bar>

          {/* Repro Drums Bar - Rendered second so it's in front */}
          <Bar
            dataKey="reproStock"
            name="Repro Drums"
            stackId="a"
            minPointSize={3}
            isAnimationActive={false}
          >
            {inventory.map((entry, index) => (
              <Cell
                key={`repro-${index}`}
                fill={
                  theme === "dark"
                    ? getThemeBarColor(entry.chGroup, true, theme)
                    : entry.groupColour?.repro || getThemeBarColor(entry.chGroup, true, theme)
                }
                onClick={() => onItemClick(entry)}
                style={{ cursor: "pointer" }}
              />
            ))}
          </Bar>

          {/* Add threshold reference lines */}
          {inventory.map((entry, index) => (
            <ReferenceLine
              key={`threshold-${index}`}
              y={entry.name}
              x={entry.threshold}
              stroke={colors.threshold}
              strokeDasharray="3 3"
              strokeWidth={1.5}
              ifOverflow="extendDomain"
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}