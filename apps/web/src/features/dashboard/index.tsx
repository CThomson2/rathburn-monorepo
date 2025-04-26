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
import { StatCard } from "./components/StatCard";
import { SummaryCard } from "./components/SummaryCard";
import { PieChart } from "./components/PieChart";
import { LineChart } from "./components/LineChart";
import { DrumInventoryChart } from "./components/DrumInventoryChart";
import { DetailPanel } from "./components/DetailPanel";

// Import theme utilities
import {
  useColorScheme,
  getCategoryColor,
  getInventoryStatusVariant,
} from "./utils/theme-colors";

// Mock data for development
const mockInventoryData: DrumInventory[] = [
  {
    id: "1",
    code: "ACT",
    name: "Acetone",
    category: "Gen Solvents",
    newStock: 15,
    reproStock: 8,
    threshold: 10,
    total: 23,
  },
  {
    id: "2",
    code: "MET",
    name: "Methanol",
    category: "Gen Solvents",
    newStock: 5,
    reproStock: 2,
    threshold: 12,
    total: 7,
  },
  {
    id: "3",
    code: "SFA",
    name: "Sulfuric Acid",
    category: "Gen Solvents",
    newStock: 12,
    reproStock: 4,
    threshold: 8,
    total: 16,
  },
  {
    id: "4",
    code: "IHX",
    name: "Isohexane",
    category: "Hydrocarbons",
    newStock: 3,
    reproStock: 1,
    threshold: 5,
    total: 4,
  },
  {
    id: "5",
    code: "CS2",
    name: "Carbon Disulfide",
    category: "Gen Solvents",
    newStock: 10,
    reproStock: 5,
    threshold: 7,
    total: 15,
  },
  {
    id: "6",
    code: "OXY",
    name: "o-Xylene",
    category: "Aromatics",
    newStock: 9,
    reproStock: 7,
    threshold: 10,
    total: 16,
  },
  {
    id: "7",
    code: "ACN",
    name: "Acetonitrile",
    category: "Gen Solvents",
    newStock: 2,
    reproStock: 1,
    threshold: 8,
    total: 3,
  },
];

// Mock chemical item data with additional details
const mockChemicalItems: Record<string, ChemicalItem> = {
  "1": {
    id: "1",
    name: "Acetone",
    formula: "C₃H₆O",
    casNumber: "67-64-1",
    category: "Gen Solvents",
    hazardLevel: "medium",
    storageConditions:
      "Store in a cool, well-ventilated area away from sources of ignition.",
    totalQuantity: 23,
    unit: "L",
    locations: [
      { name: "Main Storage", quantity: 15 },
      { name: "Lab A", quantity: 5 },
      { name: "Lab B", quantity: 3 },
    ],
    lastUpdated: "2023-11-20T10:30:00Z",
    expiryDate: "2024-11-20T00:00:00Z",
    supplier: "Sigma-Aldrich",
    msdsUrl: "https://example.com/msds/acetone",
  },
  "2": {
    id: "2",
    name: "Methanol",
    formula: "CH₃OH",
    casNumber: "67-56-1",
    category: "Gen Solvents",
    hazardLevel: "high",
    storageConditions:
      "Store in a cool, dry place away from sources of heat and ignition.",
    totalQuantity: 7,
    unit: "L",
    locations: [
      { name: "Main Storage", quantity: 4 },
      { name: "Lab C", quantity: 3 },
    ],
    lastUpdated: "2023-11-18T15:45:00Z",
    expiryDate: "2024-10-15T00:00:00Z",
    supplier: "Fisher Scientific",
    notes: "Highly flammable. Use with extreme caution.",
    msdsUrl: "https://example.com/msds/methanol",
  },
  "3": {
    id: "3",
    name: "Sulfuric Acid",
    formula: "H₂SO₄",
    casNumber: "7664-93-9",
    category: "Gen Solvents",
    hazardLevel: "high",
    storageConditions: "Store in acid cabinet with secondary containment.",
    totalQuantity: 16,
    unit: "L",
    locations: [
      { name: "Acid Storage", quantity: 12 },
      { name: "Lab A", quantity: 4 },
    ],
    lastUpdated: "2023-11-15T09:20:00Z",
    expiryDate: "2025-05-10T00:00:00Z",
    supplier: "VWR International",
    msdsUrl: "https://example.com/msds/sulfuric_acid",
  },
  "4": {
    id: "4",
    name: "Isohexane",
    formula: "CH(CH3)3",
    casNumber: "110-54-3",
    category: "Hydrocarbons",
    hazardLevel: "medium",
    storageConditions: "Store in original container in a cool, dark place.",
    totalQuantity: 4,
    unit: "L",
    locations: [
      { name: "Main Storage", quantity: 3 },
      { name: "Lab B", quantity: 1 },
    ],
    lastUpdated: "2023-11-22T14:15:00Z",
    expiryDate: "2024-02-28T00:00:00Z",
    supplier: "Sigma-Aldrich",
    notes: "30% solution. Decomposition may build pressure in container.",
    msdsUrl: "https://example.com/msds/hydrogen_peroxide",
  },
  "5": {
    id: "5",
    name: "Carbon Disulfide",
    formula: "CS₂",
    casNumber: "75-15-0",
    category: "Gen Solvents",
    hazardLevel: "medium",
    storageConditions: "Store in a dry place. Keep container tightly closed.",
    totalQuantity: 15,
    unit: "kg",
    locations: [
      { name: "Base Storage", quantity: 10 },
      { name: "Lab C", quantity: 5 },
    ],
    lastUpdated: "2023-11-19T11:30:00Z",
    expiryDate: "2026-11-19T00:00:00Z",
    supplier: "Fisher Scientific",
    msdsUrl: "https://example.com/msds/sodium_hydroxide",
  },
  "6": {
    id: "6",
    name: "o-Xylene",
    formula: "C₈H₁₀",
    casNumber: "108-38-3",
    category: "Aromatics",
    hazardLevel: "medium",
    storageConditions: "Store in a cool, well-ventilated place.",
    totalQuantity: 16,
    unit: "L",
    locations: [
      { name: "Main Storage", quantity: 10 },
      { name: "Lab A", quantity: 6 },
    ],
    lastUpdated: "2023-11-17T16:45:00Z",
    expiryDate: "2025-01-15T00:00:00Z",
    supplier: "VWR International",
    msdsUrl: "https://example.com/msds/ethyl_acetate",
  },
  "7": {
    id: "7",
    name: "Acetonitrile",
    formula: "CH₃CN",
    casNumber: "75-05-8",
    category: "Gen Solvents",
    hazardLevel: "high",
    storageConditions: "Store in a cool, well-ventilated place.",
    totalQuantity: 3,
    unit: "L",
    locations: [
      { name: "Acid Storage", quantity: 2 },
      { name: "Lab B", quantity: 1 },
    ],
    lastUpdated: "2023-11-21T13:10:00Z",
    expiryDate: "2024-08-30T00:00:00Z",
    supplier: "Sigma-Aldrich",
    notes: "37% solution. Corrosive to metals and tissue.",
    msdsUrl: "https://example.com/msds/hydrochloric_acid",
  },
};

// Helper function to transform inventory data for the chart
function transformInventoryData(data: DrumInventory[]): ChartDrumInventory[] {
  return data.map((item) => ({
    chemical: item.name,
    code: item.code,
    category: item.category,
    newDrums: item.newStock,
    reproDrums: item.reproStock,
    threshold: item.threshold,
    criticalThreshold: Math.ceil(item.threshold * 0.7), // 70% of threshold for demo
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
  const [selectedItem, setSelectedItem] = useState<DrumInventory | null>(null);
  const [showLowStock, setShowLowStock] = useState(false);
  const [isChartExpanded, setIsChartExpanded] = useState(false);
  const [activeView, setActiveView] = useState<"chart" | "table">("chart");
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

  // Sample data for usage trends - would be replaced with real data from API
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
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => setActiveView("chart")}
                >
                  <BarChart2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Chart</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => setActiveView("table")}
                >
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Table</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {filteredInventory.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  No matching inventory items found.
                </div>
              ) : activeView === "chart" ? (
                <DrumInventoryChart
                  data={transformInventoryData(filteredInventory)}
                  // title="Chemical Inventory"
                  // description="Drums by chemical, showing new and reprocessed"
                />
              ) : (
                <div className="rounded-md border">
                  <div className="grid grid-cols-12 bg-muted/50 p-3 text-xs font-medium text-muted-foreground">
                    <div className="col-span-5">Chemical</div>
                    <div className="col-span-2 text-right">New</div>
                    <div className="col-span-2 text-right">Repro</div>
                    <div className="col-span-2 text-right">Total</div>
                    <div className="col-span-1 text-right">Status</div>
                  </div>

                  {filteredInventory.map((item, index) => {
                    const status = getInventoryStatusVariant(
                      item.total,
                      item.threshold,
                      Math.ceil(item.threshold * 0.4)
                    );
                    return (
                      <div
                        key={index}
                        className="grid grid-cols-12 items-center border-t p-3 text-sm cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => {
                          console.log("clicked", item);
                          setSelectedItem(item);
                        }}
                      >
                        <div className="col-span-5 font-medium">
                          {item.name}
                        </div>
                        <div className="col-span-2 text-right">
                          {item.newStock}
                        </div>
                        <div className="col-span-2 text-right">
                          {item.reproStock}
                        </div>
                        <div className="col-span-2 text-right font-medium">
                          {item.total}
                        </div>
                        <div className="col-span-1 text-right">
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Tab Content - Would contain more detailed inventory views */}
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

        {/* Reports Tab Content - Would contain reporting features */}
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

      {/* Detail Panel (conditionally rendered) */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-4xl translate-x-[-50%] translate-y-[-50%] gap-4">
            <DetailPanel
              item={{
                id: selectedItem.id,
                name: selectedItem.name,
                formula: "N/A", // This would come from API in real app
                casNumber: selectedItem.code,
                category: selectedItem.category,
                hazardLevel:
                  selectedItem.total < selectedItem.threshold ? "high" : "low",
                storageConditions: "Standard",
                totalQuantity: selectedItem.total,
                unit: "drums",
                locations: [
                  { name: "Main Storage", quantity: selectedItem.newStock },
                  { name: "Repro Area", quantity: selectedItem.reproStock },
                ],
                lastUpdated: new Date().toISOString(),
                expiryDate: new Date(
                  Date.now() + 180 * 24 * 60 * 60 * 1000
                ).toISOString(),
                supplier: "Various Suppliers",
                notes: `${selectedItem.category} category chemical. Used in manufacturing process.`,
              }}
              onClose={() => setSelectedItem(null)}
              onEdit={handleEditItem}
              onDelete={handleDeleteItem}
              onPrint={handlePrintItem}
              onExport={handleExportItem}
            />
          </div>
        </div>
      )}

      {/* Last updated timestamp */}
      <div className="text-xs text-muted-foreground text-center pt-2">
        Last updated: {lastUpdated.toLocaleString()}
      </div>
    </div>
  );
}
