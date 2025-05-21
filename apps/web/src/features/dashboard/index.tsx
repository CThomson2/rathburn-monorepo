"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  ArrowUpDown,
  AlertTriangle,
  Maximize2,
  Minimize2,
  FileText,
  BarChart2,
  Filter,
  RefreshCw,
  AlertCircle,
  Clock,
  Layers,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { DrumInventory, ChartDrumInventory, ChemicalItem } from "./types";

// Import ShadcnUI components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Import dashboard components
import { StatCard } from "./components/stat-card";
import { SummaryCard } from "./components/summary-card";
import { PieChart } from "./components/PieChart";
import { LineChart } from "./components/LineChart";
import { DrumInventoryChart } from "./components/inventory-chart";
import { DetailPanel } from "./components/detail-panel";
import { BatchesOverview } from "./components/batches-overview";

// Import theme and format utilities
import {
  useColorScheme,
  getCategoryColor,
  getInventoryStatusVariant,
} from "./utils/theme-colors";
import { formatDateTime } from "@/utils/format-date";

// Helper function to transform inventory data for the chart
function transformInventoryData(data: DrumInventory[]): ChartDrumInventory[] {
  return data.map((item) => ({
    chemical: item.name,
    code: item.code,
    category: item.category,
    newDrums: item.newStock,
    reproDrums: item.reproStock,
    threshold: item.threshold,
    criticalThreshold: Math.ceil(item.threshold * 0.7),
    total: item.total,
    unit: "drums",
  }));
}

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
  const colors = useColorScheme();

  const [inventory] = useState<DrumInventory[]>(initialData);
  const [filteredInventory, setFilteredInventory] =
    useState<DrumInventory[]>(initialData);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showLowStock, setShowLowStock] = useState(false);
  const [isChartExpanded, setIsChartExpanded] = useState(false);
  const [activeView, setActiveView] = useState<"chart" | "table" | "batches">(
    "table"
  );
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

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
    setFilteredInventory(filteredResult || []);
  }, [searchTerm, sortConfig, showLowStock, inventory]);

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

  // Sample data for usage trends - would be replaced with real data from API
  // TODO: Replace with real data from Supabase DB API
  const usageTrendsData = [
    { month: "January", value: 42 },
    { month: "February", value: 53 },
    { month: "March", value: 58 },
    { month: "April", value: 69 },
    { month: "May", value: 52 },
    { month: "June", value: 47 },
  ];

  // Function to simulate a refresh of data
  const handleRefresh = () => {
    // In a real app, this would trigger a data refresh from the API
    setLastUpdated(new Date());
  };

  // Mock function for editing a drum inventory item
  const handleEditItem = (id: string) => {
    console.log("Edit item:", id);
    // In a real app, this would open an edit form or navigate to an edit page
  };

  // Mock function for deleting a drum inventory item
  const handleDeleteItem = (id: string) => {
    console.log("Delete item:", id);
    // In a real app, this would show a confirmation dialog and then delete the item
  };

  // Mock function for printing a report
  const handlePrintItem = (id: string) => {
    console.log("Print report for item:", id);
    // In a real app, this would open a print dialog with a formatted report
  };

  // Mock function for exporting an item
  const handleExportItem = (id: string) => {
    console.log("Export item:", id);
    // In a real app, this would trigger a download of the item data
  };

  return (
    <div className={cn("p-6 space-y-6", colors.background)}>
      {/* Header section with title and controls */}
      <div className="flex flex-col md:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Chemical Solvent Inventory</h1>
          <p className="text-muted-foreground">
            Monitor inventory levels and usage trends
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search chemicals..."
              className="pl-8 w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={sortConfig.key}
              onValueChange={(value) =>
                setSortConfig({
                  key: value,
                  direction: sortConfig.direction,
                })
              }
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="total">Current Stock</SelectItem>
                <SelectItem value="threshold">Threshold</SelectItem>
              </SelectContent>
            </Select>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setSortConfig({
                        key: sortConfig.key,
                        direction:
                          sortConfig.direction === "asc" ? "desc" : "asc",
                      })
                    }
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {sortConfig.direction === "asc"
                    ? "Sort descending"
                    : "Sort ascending"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={showLowStock ? "destructive" : "outline"}
                    size="icon"
                    onClick={() => setShowLowStock(!showLowStock)}
                  >
                    <AlertTriangle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {showLowStock
                    ? "Show all items"
                    : "Show only low stock items"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsChartExpanded(!isChartExpanded)}
                  >
                    {isChartExpanded ? (
                      <Minimize2 className="h-4 w-4" />
                    ) : (
                      <Maximize2 className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isChartExpanded ? "Collapse chart" : "Expand chart"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={handleRefresh}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh data</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Top Cards for Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>New Drums</CardDescription>
            <CardTitle className="text-3xl">{totalNew}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Total unused drums in inventory
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Repro Drums</CardDescription>
            <CardTitle className="text-3xl">{totalRepro}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Total reprocessed drums in inventory
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Drums</CardDescription>
            <CardTitle className="text-3xl">{totalStock}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Combined inventory across all categories
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Low Stock Items</CardDescription>
            <CardTitle className="text-3xl">
              <span className={lowStockCount > 0 ? "text-amber-500" : ""}>
                {lowStockCount}
              </span>
              <span className="text-sm text-muted-foreground ml-1">
                / {filteredInventory.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Items below their threshold levels
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab Content */}
        <TabsContent value="overview" className="space-y-4">
          {/* Overview Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Inventory Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Materials Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Total Materials
                    </span>
                    <span className="font-medium">
                      {filteredInventory.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Low Stock Materials
                    </span>
                    <div className="flex items-center">
                      <span className="font-medium">{lowStockCount}</span>
                      {lowStockCount > 0 && (
                        <Badge
                          variant="outline"
                          className="ml-2 bg-amber-50 text-amber-700 border-amber-200"
                        >
                          Warning
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Out of Stock Materials
                    </span>
                    <div className="flex items-center">
                      <span className="font-medium">
                        {outOfStockItems.length}
                      </span>
                      {outOfStockItems.length > 0 && (
                        <Badge variant="destructive" className="ml-2">
                          Critical
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chemical Group Distribution Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Chemical Group Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="h-48 flex items-center justify-center">
                <PieChart data={stockGroupData} labels={stockStatusLabels} />
              </CardContent>
            </Card>

            {/* Monthly Usage Trends Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Monthly Usage Trends</CardTitle>
              </CardHeader>
              <CardContent className="h-48">
                <LineChart data={usageTrendsData} />
              </CardContent>
            </Card>
          </div>

          {/* Main Chart Area */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Drum Stock Overview</CardTitle>
                <CardDescription>
                  Current inventory levels compared to thresholds
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={activeView === "chart" ? "default" : "outline"}
                  size="sm"
                  className="gap-1"
                  onClick={() => setActiveView("chart")}
                >
                  <BarChart2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Chart</span>
                </Button>
                <Button
                  variant={activeView === "table" ? "default" : "outline"}
                  size="sm"
                  className="gap-1"
                  onClick={() => setActiveView("table")}
                >
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Table</span>
                </Button>
                <Button
                  variant={activeView === "batches" ? "default" : "outline"}
                  size="sm"
                  className="gap-1"
                  onClick={() => setActiveView("batches")}
                >
                  <Layers className="h-4 w-4" />
                  <span className="hidden sm:inline">Batches</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {filteredInventory.length === 0 && activeView !== "batches" ? (
                <div className="text-center py-16 text-muted-foreground">
                  No matching inventory items found.
                </div>
              ) : activeView === "chart" ? (
                <div className="max-h-[calc(100vh-280px)] overflow-auto relative">
                  <DrumInventoryChart
                    data={transformInventoryData(filteredInventory)}
                  />
                </div>
              ) : activeView === "table" ? (
                <div className="max-h-[calc(100vh-280px)] overflow-auto relative rounded-md border">
                  <div className="grid grid-cols-12 bg-background text-xs font-medium text-muted-foreground sticky top-0 z-10 border-b-black">
                    <div className="col-span-6 p-3">Chemical</div>
                    <div className="col-span-1 p-3 text-right">Virgin</div>
                    <div className="col-span-1 p-3 text-right">Repro</div>
                    <div className="col-span-1 p-3 text-right pr-4">Total</div>
                    <div className="col-span-1 p-3 text-right pl-4 bg-slate-100 dark:bg-slate-800">
                      En route
                    </div>
                    <div className="col-span-1 p-3 text-right bg-slate-100 dark:bg-slate-800">
                      Distilling
                    </div>
                    <div className="col-span-1 p-3 text-right">Status</div>
                  </div>

                  <div>
                    {filteredInventory.map((item) => {
                      const status = getInventoryStatusVariant(
                        item.total,
                        item.threshold,
                        Math.ceil(item.threshold * 0.4)
                      );
                      return (
                        <div
                          key={item.id}
                          className="grid grid-cols-12 items-center border-t text-sm cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => {
                            console.log("selected material id:", item.id);
                            setSelectedItemId(item.id);
                          }}
                        >
                          <div className="col-span-6 p-3 font-medium">
                            {item.name}
                          </div>
                          <div className="col-span-1 p-3 text-right">
                            {item.newStock}
                          </div>
                          <div className="col-span-1 p-3 text-right">
                            {item.reproStock}
                          </div>
                          <div className="col-span-1 p-3 text-right font-medium pr-4">
                            {item.total}
                          </div>
                          <div className="col-span-1 p-3 text-right pl-4 bg-slate-100 dark:bg-slate-800">
                            {item.pending_stock}
                          </div>
                          <div className="col-span-1 p-3 text-right bg-slate-100 dark:bg-slate-800">
                            {item.processing_stock}
                          </div>
                          <div className="col-span-1 p-3 text-right">
                            {status === "error" && (
                              <Badge
                                variant="destructive"
                                className="text-[10px] px-1.5 py-0"
                              >
                                Low
                              </Badge>
                            )}
                            {status === "warning" && (
                              <Badge
                                variant="default"
                                className="text-[10px] px-1.5 py-0"
                              >
                                Warning
                              </Badge>
                            )}
                            {status === "success" && (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 bg-green-50 text-green-700 border-green-200"
                              >
                                OK
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : activeView === "batches" ? (
                <div className="max-h-[calc(100vh-280px)] overflow-auto relative">
                  <BatchesOverview />
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Tab Content - Placeholder */}
        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Inventory</CardTitle>
              <CardDescription>
                Comprehensive view of all inventory items
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="py-4 text-center text-muted-foreground">
                Detailed inventory view would go here
                <br />
                This would include filtering by location, batch numbers, etc.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab Content - Placeholder */}
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Reports</CardTitle>
              <CardDescription>
                Generate and export inventory reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="py-4 text-center text-muted-foreground">
                Report generation features would go here
                <br />
                This would include usage reports, forecasting, etc.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail Panel (conditionally rendered based on selectedItemId) */}
      {selectedItemId && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-4xl translate-x-[-50%] translate-y-[-50%] gap-4">
            <DetailPanel
              itemId={selectedItemId}
              onClose={() => setSelectedItemId(null)}
              onEdit={handleEditItem}
              onPrint={handlePrintItem}
            />
          </div>
        </div>
      )}

      {/* Last updated timestamp */}
      <div
        className="text-xs text-muted-foreground text-center pt-2"
        suppressHydrationWarning
      >
        Last updated: {formatDateTime(lastUpdated)}
      </div>
    </div>
  );
}
