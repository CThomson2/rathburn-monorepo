"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/core/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/core/ui/tabs";
import type { Database } from "@/types/models/database.types";

import {
  StockHistoryChart,
  MaterialSearch,
  TimeRangeSelector,
  FilterControls,
  StockHistoryStats,
} from "./components";

// Common type patterns you might need:
type Tables = Database["public"]["Tables"];
type Views = Database["public"]["Views"];

// Specific types for your page:
type StockHistory = Tables["stock_history"]["Row"];
type RefMaterial = Tables["ref_materials"]["Row"];
type StockHistoryAnalysis = Views["vw_stock_history_analysis"]["Row"];

// Type definitions
type StockHistoryView =
  Database["public"]["Views"]["vw_stock_history_analysis"]["Row"];
type MaterialRef = Database["public"]["Tables"]["ref_materials"]["Row"];
type SupplierRef = Database["public"]["Tables"]["ref_suppliers"]["Row"];

// Your existing interface definitions if needed
interface FilterControls {
  drumType: string;
  supplier: string;
}

export default function StockHistoryPage() {
  const [selectedMaterial, setSelectedMaterial] = useState<
    MaterialRef["code"] | null
  >(null);
  const [timeRange, setTimeRange] = useState<string>("1M");
  const [filters, setFilters] = useState<FilterControls>({
    drumType: "all",
    supplier: "all",
  });
  const [statsMode, setStatsMode] = useState<
    "summary" | "suppliers" | "materials"
  >("summary");

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">
          Stock History Dashboard
        </h1>
        <div className="w-full md:w-72">
          <MaterialSearch onSelect={(value) => setSelectedMaterial(value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main chart section - takes up 3/4 on large screens */}
        <Card className="xl:col-span-3">
          <CardHeader className="pb-0">
            <div className="flex flex-col md:flex-row justify-between md:items-center space-y-2 md:space-y-0">
              <CardTitle>Stock History</CardTitle>
              <TimeRangeSelector
                currentRange={timeRange}
                onRangeChange={(range) => setTimeRange(range)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <StockHistoryChart
              materialCode={selectedMaterial}
              timeRange={timeRange}
              filters={filters}
            />
          </CardContent>
        </Card>

        {/* Filters sidebar - takes up 1/4 on large screens */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <FilterControls
              filters={filters}
              onFilterChange={(newFilters) => setFilters(newFilters)}
            />
          </CardContent>
        </Card>

        {/* Stats section - full width */}
        <Card className="xl:col-span-4">
          <CardHeader className="pb-0">
            <div className="flex justify-between items-center">
              <CardTitle>Analytics</CardTitle>
              <Tabs
                defaultValue="summary"
                value={statsMode}
                onValueChange={(value) =>
                  setStatsMode(value as "summary" | "suppliers" | "materials")
                }
              >
                <TabsList>
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="materials">Materials</TabsTrigger>
                  <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <StockHistoryStats
              materialCode={selectedMaterial}
              timeRange={timeRange}
              filters={filters}
              mode={statsMode}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
