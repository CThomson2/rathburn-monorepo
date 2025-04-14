"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Brush,
  ReferenceLine,
} from "recharts";
import { Card, CardContent } from "@/components/core/ui/card";
import { Skeleton } from "@/components/core/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/core/ui/select";
import { Button } from "@/components/core/ui/button";
import { CalendarIcon, Loader2 } from "lucide-react";

// Type definitions based on our database schema
interface StockDataPoint {
  date: string;
  value: number;
  materialCode: string;
  drumType: string;
  supplier: string;
}

interface ChartProps {
  materialCode: string | null;
  timeRange: string;
  filters: {
    drumType: string;
    supplier: string;
  };
}

export default function StockHistoryChart({
  materialCode,
  timeRange,
  filters,
}: ChartProps) {
  const [data, setData] = useState<StockDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chartType, setChartType] = useState<"area" | "line" | "bar">("area");
  const [error, setError] = useState<string | null>(null);

  // Function to fetch data based on material code, time range, and filters
  useEffect(() => {
    const fetchStockData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // This would be replaced with an actual API call
        // For now, we'll generate mock data for demonstration

        // Convert timeRange to number of days for mock data
        const days = timeRangeToDays(timeRange);
        const mockData = generateMockData(days, materialCode, filters);

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        setData(mockData);
      } catch (err) {
        console.error("Error fetching stock data:", err);
        setError("Failed to load stock data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStockData();
  }, [materialCode, timeRange, filters]);

  // Function to convert timeRange string to days
  const timeRangeToDays = (range: string): number => {
    switch (range) {
      case "1W":
        return 7;
      case "1M":
        return 30;
      case "3M":
        return 90;
      case "1Y":
        return 365;
      case "3Y":
        return 1095;
      default:
        return 30;
    }
  };

  // Function to generate mock data
  const generateMockData = (
    days: number,
    materialCode: string | null,
    filters: { drumType: string; supplier: string }
  ): StockDataPoint[] => {
    const mockData: StockDataPoint[] = [];
    const today = new Date();

    // Base value for the time series
    let baseValue = 500;

    // Adjust base value based on material
    if (materialCode) {
      // Different materials have different base values
      const materialMultiplier = (materialCode.charCodeAt(0) % 5) + 0.5;
      baseValue = baseValue * materialMultiplier;
    }

    for (let i = days; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // Create a realistic trend with some randomness
      const trend = Math.sin(i / (days * 0.1)) * 100;
      const randomFactor = Math.random() * 50 - 25;
      let value = baseValue + trend + randomFactor;

      // Ensure positive values
      value = Math.max(10, value);

      // Generate data point
      mockData.push({
        date: date.toISOString().split("T")[0] || "",
        value: Math.round(value),
        materialCode: materialCode || "ALL",
        drumType:
          filters.drumType === "all"
            ? Math.random() > 0.5
              ? "new"
              : "repro"
            : filters.drumType,
        supplier:
          filters.supplier === "all"
            ? `Supplier ${Math.floor(Math.random() * 5) + 1}`
            : filters.supplier,
      });
    }

    return mockData;
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card className="p-2 border shadow-md bg-background">
          <CardContent className="p-2">
            <p className="font-medium">{label}</p>
            <p className="text-sm">
              Stock: <span className="font-medium">{payload[0].value}</span>{" "}
              drums
            </p>
            {payload[0].payload.materialCode !== "ALL" && (
              <p className="text-sm">
                Material: {payload[0].payload.materialCode}
              </p>
            )}
            <p className="text-sm">Type: {payload[0].payload.drumType}</p>
            <p className="text-sm">Supplier: {payload[0].payload.supplier}</p>
          </CardContent>
        </Card>
      );
    }
    return null;
  };

  // Handle loading state
  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p className="text-sm text-muted-foreground">Loading stock data...</p>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }
  // Determine color based on trend
  const startValue = data?.length > 0 ? (data[0]?.value ?? 0) : 0;
  const endValue =
    data?.length > 1
      ? (data[data.length - 1]?.value ?? startValue)
      : startValue;
  const isPositiveTrend = (endValue ?? 0) >= (startValue ?? 0);
  const chartColor = isPositiveTrend ? "#10b981" : "#ef4444"; // Green for positive, red for negative

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between mb-4">
        <div className="flex items-center gap-2">
          <Select
            value={chartType}
            onValueChange={(value) =>
              setChartType(value as "area" | "line" | "bar")
            }
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Chart Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="area">Area Chart</SelectItem>
              <SelectItem value="line">Line Chart</SelectItem>
              <SelectItem value="bar">Bar Chart</SelectItem>
            </SelectContent>
          </Select>

          <div className="text-sm ml-4">
            <span className="text-muted-foreground mr-1">Start:</span>
            <span className="font-medium">
              {data.length > 0 ? (data[0]?.value ?? 0) : 0}
            </span>
            <span className="text-muted-foreground mx-1">End:</span>
            <span className="font-medium">
              {data.length > 0 ? (data[data.length - 1]?.value ?? 0) : 0}
            </span>
            <span
              className={`ml-2 ${isPositiveTrend ? "text-green-500" : "text-red-500"}`}
            >
              {isPositiveTrend ? "+" : ""}
              {(((endValue - startValue) / startValue) * 100).toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      <div className="w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
          >
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColor} stopOpacity={0.8} />
                <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              minTickGap={30}
              padding={{ left: 0, right: 0 }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              domain={["auto", "auto"]}
              minTickGap={20}
              width={55}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {chartType === "area" && (
              <Area
                type="monotone"
                dataKey="value"
                stroke={chartColor}
                fillOpacity={1}
                fill="url(#colorGradient)"
                name="Stock Quantity"
              />
            )}
            {chartType === "line" && (
              <Area
                type="monotone"
                dataKey="value"
                stroke={chartColor}
                fill="none"
                name="Stock Quantity"
              />
            )}
            {data.length > 20 && (
              <Brush
                dataKey="date"
                height={30}
                stroke="#8884d8"
                travellerWidth={10}
                startIndex={Math.max(0, data.length - 20)}
              />
            )}
            <ReferenceLine
              y={data.reduce((sum, item) => sum + item.value, 0) / data.length}
              stroke="#888"
              strokeDasharray="3 3"
              label={{ value: "Average", position: "insideBottomRight" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
