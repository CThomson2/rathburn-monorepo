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

export default function ChemicalInventoryDashboard({
  initialData,
}: ChemicalInventoryDashboardProps) {
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

  return (
    <div className="p-3 max-w-full bg-slate-50">
      <h2 className="text-xl font-semibold mb-4 text-slate-800">
        Chemical Solvent Inventory
      </h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-100">
          <h3 className="text-slate-500 text-sm">Total Drums</h3>
          <div className="flex items-center">
            <Package className="mr-2 text-slate-700" size={18} />
            <span className="text-2xl font-bold text-slate-800">
              {totalStock}
            </span>
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-100">
          <h3 className="text-slate-500 text-sm">New Drums</h3>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded mr-2 bg-gradient-to-r from-blue-500 to-blue-600"></div>
            <span className="text-2xl font-bold text-slate-800">
              {totalNew}
            </span>
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-100">
          <h3 className="text-slate-500 text-sm">Repro Drums</h3>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded mr-2 bg-gradient-to-r from-blue-700 to-blue-800"></div>
            <span className="text-2xl font-bold text-slate-800">
              {totalRepro}
            </span>
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-100">
          <h3 className="text-slate-500 text-sm">Low Stock Alert</h3>
          <div className="flex items-center">
            <AlertTriangle className="mr-2 text-amber-500" size={18} />
            <span className="text-2xl font-bold text-slate-800">
              {lowStockCount}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="flex items-center bg-white rounded-lg shadow-sm border border-slate-100 px-3 py-2 flex-grow">
          <Search className="text-slate-400 mr-2" size={16} />
          <input
            type="text"
            placeholder="Search by name, code or chemical group..."
            className="flex-grow focus:outline-none text-sm text-slate-800"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            className={`flex items-center rounded-lg shadow-sm px-3 py-1.5 text-sm ${
              sortConfig.key === "name"
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "bg-white text-slate-700 border border-slate-100"
            }`}
            onClick={() => handleSort("name")}
          >
            <ArrowUpDown size={16} className="mr-1.5" />
            Sort by Name
          </button>

          <button
            className={`flex items-center rounded-lg shadow-sm px-3 py-1.5 text-sm ${
              sortConfig.key === "code"
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "bg-white text-slate-700 border border-slate-100"
            }`}
            onClick={() => handleSort("code")}
          >
            <ArrowUpDown size={16} className="mr-1.5" />
            Sort by Code
          </button>

          <button
            className={`flex items-center rounded-lg shadow-sm px-3 py-1.5 text-sm ${
              sortConfig.key === "total"
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "bg-white text-slate-700 border border-slate-100"
            }`}
            onClick={() => handleSort("total")}
          >
            <ArrowUpDown size={16} className="mr-1.5" />
            Sort by Total
          </button>

          <button
            className={`flex items-center rounded-lg shadow-sm px-3 py-1.5 text-sm ${
              showLowStock
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "bg-white text-slate-700 border border-slate-100"
            }`}
            onClick={() => setShowLowStock(!showLowStock)}
          >
            <Filter size={16} className="mr-1.5" />
            {showLowStock ? "All Items" : "Below Threshold"}
          </button>

          <button
            className="flex items-center bg-white rounded-lg shadow-sm px-3 py-1.5 text-sm text-slate-700 border border-slate-100"
            onClick={() => setIsChartExpanded(!isChartExpanded)}
          >
            {isChartExpanded ? (
              <>
                <Minimize2 size={16} className="mr-1.5" />
                Collapse Chart
              </>
            ) : (
              <>
                <Maximize2 size={16} className="mr-1.5" />
                Expand Chart
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 mb-4">
        <h2 className="text-lg font-semibold mb-4 text-slate-800">
          Solvent Drum Inventory
        </h2>

        {filteredInventory.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
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
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  label={{
                    value: "Number of Drums",
                    position: "insideBottom",
                    offset: -5,
                    style: { fill: "#64748b", fontWeight: 500 },
                  }}
                  stroke="#94a3b8"
                  tickLine={{ stroke: "#94a3b8" }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{
                    fontSize: 12,
                    textAnchor: "end",
                    fill: "#1e293b",
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
                  stroke="#94a3b8"
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
                      fill: "#64748b",
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
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Legend
                  wrapperStyle={{
                    paddingTop: 15,
                    paddingBottom: 5,
                    borderTop: "1px solid #e2e8f0",
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
                      color: colorPalette.new.Hydrocarbons,
                      id: "hydrocarbons",
                    },
                    // General Solvents
                    {
                      value: "General Solvents",
                      type: "circle",
                      color: colorPalette.new["Gen Solvents"],
                      id: "generalSolvents",
                    },
                    // Aromatics
                    {
                      value: "Aromatics",
                      type: "circle",
                      color: colorPalette.new.Aromatics,
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
                      fill={entry.groupColour.new}
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
                      fill={entry.groupColour.repro}
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
                    stroke={colorPalette.ui.threshold}
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
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-800 flex items-center">
                {selectedItem.code} - {selectedItem.name}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {selectedItem.category}
              </p>
            </div>
            <button
              type="button"
              title="Close"
              className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
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
                <h3 className="text-base font-medium text-slate-700 flex items-center">
                  <ChevronRight className="mr-1" size={18} />
                  Inventory Details
                </h3>

                <div className="bg-slate-50 rounded-md p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-x-4 text-sm">
                    <div className="text-slate-500">New Drums:</div>
                    <div className="font-medium text-slate-800">
                      {selectedItem.newStock}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 text-sm">
                    <div className="text-slate-500">Repro Drums:</div>
                    <div className="font-medium text-slate-800">
                      {selectedItem.reproStock}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 text-sm border-t border-slate-200 pt-2 mt-2">
                    <div className="text-slate-500">Total Stock:</div>
                    <div className="font-medium text-slate-800">
                      {selectedItem.total}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 text-sm">
                    <div className="text-slate-500">Threshold Level:</div>
                    <div
                      className={`font-medium ${
                        selectedItem.total < (selectedItem.threshold || 0)
                          ? "text-amber-600"
                          : "text-slate-800"
                      }`}
                    >
                      {selectedItem.threshold}
                    </div>
                  </div>
                </div>

                {selectedItem.total < (selectedItem.threshold || 0) && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-md flex items-center text-sm">
                    <AlertTriangle
                      className="text-amber-500 mr-2 flex-shrink-0"
                      size={16}
                    />
                    <span className="text-amber-700">
                      This item is below the reorder threshold and may need to
                      be restocked soon.
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-medium text-slate-700 flex items-center">
                  <ChevronRight className="mr-1" size={18} />
                  Actions
                </h3>

                <div className="flex flex-wrap gap-2">
                  <button className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors">
                    View History
                  </button>
                  <button className="px-3 py-1.5 bg-green-50 text-green-700 rounded-md text-sm font-medium hover:bg-green-100 transition-colors">
                    Place Order
                  </button>
                  <button className="px-3 py-1.5 bg-slate-50 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-100 transition-colors">
                    Generate Report
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-medium text-slate-700 flex items-center">
                <ChevronRight className="mr-1" size={18} />
                Stock Distribution
              </h3>

              <div className="bg-slate-50 rounded-md p-3 h-64">
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
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "6px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Bar
                      dataKey="New"
                      name="New Drums"
                      fill={getBarColor(selectedItem.chGroup, false)}
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="Repro"
                      name="Repro Drums"
                      fill={getBarColor(selectedItem.chGroup, true)}
                      radius={[4, 4, 0, 0]}
                    />
                    <ReferenceLine
                      y={selectedItem.threshold}
                      stroke={colorPalette.ui.threshold}
                      strokeDasharray="5 5"
                      strokeWidth={2}
                      label={{
                        value: "Threshold",
                        position: "right",
                        fill: "#737373",
                        fontSize: 12,
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
                <p className="font-medium mb-1">Inventory Status</p>
                <p className="text-blue-600">
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
