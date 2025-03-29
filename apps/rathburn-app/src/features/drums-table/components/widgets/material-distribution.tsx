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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import { DrumWidgetProps } from "@/types/models/drums";

// Material colors - using a color palette that's visually distinct
const MATERIAL_COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#8b5cf6", // Violet
  "#ef4444", // Red
  "#0ea5e9", // Sky
  "#a855f7", // Purple
  "#f43f5e", // Rose
  "#84cc16", // Lime
  "#14b8a6", // Teal
];

// Others category color
const OTHERS_COLOR = "#64748b"; // Slate

// Configuration
const DISPLAY_THRESHOLD_PERCENT = 1.5; // Only show materials that make up at least 1.5% of total
const MAX_DISPLAY_MATERIALS = 10; // Maximum number of individual materials to display

export function MaterialDistributionWidget({ drums }: DrumWidgetProps) {
  const { chartData, uniqueMaterialsCount, totalDrums, thresholdInfo } =
    useMemo(() => {
      // Count drums by material
      const materialCounts: Record<string, number> = {};

      drums.forEach((drum) => {
        const material = drum.material;
        materialCounts[material] = (materialCounts[material] || 0) + 1;
      });

      const totalDrums = drums.length;
      const uniqueMaterialsCount = Object.keys(materialCounts).length;

      // Calculate percentage for each material
      const materialsWithPercentage = Object.entries(materialCounts).map(
        ([material, count]) => ({
          material,
          count,
          percentage: (count / totalDrums) * 100,
        })
      );

      // Sort by count (descending)
      const sortedMaterials = materialsWithPercentage.sort(
        (a, b) => b.count - a.count
      );

      // Apply threshold filtering - keep materials above threshold and within max limit
      const displayMaterials = sortedMaterials
        .filter((item) => item.percentage >= DISPLAY_THRESHOLD_PERCENT)
        .slice(0, MAX_DISPLAY_MATERIALS);

      // Calculate "Others" category (all materials below threshold or beyond max display limit)
      const otherMaterials = sortedMaterials.filter(
        (item) => !displayMaterials.some((d) => d.material === item.material)
      );

      const othersCount = otherMaterials.reduce(
        (sum, item) => sum + item.count,
        0
      );
      const othersPercentage = (othersCount / totalDrums) * 100;

      // Prepare chart data
      let finalChartData = displayMaterials.map((item, index) => ({
        name: item.material,
        count: item.count,
        percentage: item.percentage,
        color: MATERIAL_COLORS[index % MATERIAL_COLORS.length],
      }));

      // Add "Others" category if it exists
      if (othersCount > 0) {
        finalChartData.push({
          name: `Others (${otherMaterials.length} materials)`,
          count: othersCount,
          percentage: othersPercentage,
          color: OTHERS_COLOR,
        });
      }

      // Calculate how many materials are hidden
      const hiddenMaterialsCount =
        uniqueMaterialsCount - displayMaterials.length;

      return {
        chartData: finalChartData,
        uniqueMaterialsCount,
        totalDrums,
        thresholdInfo: {
          threshold: DISPLAY_THRESHOLD_PERCENT,
          hiddenCount: hiddenMaterialsCount,
          othersPercentage: othersPercentage,
        },
      };
    }, [drums]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <div>
            <CardTitle className="text-base">Material Distribution</CardTitle>
            <CardDescription>Top materials by drum count</CardDescription>
          </div>
          {thresholdInfo.hiddenCount > 0 && (
            <span className="text-xs text-muted-foreground mt-1 sm:mt-0">
              Showing materials ≥ {DISPLAY_THRESHOLD_PERCENT}% of inventory
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-2 sm:p-6">
        {chartData.length > 0 ? (
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(value) => `${value}`} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={150}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) =>
                    value.length > 20 ? `${value.substring(0, 20)}...` : value
                  }
                />
                <Tooltip
                  formatter={(value: number, name, props) => {
                    const item = props.payload;
                    return [
                      `${value} drums (${item.percentage.toFixed(1)}%)`,
                      "Count",
                    ];
                  }}
                  labelFormatter={(name) => `Material: ${name}`}
                />
                <Legend />
                <Bar
                  dataKey="count"
                  name="Drum Count"
                  radius={[0, 4, 4, 0]}
                  barSize={24}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-[350px] items-center justify-center">
            <p className="text-muted-foreground">No material data available</p>
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Unique Materials</p>
            <p className="text-xl font-bold">{uniqueMaterialsCount}</p>
          </div>

          {chartData.length > 0 && (
            <div>
              <p className="text-muted-foreground">Most Common</p>
              <p className="text-xl font-bold">
                {chartData[0]?.name || "N/A"}
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  {chartData[0]?.percentage.toFixed(1)}%
                </span>
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
