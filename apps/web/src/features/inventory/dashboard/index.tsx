"use client";

import { useState, useEffect } from "react";
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
import {
  ArrowUpDown,
  Filter,
  Search,
  AlertTriangle,
  Package,
  Maximize2,
  Minimize2,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DrumInventory } from "../types";
import { useTheme } from "next-themes";

/**
 * Redesigned ChemicalInventoryDashboard with improved color palette,
 * better UX, and fixes for the visual glitch when toggling between
 * expanded and collapsed states.
 */

// Import color utilities
import { colorPalette, getBarColor } from "../utils/colors";

/**
 * ChemicalInventoryDashboard is a React component that renders an interactive
 * dashboard for managing chemical solvent inventory. The data is now pre-fetched
 * server-side and passed as a prop, which allows searching, sorting, and filtering of inventory items,
 * and displays a bar chart visualization of the stock levels. The component
 * also provides summary statistics.
 * Users can view detailed information about individual inventory items
 * through a conditional detail panel.
 */

interface ChemicalInventoryDashboardProps {
  initialData: DrumInventory[];
}

// Define color schemes for light and dark modes
const colorSchemes = {
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

export default function ChemicalInventoryDashboard({
  initialData,
}: ChemicalInventoryDashboardProps) {
  const { theme } = useTheme();
  const [inventory] = useState<DrumInventory[]>(initialData);
  const [filteredInventory, setFilteredInventory] =
    useState<DrumInventory[]>(initialData);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });
  const [selectedItem, setSelectedItem] = useState<DrumInventory | null>(null);
  const [showLowStock, setShowLowStock] = useState(false);
  const [isChartExpanded, setIsChartExpanded] = useState(false);

  // Get color scheme based on theme
  const colors = theme === "dark" ? colorSchemes.dark : colorSchemes.light;

  // Get theme appropriate bar color
  const getThemeBarColor = (group: string, isRepro: boolean) => {
    const colorKey = isRepro ? `repro${group}` : group;

    // Type-safe check if the key exists in the colors.groups
    if (colorKey in colors.groups) {
      return colors.groups[colorKey as keyof typeof colors.groups];
    }

    // Return default fallback colors for repro and new
    return isRepro ? "#93c5fd" : "#60a5fa";
  };

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
    const visibleItems = Math.max(filteredInventory.length, minItems);
    // Add extra space for chart padding, legend, and labels
    return visibleItems * itemHeight + 100;
  };

  // Summary statistics
  const totalNew = filteredInventory.reduce(
    (sum, item) => sum + item.newStock,
    0
  );
  const totalRepro = filteredInventory.reduce(
    (sum, item) => sum + (item.reproStock || 0),
    0
  );
  const totalStock = totalNew + totalRepro;
  const lowStockCount = filteredInventory.filter(
    (item) => item.newStock + item.reproStock < (item.threshold || 0)
  ).length;

  // Pre-calculate colors for the initial data
  const inventoryWithColors = inventory.map((item) => {
    if (!item.groupColour) {
      return {
        ...item,
        groupColour: {
          new: getBarColor(item.chGroup, false),
          repro: getBarColor(item.chGroup, true),
        },
      };
    }
    return item;
  });

  // Handle filtering and sorting
  const applyFiltersAndSort = () => {
    // Apply filters and search
    let result = [...inventory]; // Colors are already included from server-side

    if (searchTerm) {
      result = result.filter(
        (item) =>
          (item.name &&
            item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item.code &&
            item.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item.category &&
            item.category.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      // Auto-expand chart when searching
      setIsChartExpanded(true);
    }

    if (showLowStock) {
      result = result.filter(
        (item) => item.newStock + item.reproStock < (item.threshold || 0)
      );
      // Auto-expand chart when filtering low stock
      setIsChartExpanded(true);
    }

    if (!result || result.length === 0) return [];

    // Apply sorting
    result.sort((a, b) => {
      if (
        a[sortConfig.key as keyof DrumInventory] != null &&
        b[sortConfig.key as keyof DrumInventory] != null &&
        a[sortConfig.key as keyof DrumInventory] <
          b[sortConfig.key as keyof DrumInventory]
      ) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (
        a[sortConfig.key as keyof DrumInventory] != null &&
        b[sortConfig.key as keyof DrumInventory] != null &&
        a[sortConfig.key as keyof DrumInventory] >
          b[sortConfig.key as keyof DrumInventory]
      ) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });

    return result;
  };

  // Apply filtering and sorting when search/sort/filter changes
  useEffect(() => {
    const filteredResult = applyFiltersAndSort();
    setFilteredInventory(filteredResult);
  }, [searchTerm, sortConfig, showLowStock]);

  const handleSort = (key: string) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        (prevConfig.key === key && prevConfig.direction === "asc") ||
        (key === "total" && prevConfig.key !== "total")
          ? "desc"
          : "asc",
    }));
  };

  const handleBarClick = (item: DrumInventory) => {
    setSelectedItem(item);
  };

  // Custom tooltip formatter to show both drum types
  const tooltipFormatter = (value: any, name: string, props: any) => {
    if (name === "newStock") return [value, "New Drums"];
    if (name === "reproStock") return [value, "Repro Drums"];
    return [value, name];
  };

  // Custom tooltip label formatter
  const tooltipLabelFormatter = (label: string) => {
    const item = filteredInventory.find((item) => item.name === label);
    if (!item) return label;

    return `${item.code} - ${label} (${item.category})`;
  };

  // No loading or error states needed since data is pre-fetched server-side

  // Add missing components
  const PieChart = ({
    data,
    colors,
    theme,
  }: {
    data: number[];
    colors: string[];
    theme: string;
  }) => {
    // Simple pie chart implementation
    const total = data.reduce((sum, value) => sum + value, 0);

    return (
      <svg width="100%" height="100%" viewBox="0 0 100 100">
        {data.map((value, index) => {
          const percentage = value / total;
          const startAngle = data
            .slice(0, index)
            .reduce((sum, v) => sum + (v / total) * 360, 0);
          const endAngle = startAngle + percentage * 360;
          const startRad = (startAngle - 90) * (Math.PI / 180);
          const endRad = (endAngle - 90) * (Math.PI / 180);

          const x1 = 50 + 40 * Math.cos(startRad);
          const y1 = 50 + 40 * Math.sin(startRad);
          const x2 = 50 + 40 * Math.cos(endRad);
          const y2 = 50 + 40 * Math.sin(endRad);

          const largeArcFlag = percentage > 0.5 ? 1 : 0;

          const pathData = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

          return (
            <path
              key={index}
              d={pathData}
              fill={colors[index]}
              stroke={theme === "dark" ? "#1f2937" : "#fff"}
              strokeWidth="0.5"
            />
          );
        })}
      </svg>
    );
  };

  const LineChart = ({
    data,
    colors,
    gridColor,
    textColor,
    theme,
  }: {
    data: { month: string; value: number }[];
    colors: string[];
    gridColor: string;
    textColor: string;
    theme: string;
  }) => {
    // Simple line chart implementation
    const maxValue = Math.max(...data.map((item) => item.value));
    const padding = 10;
    const chartWidth = 100 - padding * 2;
    const chartHeight = 80 - padding * 2;

    const points = data.map((item, index) => ({
      x: padding + index * (chartWidth / (data.length - 1)),
      y: 100 - padding - (item.value / maxValue) * chartHeight,
    }));

    const pathData = points
      .map((point, i) => `${i === 0 ? "M" : "L"} ${point.x} ${point.y}`)
      .join(" ");

    return (
      <svg width="100%" height="100%" viewBox="0 0 100 100">
        {/* Grid lines */}
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={100 - padding}
          stroke={gridColor}
          strokeWidth="0.2"
        />
        <line
          x1={padding}
          y1={100 - padding}
          x2={100 - padding}
          y2={100 - padding}
          stroke={gridColor}
          strokeWidth="0.2"
        />

        {/* Horizontal grid lines */}
        {[0.25, 0.5, 0.75].map((ratio, i) => (
          <line
            key={i}
            x1={padding}
            y1={100 - padding - chartHeight * ratio}
            x2={100 - padding}
            y2={100 - padding - chartHeight * ratio}
            stroke={gridColor}
            strokeWidth="0.2"
            strokeDasharray="1,1"
          />
        ))}

        {/* Line */}
        <path d={pathData} fill="none" stroke={colors[0]} strokeWidth="1.5" />

        {/* Data points */}
        {points.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r="1.5"
            fill={theme === "dark" ? "#fff" : colors[0]}
            stroke={colors[0]}
            strokeWidth="1"
          />
        ))}

        {/* X-axis labels */}
        {data.map((item, i) => (
          <text
            key={i}
            x={padding + i * (chartWidth / (data.length - 1))}
            y={100 - padding / 2}
            textAnchor="middle"
            fill={textColor}
            fontSize="3"
          >
            {item.month.substring(0, 3)}
          </text>
        ))}
      </svg>
    );
  };

  // Add missing variables/data
  const outOfStockItems = filteredInventory.filter(
    (item) => item.newStock + item.reproStock === 0
  );

  // Chemical group distribution data
  const stockStatusLabels = [
    "Hydrocarbons",
    "Gen Solvents",
    "Aromatics",
    "Out of Stock",
  ];
  const stockGroupData = [
    filteredInventory.filter((item) => item.chGroup === "Hydrocarbons").length,
    filteredInventory.filter((item) => item.chGroup === "Gen Solvents").length,
    filteredInventory.filter((item) => item.chGroup === "Aromatics").length,
    outOfStockItems.length,
  ];

  const usageTrendsData = [
    { month: "January", value: 42 },
    { month: "February", value: 53 },
    { month: "March", value: 58 },
    { month: "April", value: 69 },
    { month: "May", value: 52 },
    { month: "June", value: 47 },
  ];

  return (
    <div
      className={`${theme === "light" ? colorSchemes.light.background : colorSchemes.dark.background} transition-colors duration-200 p-6 rounded-lg`}
    >
      <div className="flex flex-col md:flex-row items-start justify-between mb-6 gap-4">
        <div>
          <h1
            className={`text-2xl font-bold ${theme === "light" ? colorSchemes.light.headingColor : colorSchemes.dark.headingColor}`}
          >
            Chemical Solvent Inventory
          </h1>
          <p
            className={`${theme === "light" ? colorSchemes.light.textColor : colorSchemes.dark.textColor}`}
          >
            Monitor your chemical inventory levels and usage trends
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search chemicals..."
              className={`w-full px-4 py-2 rounded-md border ${theme === "light" ? colorSchemes.light.borderColor : colorSchemes.dark.borderColor} ${theme === "light" ? "bg-white" : "bg-gray-800"} ${theme === "light" ? "text-gray-700" : "text-gray-200"} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <Search
                size={20}
                className={`h-5 w-5 ${theme === "light" ? "text-gray-400" : "text-gray-500"}`}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              aria-label="Sort by"
              value={sortConfig.key}
              onChange={(e) =>
                setSortConfig({
                  key: e.target.value,
                  direction: sortConfig.direction,
                })
              }
              className={`px-4 py-2 rounded-md border ${theme === "light" ? colorSchemes.light.borderColor : colorSchemes.dark.borderColor} ${theme === "light" ? "bg-white" : "bg-gray-800"} ${theme === "light" ? "text-gray-700" : "text-gray-200"} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              <option value="name">Name</option>
              <option value="currentStock">Current Stock</option>
              <option value="reorderLevel">Reorder Level</option>
              <option value="usageRate">Usage Rate</option>
            </select>
            <button
              onClick={() =>
                setSortConfig({
                  key: sortConfig.key,
                  direction: sortConfig.direction === "asc" ? "desc" : "asc",
                })
              }
              className={`p-2 rounded-md border ${theme === "light" ? colorSchemes.light.borderColor : colorSchemes.dark.borderColor} ${theme === "light" ? "bg-white" : "bg-gray-800"} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              {sortConfig.direction === "asc" ? (
                <ArrowUpDown
                  size={16}
                  className={`h-5 w-5 ${theme === "light" ? "text-gray-700" : "text-gray-300"}`}
                />
              ) : (
                <ArrowUpDown
                  size={16}
                  className={`h-5 w-5 ${theme === "light" ? "text-gray-700" : "text-gray-300"}`}
                />
              )}
            </button>
            <button
              onClick={() => setShowLowStock(!showLowStock)}
              className={`p-2 rounded-md border ${showLowStock ? "border-red-500" : theme === "light" ? colorSchemes.light.borderColor : colorSchemes.dark.borderColor} ${
                showLowStock
                  ? theme === "light"
                    ? "bg-red-50"
                    : "bg-red-900/20"
                  : theme === "light"
                    ? "bg-white"
                    : "bg-gray-800"
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              title={
                showLowStock ? "Show all items" : "Show only low stock items"
              }
            >
              <AlertTriangle
                size={16}
                className={`h-5 w-5 ${showLowStock ? "text-red-500" : theme === "light" ? "text-gray-400" : "text-gray-500"}`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* New Top Cards for Total New and Repro Stock */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div
          className={`${theme === "light" ? "bg-white" : "bg-gray-800"} p-3 rounded-lg shadow-sm border ${theme === "light" ? "border-slate-100" : "border-gray-700"}`}
        >
          <h3
            className={`${theme === "light" ? "text-slate-500" : "text-gray-400"} text-sm`}
          >
            New Drums
          </h3>
          <div className="flex items-center">
            <div
              className={`w-4 h-4 rounded mr-2 ${theme === "light" ? "bg-gradient-to-r from-blue-500 to-blue-600" : "bg-gradient-to-r from-blue-600 to-blue-700"}`}
            ></div>
            <span
              className={`text-2xl font-bold ${theme === "light" ? "text-slate-800" : "text-gray-100"}`}
            >
              {totalNew}
            </span>
          </div>
        </div>

        <div
          className={`${theme === "light" ? "bg-white" : "bg-gray-800"} p-3 rounded-lg shadow-sm border ${theme === "light" ? "border-slate-100" : "border-gray-700"}`}
        >
          <h3
            className={`${theme === "light" ? "text-slate-500" : "text-gray-400"} text-sm`}
          >
            Repro Drums
          </h3>
          <div className="flex items-center">
            <div
              className={`w-4 h-4 rounded mr-2 ${theme === "light" ? "bg-gradient-to-r from-blue-700 to-blue-800" : "bg-gradient-to-r from-blue-800 to-blue-900"}`}
            ></div>
            <span
              className={`text-2xl font-bold ${theme === "light" ? "text-slate-800" : "text-gray-100"}`}
            >
              {totalRepro}
            </span>
          </div>
        </div>

        <div
          className={`${theme === "light" ? "bg-white" : "bg-gray-800"} p-3 rounded-lg shadow-sm border ${theme === "light" ? "border-slate-100" : "border-gray-700"}`}
        >
          <h3
            className={`${theme === "light" ? "text-slate-500" : "text-gray-400"} text-sm`}
          >
            Total Drums
          </h3>
          <div className="flex items-center">
            <div
              className={`w-4 h-4 rounded mr-2 ${theme === "light" ? "bg-gradient-to-r from-green-500 to-green-600" : "bg-gradient-to-r from-green-600 to-green-700"}`}
            ></div>
            <span
              className={`text-2xl font-bold ${theme === "light" ? "text-slate-800" : "text-gray-100"}`}
            >
              {totalStock}
            </span>
          </div>
        </div>

        <div
          className={`${theme === "light" ? "bg-white" : "bg-gray-800"} p-3 rounded-lg shadow-sm border ${theme === "light" ? "border-slate-100" : "border-gray-700"}`}
        >
          <h3
            className={`${theme === "light" ? "text-slate-500" : "text-gray-400"} text-sm`}
          >
            Low Stock Items
          </h3>
          <div className="flex items-center">
            <div
              className={`w-4 h-4 rounded mr-2 ${lowStockCount > 0 ? "bg-gradient-to-r from-amber-500 to-amber-600" : "bg-gradient-to-r from-green-500 to-green-600"}`}
            ></div>
            <span
              className={`text-2xl font-bold ${lowStockCount > 0 ? (theme === "light" ? "text-amber-600" : "text-amber-400") : theme === "light" ? "text-slate-800" : "text-gray-100"}`}
            >
              {lowStockCount}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div
          className={`col-span-1 rounded-lg ${theme === "light" ? colorSchemes.light.cardBackground : colorSchemes.dark.cardBackground} p-6 shadow-sm border ${theme === "light" ? colorSchemes.light.borderColor : colorSchemes.dark.borderColor}`}
        >
          <h2
            className={`text-lg font-semibold mb-4 ${theme === "light" ? colorSchemes.light.headingColor : colorSchemes.dark.headingColor}`}
          >
            Inventory Summary
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span
                  className={`${theme === "light" ? colorSchemes.light.textColor : colorSchemes.dark.textColor}`}
                >
                  Total Chemicals
                </span>
                <span
                  className={`font-semibold ${theme === "light" ? colorSchemes.light.headingColor : colorSchemes.dark.headingColor}`}
                >
                  {filteredInventory.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: "100%" }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span
                  className={`${theme === "light" ? colorSchemes.light.textColor : colorSchemes.dark.textColor}`}
                >
                  Low Stock Items
                </span>
                <span
                  className={`font-semibold ${lowStockCount > 0 ? "text-amber-600 dark:text-amber-400" : theme === "light" ? colorSchemes.light.headingColor : colorSchemes.dark.headingColor}`}
                >
                  {lowStockCount}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                <div
                  className={`${lowStockCount > 0 ? "bg-amber-500" : "bg-green-500"} h-2 rounded-full`}
                  style={{
                    width: `${(lowStockCount / filteredInventory.length) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span
                  className={`${theme === "light" ? colorSchemes.light.textColor : colorSchemes.dark.textColor}`}
                >
                  Out of Stock
                </span>
                <span
                  className={`font-semibold ${outOfStockItems.length > 0 ? "text-red-600 dark:text-red-400" : theme === "light" ? colorSchemes.light.headingColor : colorSchemes.dark.headingColor}`}
                >
                  {outOfStockItems.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                <div
                  className={`${outOfStockItems.length > 0 ? "bg-red-500" : "bg-green-500"} h-2 rounded-full`}
                  style={{
                    width: `${(outOfStockItems.length / filteredInventory.length) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`col-span-1 rounded-lg ${theme === "light" ? colorSchemes.light.cardBackground : colorSchemes.dark.cardBackground} p-6 shadow-sm border ${theme === "light" ? colorSchemes.light.borderColor : colorSchemes.dark.borderColor}`}
        >
          <h2
            className={`text-lg font-semibold mb-4 ${theme === "light" ? colorSchemes.light.headingColor : colorSchemes.dark.headingColor}`}
          >
            Chemical Group Distribution
          </h2>
          <div className="h-48 flex items-center justify-center">
            <PieChart
              data={stockGroupData}
              colors={
                theme === "light"
                  ? colorSchemes.light.pieColors
                  : colorSchemes.dark.pieColors
              }
              theme={theme || "light"}
            />
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {stockStatusLabels.map((label, index) => (
              <div key={label} className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{
                    backgroundColor:
                      theme === "light"
                        ? colorSchemes.light.pieColors[index]
                        : colorSchemes.dark.pieColors[index],
                  }}
                ></div>
                <span
                  className={`text-sm ${theme === "light" ? colorSchemes.light.textColor : colorSchemes.dark.textColor}`}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          className={`col-span-1 rounded-lg ${theme === "light" ? colorSchemes.light.cardBackground : colorSchemes.dark.cardBackground} p-6 shadow-sm border ${theme === "light" ? colorSchemes.light.borderColor : colorSchemes.dark.borderColor}`}
        >
          <h2
            className={`text-lg font-semibold mb-4 ${theme === "light" ? colorSchemes.light.headingColor : colorSchemes.dark.headingColor}`}
          >
            Monthly Usage Trends
          </h2>
          <div className="h-48">
            <LineChart
              data={usageTrendsData}
              colors={
                theme === "light"
                  ? colorSchemes.light.chartColors
                  : colorSchemes.dark.chartColors
              }
              gridColor={
                theme === "light"
                  ? colorSchemes.light.gridColor
                  : colorSchemes.dark.gridColor
              }
              textColor={
                theme === "light"
                  ? colorSchemes.light.textColor
                  : colorSchemes.dark.textColor
              }
              theme={theme || "light"}
            />
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      <div
        className={cn(
          "p-4 rounded-lg shadow-sm border mb-4",
          colors.cardBg,
          colors.cardBorder
        )}
      >
        <h2 className={cn("text-lg font-semibold mb-4", colors.headingText)}>
          Solvent Drum Inventory
        </h2>

        {filteredInventory.length === 0 ? (
          <div className={cn("text-center py-16", colors.bodyText)}>
            No matching inventory items found.
          </div>
        ) : (
          <div
            className={cn(
              "transition-all duration-300 ease-in-out",
              isChartExpanded ? "" : "h-[75vh] overflow-y-auto"
            )}
            style={{
              // Fixed size container to prevent layout shift
              height: isChartExpanded
                ? `${calculateChartContainerHeight()}px`
                : "75vh",
            }}
          >
            {/* Important: Setting width/height to 100% and avoiding animation makes the chart stable */}
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={filteredInventory}
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
                    isChartExpanded
                      ? 0
                      : Math.ceil(filteredInventory.length / 15)
                  }
                  onClick={(data) => {
                    // Find the corresponding inventory item by name
                    const item = filteredInventory.find(
                      (entry) => entry.name === data
                    );
                    if (item) handleBarClick(item);
                  }}
                  stroke={colors.chartAxis}
                />

                {/* Add a second axis that shows categories in collapsed view */}
                {!isChartExpanded && (
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
                      const item = filteredInventory.find(
                        (entry) => entry.name === data
                      );
                      if (item) handleBarClick(item);
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
                  {filteredInventory.map((entry, index) => (
                    <Cell
                      key={`new-${index}`}
                      fill={
                        theme === "dark"
                          ? getThemeBarColor(entry.chGroup, false)
                          : entry.groupColour.new
                      }
                      onClick={() => handleBarClick(entry)}
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
                  {filteredInventory.map((entry, index) => (
                    <Cell
                      key={`repro-${index}`}
                      fill={
                        theme === "dark"
                          ? getThemeBarColor(entry.chGroup, true)
                          : entry.groupColour.repro
                      }
                      onClick={() => handleBarClick(entry)}
                      style={{ cursor: "pointer" }}
                    />
                  ))}
                </Bar>

                {/* Add threshold reference lines */}
                {filteredInventory.map((entry, index) => (
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
        )}
      </div>

      {/* Detail Panel (conditionally rendered) */}
      {selectedItem && (
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
                {selectedItem.code} - {selectedItem.name}
              </h2>
              <p className={cn("text-sm mt-1", colors.bodyText)}>
                {selectedItem.category}
              </p>
            </div>
            <button
              type="button"
              title="Close"
              className={cn(
                "text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
              )}
              onClick={() => setSelectedItem(null)}
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
                      {selectedItem.newStock}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 text-sm">
                    <div className={colors.bodyText}>Repro Drums:</div>
                    <div className={cn("font-medium", colors.headingText)}>
                      {selectedItem.reproStock}
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
                      {selectedItem.total}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 text-sm">
                    <div className={colors.bodyText}>Threshold Level:</div>
                    <div
                      className={cn(
                        "font-medium",
                        selectedItem.total < (selectedItem.threshold || 0)
                          ? "text-amber-600 dark:text-amber-400"
                          : colors.headingText
                      )}
                    >
                      {selectedItem.threshold}
                    </div>
                  </div>
                </div>

                {selectedItem.total < (selectedItem.threshold || 0) && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 rounded-md flex items-center text-sm">
                    <AlertTriangle
                      className="text-amber-500 dark:text-amber-400 mr-2 flex-shrink-0"
                      size={16}
                    />
                    <span className="text-amber-700 dark:text-amber-300">
                      This item is below the reorder threshold and may need to
                      be restocked soon.
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
                        name: selectedItem.name,
                        New: selectedItem.newStock,
                        Repro: selectedItem.reproStock,
                        Threshold: selectedItem.threshold,
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
                      fill={
                        theme === "dark"
                          ? getThemeBarColor(selectedItem.chGroup, false)
                          : getBarColor(selectedItem.chGroup, false)
                      }
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="Repro"
                      name="Repro Drums"
                      fill={
                        theme === "dark"
                          ? getThemeBarColor(selectedItem.chGroup, true)
                          : getBarColor(selectedItem.chGroup, true)
                      }
                      radius={[4, 4, 0, 0]}
                    />
                    <ReferenceLine
                      y={selectedItem.threshold}
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
                  {selectedItem.total >= (selectedItem.threshold || 0) * 1.5
                    ? "Stock levels are healthy and well above threshold."
                    : selectedItem.total >= (selectedItem.threshold || 0)
                      ? "Stock levels are adequate but approaching threshold."
                      : "Stock is below threshold and should be reordered soon."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
