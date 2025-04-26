/**
 * Theme-aware color utilities for the inventory dashboard
 */
import { useTheme } from "next-themes";

// Define color schemes for light and dark modes
export const colorSchemes = {
  light: {
    background: "bg-white",
    cardBackground: "bg-white",
    chartColors: ["#2563eb", "#4338ca", "#0369a1", "#0891b2", "#0c4a6e"],
    pieColors: ["#2563eb", "#4338ca", "#0369a1", "#0891b2", "#0c4a6e"],
    textColor: "text-gray-700",
    headingColor: "text-gray-900",
    borderColor: "border-gray-200",
    gridColor: "#e2e8f0",
    cardBg: "bg-white",
    cardBorder: "border-slate-100",
    chartGrid: "#e2e8f0",
    chartAxis: "#94a3b8",
    chartText: "#1e293b",
    chartTooltipBorder: "#e2e8f0",
    chartTooltipBg: "#ffffff",
    headingText: "text-slate-800",
    subheadingText: "text-slate-700",
    bodyText: "text-slate-500",
    groups: {
      Hydrocarbons: "#3b82f6",
      Aromatics: "#ef4444",
      "Gen Solvents": "#10b981",
      reproHydrocarbons: "#1d4ed8",
      reproAromatics: "#b91c1c",
      reproGenSolvents: "#047857",
    },
    threshold: "#f59e0b",
  },
  dark: {
    background: "bg-gray-950",
    cardBackground: "bg-gray-900",
    chartColors: ["#3b82f6", "#6366f1", "#06b6d4", "#22d3ee", "#38bdf8"],
    pieColors: ["#3b82f6", "#6366f1", "#06b6d4", "#22d3ee", "#38bdf8"],
    textColor: "text-gray-300",
    headingColor: "text-white",
    borderColor: "border-gray-800",
    gridColor: "#1f2937",
    cardBg: "bg-gray-800",
    cardBorder: "border-gray-700",
    chartGrid: "#374151",
    chartAxis: "#9ca3af",
    chartText: "#f3f4f6",
    chartTooltipBorder: "#4b5563",
    chartTooltipBg: "#1f2937",
    headingText: "text-gray-100",
    subheadingText: "text-gray-200",
    bodyText: "text-gray-400",
    groups: {
      Hydrocarbons: "#60a5fa", // brighter blue
      Aromatics: "#f87171", // brighter red
      "Gen Solvents": "#34d399", // brighter green
      reproHydrocarbons: "#93c5fd", // lighter blue
      reproAromatics: "#fca5a5", // lighter red
      reproGenSolvents: "#6ee7b7", // lighter green
    },
    threshold: "#fbbf24", // amber for threshold
  },
};

export type ColorScheme = typeof colorSchemes.light;

/**
 * Get the color scheme based on the current theme
 */
export function useColorScheme(): ColorScheme {
  const { theme } = useTheme();
  return theme === "dark" ? colorSchemes.dark : colorSchemes.light;
}

/**
 * Get theme appropriate bar color for chemical groups
 */
export function getThemeBarColor(
  group: string,
  isRepro: boolean,
): string {
  const colors = useColorScheme();
  const colorKey = isRepro ? `repro${group}` : group;

  // Type-safe check if the key exists in the colors.groups
  if (colorKey in colors.groups) {
    return colors.groups[colorKey as keyof typeof colors.groups];
  }

  // Return default fallback colors for repro and new
  return isRepro ? "#93c5fd" : "#60a5fa";
}