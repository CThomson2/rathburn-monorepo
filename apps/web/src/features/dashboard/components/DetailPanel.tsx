"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { ChevronRight } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { DrumInventory } from "../types";
import { useColorScheme, getThemeBarColor } from "../utils/theme-colors";

interface DetailPanelProps {
  item: DrumInventory;
  onClose: () => void;
}

export function DetailPanel({ item, onClose }: DetailPanelProps) {
  const { theme } = useTheme();
  const colors = useColorScheme();

  return (
    <div
      className={cn(
        "p-4 rounded-lg shadow-sm border transition-all duration-300",
        colors.cardBg,
        colors.cardBorder
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2
            className={cn(
              "text-lg font-semibold flex items-center",
              colors.headingText
            )}
          >
            {item.code} - {item.name}
          </h2>
          <p className={cn("text-sm mt-1", colors.bodyText)}>{item.category}</p>
        </div>
        <button
          type="button"
          title="Close"
          className={cn(
            "text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
          )}
          onClick={onClose}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <h3
              className={cn(
                "text-base font-medium flex items-center",
                colors.subheadingText
              )}
            >
              <ChevronRight className="mr-1" size={18} />
              Inventory Details
            </h3>

            <div
              className={cn(
                "rounded-md p-3 space-y-2",
                theme === "dark" ? "bg-gray-900" : "bg-slate-50"
              )}
            >
              <div className="grid grid-cols-2 gap-x-4 text-sm">
                <div className={colors.bodyText}>New Drums:</div>
                <div className={cn("font-medium", colors.headingText)}>
                  {item.newStock}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 text-sm">
                <div className={colors.bodyText}>Repro Drums:</div>
                <div className={cn("font-medium", colors.headingText)}>
                  {item.reproStock}
                </div>
              </div>

              <div
                className={cn(
                  "grid grid-cols-2 gap-x-4 text-sm border-t pt-2 mt-2",
                  theme === "dark" ? "border-gray-700" : "border-slate-200"
                )}
              >
                <div className={colors.bodyText}>Total Stock:</div>
                <div className={cn("font-medium", colors.headingText)}>
                  {item.total}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 text-sm">
                <div className={colors.bodyText}>Threshold Level:</div>
                <div
                  className={cn(
                    "font-medium",
                    item.total < (item.threshold || 0)
                      ? "text-amber-600 dark:text-amber-400"
                      : colors.headingText
                  )}
                >
                  {item.threshold}
                </div>
              </div>
            </div>

            {item.total < (item.threshold || 0) && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 rounded-md flex items-center text-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-amber-500 dark:text-amber-400 mr-2 flex-shrink-0"
                >
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <span className="text-amber-700 dark:text-amber-300">
                  This item is below the reorder threshold and may need to be
                  restocked soon.
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h3
              className={cn(
                "text-base font-medium flex items-center",
                colors.subheadingText
              )}
            >
              <ChevronRight className="mr-1" size={18} />
              Actions
            </h3>

            <div className="flex flex-wrap gap-2">
              <button className="px-3 py-1.5 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-md text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-colors">
                View History
              </button>
              <button className="px-3 py-1.5 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded-md text-sm font-medium hover:bg-green-100 dark:hover:bg-green-800/50 transition-colors">
                Place Order
              </button>
              <button
                className={cn(
                  "px-3 py-1.5 bg-slate-50 dark:bg-gray-700 text-slate-700 dark:text-gray-300 rounded-md text-sm font-medium hover:bg-slate-100 dark:hover:bg-gray-600 transition-colors"
                )}
              >
                Generate Report
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3
            className={cn(
              "text-base font-medium flex items-center",
              colors.subheadingText
            )}
          >
            <ChevronRight className="mr-1" size={18} />
            Stock Distribution
          </h3>

          <div
            className={cn(
              "rounded-md p-3 h-64",
              theme === "dark" ? "bg-gray-900" : "bg-slate-50"
            )}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  {
                    name: item.name,
                    New: item.newStock,
                    Repro: item.reproStock,
                    Threshold: item.threshold,
                  },
                ]}
                margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={colors.chartGrid}
                />
                <XAxis
                  dataKey="name"
                  stroke={colors.chartAxis}
                  tick={{ fill: colors.chartText }}
                />
                <YAxis
                  stroke={colors.chartAxis}
                  tick={{ fill: colors.chartText }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "6px",
                    border: `1px solid ${colors.chartTooltipBorder}`,
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    backgroundColor: colors.chartTooltipBg,
                    color: colors.chartText,
                  }}
                />
                <Legend verticalAlign="top" height={36} />
                <Bar
                  dataKey="New"
                  name="New Drums"
                  fill={getThemeBarColor(item.category, false)}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="Repro"
                  name="Repro Drums"
                  fill={getThemeBarColor(item.category, true)}
                  radius={[4, 4, 0, 0]}
                />
                <ReferenceLine
                  y={item.threshold}
                  stroke={colors.threshold}
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{
                    value: "Threshold",
                    position: "right",
                    fill: theme === "dark" ? "#d1d5db" : "#737373",
                    fontSize: 12,
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md text-sm text-blue-700 dark:text-blue-300">
            <p className="font-medium mb-1">Inventory Status</p>
            <p className="text-blue-600 dark:text-blue-200">
              {item.total >= (item.threshold || 0) * 1.5
                ? "Stock levels are healthy and well above threshold."
                : item.total >= (item.threshold || 0)
                  ? "Stock levels are adequate but approaching threshold."
                  : "Stock is below threshold and should be reordered soon."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
