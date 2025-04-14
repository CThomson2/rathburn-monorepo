"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/core/ui/table";
import { Badge } from "@/components/core/ui/badge";

interface StockHistoryStatsProps {
  materialCode: string | null;
  timeRange: string;
  filters: {
    drumType: string;
    supplier: string;
  };
  mode: "summary" | "suppliers" | "materials";
}

// Mock data for demo purposes
const MOCK_SUMMARY_DATA = {
  totalDrums: 485,
  averageStock: 412,
  minStock: 350,
  maxStock: 520,
  currentStock: 485,
  change30d: 35,
  change90d: -15,
  changeYTD: 85,
};

const MOCK_MATERIALS_DATA = [
  { name: "Hexane", code: "HEX", quantity: 120, percentage: 25, change: 15 },
  { name: "Methanol", code: "MET", quantity: 95, percentage: 20, change: -5 },
  { name: "Ethanol", code: "ETH", quantity: 75, percentage: 15, change: 0 },
  { name: "Acetone", code: "ACT", quantity: 65, percentage: 13, change: 10 },
  { name: "Toluene", code: "TOL", quantity: 50, percentage: 10, change: -8 },
  { name: "Other", code: "OTH", quantity: 80, percentage: 17, change: 3 },
];

const MOCK_SUPPLIERS_DATA = [
  {
    name: "Brenntag UK",
    id: "1",
    quantity: 150,
    percentage: 31,
    change: 10,
    reliability: 95,
  },
  {
    name: "Sigma-Aldrich",
    id: "2",
    quantity: 120,
    percentage: 25,
    change: -8,
    reliability: 92,
  },
  {
    name: "VWR International",
    id: "3",
    quantity: 80,
    percentage: 16,
    change: 5,
    reliability: 90,
  },
  {
    name: "Fisher Scientific",
    id: "4",
    quantity: 75,
    percentage: 15,
    change: 0,
    reliability: 88,
  },
  {
    name: "Merck KGaA",
    id: "5",
    quantity: 60,
    percentage: 13,
    change: -2,
    reliability: 94,
  },
];

// Chart colors
const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];

export default function StockHistoryStats({
  materialCode,
  timeRange,
  filters,
  mode,
}: StockHistoryStatsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 800));
        // In a real implementation, fetch data from API
      } catch (err) {
        console.error("Error fetching stats:", err);
        setError("Failed to load statistics data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [materialCode, timeRange, filters, mode]);

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full py-8 flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p className="text-sm text-muted-foreground">Loading statistics...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full py-8 flex items-center justify-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  // Render summary stats
  if (mode === "summary") {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-muted rounded-lg p-4">
            <h3 className="text-sm font-medium mb-2">Current Stock</h3>
            <div className="flex items-baseline">
              <span className="text-3xl font-bold">
                {MOCK_SUMMARY_DATA.currentStock}
              </span>
              <span className="text-sm ml-2 text-muted-foreground">drums</span>
            </div>
            <div className="mt-2 flex items-center">
              <Badge
                variant={
                  MOCK_SUMMARY_DATA.change30d >= 0 ? "default" : "destructive"
                }
              >
                {MOCK_SUMMARY_DATA.change30d >= 0 ? "+" : ""}
                {MOCK_SUMMARY_DATA.change30d} in 30d
              </Badge>
            </div>
          </div>

          <div className="bg-muted rounded-lg p-4">
            <h3 className="text-sm font-medium mb-2">Statistical Range</h3>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Min</div>
                <div className="text-xl font-medium">
                  {MOCK_SUMMARY_DATA.minStock}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Average</div>
                <div className="text-xl font-medium">
                  {MOCK_SUMMARY_DATA.averageStock}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Max</div>
                <div className="text-xl font-medium">
                  {MOCK_SUMMARY_DATA.maxStock}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[
                {
                  period: "30 Days",
                  change: MOCK_SUMMARY_DATA.change30d,
                  positiveChange:
                    MOCK_SUMMARY_DATA.change30d >= 0
                      ? MOCK_SUMMARY_DATA.change30d
                      : 0,
                  negativeChange:
                    MOCK_SUMMARY_DATA.change30d < 0
                      ? Math.abs(MOCK_SUMMARY_DATA.change30d)
                      : 0,
                },
                {
                  period: "90 Days",
                  change: MOCK_SUMMARY_DATA.change90d,
                  positiveChange:
                    MOCK_SUMMARY_DATA.change90d >= 0
                      ? MOCK_SUMMARY_DATA.change90d
                      : 0,
                  negativeChange:
                    MOCK_SUMMARY_DATA.change90d < 0
                      ? Math.abs(MOCK_SUMMARY_DATA.change90d)
                      : 0,
                },
                {
                  period: "YTD",
                  change: MOCK_SUMMARY_DATA.changeYTD,
                  positiveChange:
                    MOCK_SUMMARY_DATA.changeYTD >= 0
                      ? MOCK_SUMMARY_DATA.changeYTD
                      : 0,
                  negativeChange:
                    MOCK_SUMMARY_DATA.changeYTD < 0
                      ? Math.abs(MOCK_SUMMARY_DATA.changeYTD)
                      : 0,
                },
              ]}
              margin={{ top: 20, right: 30, left: 30, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="change"
                name="Stock Change"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                label={{
                  position: "top",
                  formatter: (value: number) =>
                    value >= 0 ? `+${value}` : `${value}`,
                }}
                isAnimationActive={false}
              >
                {[
                  { period: "30 Days", change: MOCK_SUMMARY_DATA.change30d },
                  { period: "90 Days", change: MOCK_SUMMARY_DATA.change90d },
                  { period: "YTD", change: MOCK_SUMMARY_DATA.changeYTD },
                ].map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.change >= 0 ? "#10b981" : "#ef4444"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // Render materials breakdown
  if (mode === "materials") {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-[250px] flex flex-col">
            <h3 className="text-sm font-medium mb-2">Material Distribution</h3>
            <div className="flex-grow">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={MOCK_MATERIALS_DATA}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="quantity"
                    nameKey="name"
                    label={(entry) => `${entry.name}: ${entry.percentage}%`}
                  >
                    {MOCK_MATERIALS_DATA.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value} drums`, "Quantity"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Material Breakdown</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Change</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_MATERIALS_DATA.map((material) => (
                  <TableRow key={material.code}>
                    <TableCell>
                      <div className="font-medium">{material.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {material.code}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {material.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          material.change > 0
                            ? "text-green-500"
                            : material.change < 0
                              ? "text-red-500"
                              : ""
                        }
                      >
                        {material.change > 0 ? "+" : ""}
                        {material.change}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    );
  }

  // Render suppliers breakdown
  if (mode === "suppliers") {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium mb-2">Supplier Performance</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Change</TableHead>
                <TableHead className="text-right">Reliability</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_SUPPLIERS_DATA.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell>
                    <div className="font-medium">{supplier.name}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    {supplier.quantity}
                    <span className="text-xs text-muted-foreground ml-1">
                      ({supplier.percentage}%)
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        supplier.change > 0
                          ? "text-green-500"
                          : supplier.change < 0
                            ? "text-red-500"
                            : ""
                      }
                    >
                      {supplier.change > 0 ? "+" : ""}
                      {supplier.change}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end">
                      <Badge
                        variant={
                          supplier.reliability >= 95
                            ? "default"
                            : supplier.reliability >= 90
                              ? "default"
                              : "secondary"
                        }
                      >
                        {supplier.reliability}%
                      </Badge>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="h-[250px] pt-4">
          <h3 className="text-sm font-medium mb-2">Supplier Distribution</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={MOCK_SUPPLIERS_DATA}
              margin={{ top: 20, right: 30, left: 30, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="quantity"
                name="Quantity"
                fill="#8884d8"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // Fallback
  return null;
}
