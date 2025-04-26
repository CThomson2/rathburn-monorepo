"use client";

import { useState, useEffect } from "react";
import {
  Search,
  ArrowUpDown,
  AlertTriangle,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { DrumInventory } from "./types";

// Import components
import { StatCard } from "./components/StatCard";
import { SummaryCard } from "./components/SummaryCard";
import { PieChart } from "./components/PieChart";
import { LineChart } from "./components/LineChart";
import { DrumInventoryChart } from "./components/DrumInventoryChart";
import { DetailPanel } from "./components/DetailPanel";

// Import theme utilities
import { useColorScheme } from "./utils/theme-colors";

/**
 * ChemicalInventoryDashboard is a React component that renders an interactive
 * dashboard for managing chemical solvent inventory. The data is pre-fetched
 * server-side and passed as a prop, which allows searching, sorting, and filtering of inventory items,
 * and displays a bar chart visualization of the stock levels. The component
 * also provides summary statistics.
 * Users can view detailed information about individual inventory items
 * through a conditional detail panel.
 */
interface ChemicalInventoryDashboardProps {
  initialData: DrumInventory[];
}

export default function ChemicalInventoryDashboard({
  initialData,
}: ChemicalInventoryDashboardProps) {
  const { theme } = useTheme();
  const colors = useColorScheme();

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
  const outOfStockItems = filteredInventory.filter(
    (item) => item.newStock + item.reproStock === 0
  );

  // Handle filtering and sorting
  const applyFiltersAndSort = () => {
    // Apply filters and search
    let result = [...inventory];

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

  // Chemical group distribution data
  const stockStatusLabels = ["Hydrocarbons", "Gen Solvents", "Aromatics"];
  const stockGroupData = [
    filteredInventory.reduce((acc, item) => {
      if (item.category === "Hydrocarbons") {
        return acc + (item.newStock + item.reproStock);
      }
      return acc;
    }, 0),
    filteredInventory.reduce((acc, item) => {
      if (item.category === "Gen Solvents") {
        return acc + (item.newStock + item.reproStock);
      }
      return acc;
    }, 0),
    filteredInventory.reduce((acc, item) => {
      if (item.category === "Aromatics") {
        return acc + (item.newStock + item.reproStock);
      }
      return acc;
    }, 0),
  ];

  // Sample data for the charts - in real app this would come from API
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
      className={cn(
        "transition-colors duration-200 p-6 rounded-lg",
        colors.background
      )}
    >
      <div className="flex flex-col md:flex-row items-start justify-between mb-6 gap-4">
        <div>
          <h1 className={cn("text-2xl font-bold", colors.headingColor)}>
            Chemical Solvent Inventory
          </h1>
          <p className={colors.textColor}>
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
              className={cn(
                "w-full px-4 py-2 rounded-md border",
                colors.borderColor,
                theme === "dark"
                  ? "bg-gray-800 text-gray-200"
                  : "bg-white text-gray-700",
                "focus:outline-none focus:ring-2 focus:ring-blue-500"
              )}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <Search
                size={20}
                className={`h-5 w-5 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}
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
              className={cn(
                "px-4 py-2 rounded-md border",
                colors.borderColor,
                theme === "dark"
                  ? "bg-gray-800 text-gray-200"
                  : "bg-white text-gray-700",
                "focus:outline-none focus:ring-2 focus:ring-blue-500"
              )}
            >
              <option value="name">Name</option>
              <option value="total">Current Stock</option>
              <option value="threshold">Threshold Level</option>
            </select>

            <button
              onClick={() =>
                setSortConfig({
                  key: sortConfig.key,
                  direction: sortConfig.direction === "asc" ? "desc" : "asc",
                })
              }
              className={cn(
                "p-2 rounded-md border",
                colors.borderColor,
                theme === "dark" ? "bg-gray-800" : "bg-white",
                "focus:outline-none focus:ring-2 focus:ring-blue-500"
              )}
              aria-label={
                sortConfig.direction === "asc"
                  ? "Sort descending"
                  : "Sort ascending"
              }
            >
              <ArrowUpDown
                size={16}
                className={`h-5 w-5 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}
              />
            </button>

            <button
              onClick={() => setShowLowStock(!showLowStock)}
              className={cn(
                "p-2 rounded-md border",
                showLowStock ? "border-red-500" : colors.borderColor,
                showLowStock
                  ? theme === "dark"
                    ? "bg-red-900/20"
                    : "bg-red-50"
                  : theme === "dark"
                    ? "bg-gray-800"
                    : "bg-white",
                "focus:outline-none focus:ring-2 focus:ring-blue-500"
              )}
              title={
                showLowStock ? "Show all items" : "Show only low stock items"
              }
              aria-label={
                showLowStock ? "Show all items" : "Show only low stock items"
              }
            >
              <AlertTriangle
                size={16}
                className={`h-5 w-5 ${showLowStock ? "text-red-500" : theme === "dark" ? "text-gray-500" : "text-gray-400"}`}
              />
            </button>

            <button
              onClick={() => setIsChartExpanded(!isChartExpanded)}
              className={cn(
                "p-2 rounded-md border",
                colors.borderColor,
                theme === "dark" ? "bg-gray-800" : "bg-white",
                "focus:outline-none focus:ring-2 focus:ring-blue-500"
              )}
              title={isChartExpanded ? "Collapse chart" : "Expand chart"}
              aria-label={isChartExpanded ? "Collapse chart" : "Expand chart"}
            >
              {isChartExpanded ? (
                <Minimize2
                  size={16}
                  className={`h-5 w-5 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}
                />
              ) : (
                <Maximize2
                  size={16}
                  className={`h-5 w-5 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}
                />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Top Cards for Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="New Drums"
          value={totalNew}
          iconColorClass={
            theme === "dark"
              ? "bg-gradient-to-r from-blue-600 to-blue-700"
              : "bg-gradient-to-r from-blue-500 to-blue-600"
          }
        />

        <StatCard
          title="Repro Drums"
          value={totalRepro}
          iconColorClass={
            theme === "dark"
              ? "bg-gradient-to-r from-blue-800 to-blue-900"
              : "bg-gradient-to-r from-blue-700 to-blue-800"
          }
        />

        <StatCard
          title="Total Drums"
          value={totalStock}
          iconColorClass={
            theme === "dark"
              ? "bg-gradient-to-r from-green-600 to-green-700"
              : "bg-gradient-to-r from-green-500 to-green-600"
          }
        />

        {/* <StatCard 
          title="Low Stock Items" 
          value={lowStockCount}
          isAlert={lowStockCount > 0}
          iconColorClass={lowStockCount > 0 
            ? "bg-gradient-to-r from-amber-500 to-amber-600" 
            : "bg-gradient-to-r from-green-500 to-green-600"
          }
        /> */}
      </div>

      {/* Middle Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Inventory Summary Card */}
        <SummaryCard
          title="Materials Summary"
          items={[
            {
              label: "Total Materials",
              value: filteredInventory.length,
              total: filteredInventory.length,
            },
            {
              label: "Low Stock Materials",
              value: lowStockCount,
              total: filteredInventory.length,
              isWarning: lowStockCount > 0,
            },
            {
              label: "Out of Stock Materials",
              value: outOfStockItems.length,
              total: filteredInventory.length,
              isError: outOfStockItems.length > 0,
            },
          ]}
        />

        {/* Chemical Group Distribution Card */}
        <div
          className={cn(
            "rounded-lg p-6 shadow-sm border",
            colors.cardBackground,
            colors.borderColor
          )}
        >
          <h2 className={cn("text-lg font-semibold mb-4", colors.headingColor)}>
            Chemical Group Distribution
          </h2>
          <div className="h-48 flex items-center justify-center">
            <PieChart data={stockGroupData} labels={stockStatusLabels} />
          </div>
        </div>

        {/* Monthly Usage Trends Card 
        TODO: Add real data */}
        <div
          className={cn(
            "rounded-lg p-6 shadow-sm border",
            colors.cardBackground,
            colors.borderColor
          )}
        >
          <h2 className={cn("text-lg font-semibold mb-4", colors.headingColor)}>
            Monthly Usage Trends
          </h2>
          <div className="h-48">
            <LineChart data={usageTrendsData} />
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
        <div className="flex justify-between items-center mb-4">
          <h2 className={cn("text-lg font-semibold", colors.headingText)}>
            Drum Stock Overview
          </h2>
        </div>

        {filteredInventory.length === 0 ? (
          <div className={cn("text-center py-16", colors.bodyText)}>
            No matching inventory items found.
          </div>
        ) : (
          <DrumInventoryChart
            inventory={filteredInventory}
            isExpanded={isChartExpanded}
            onItemClick={setSelectedItem}
          />
        )}
      </div>

      {/* Detail Panel (conditionally rendered) */}
      {selectedItem && (
        <DetailPanel
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}
