"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { RefreshCw, Package, CheckCircle2, AlertCircle } from "lucide-react";
// Using standard Date methods instead of date-fns

interface Material {
  id: string;
  name: string;
  code: string;
  location: string;
  description?: string;
}

interface ScanEvent {
  id: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  drumId: string;
  scannedAt: string;
  deviceId: string;
  userId: string;
}

interface MaterialCount {
  materialId: string;
  materialName: string;
  materialCode: string;
  count: number;
  lastScan: Date;
  status: "not_started" | "in_progress" | "completed";
}

/**
 * Real-time inventory scanning dashboard
 *
 * Displays summary cards, material counts table, and recent scans feed
 *
 * Uses Server-Sent Events (SSE) to receive real-time updates
 *
 * @returns {JSX.Element} The component
 */
export default function StockTakeDashboard() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialCounts, setMaterialCounts] = useState<MaterialCount[]>([]);
  const [recentScans, setRecentScans] = useState<ScanEvent[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("disconnected");
  const [error, setError] = useState<string | null>(null);

  // Fetch initial materials list
  useEffect(() => {
    async function fetchMaterials() {
      try {
        const response = await fetch("/api/inventory/materials");
        const data = await response.json();
        setMaterials(data);

        // Initialize material counts
        const initialCounts = data.map((material) => ({
          materialId: material.id,
          materialName: material.name,
          materialCode: material.code,
          count: 0,
          lastScan: new Date(),
          status: "not_started",
        }));
        setMaterialCounts(initialCounts);
      } catch (err) {
        console.error("Error fetching materials:", err);
        setError("Failed to load materials");
      }
    }

    fetchMaterials();
  }, []);

  // Set up SSE connection for real-time updates
  useEffect(() => {
    const eventSource = new EventSource("/api/stocktake/events");

    eventSource.onopen = () => {
      setConnectionStatus("connected");
      setError(null);
    };

    eventSource.onerror = (err) => {
      console.error("SSE error:", err);
      setConnectionStatus("disconnected");
      setError("Connection lost. Attempting to reconnect...");
    };

    eventSource.addEventListener("scan", (event) => {
      const scanData: ScanEvent = JSON.parse(event.data);

      // Add to recent scans
      setRecentScans((prev) => [scanData, ...prev].slice(0, 50));

      // Update material counts
      setMaterialCounts((prev) => {
        const updated = [...prev];
        const index = updated.findIndex(
          (m) => m.materialCode === scanData.materialCode
        );

        if (index !== -1) {
          updated[index] = {
            ...updated[index],
            count: updated[index].count + 1,
            lastScan: new Date(scanData.scannedAt),
            status: "in_progress",
          };
        }

        return updated;
      });
    });

    return () => {
      eventSource.close();
    };
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 size={16} className="text-green-500" />;
      case "in_progress":
        return <Package size={16} className="text-blue-500 animate-pulse" />;
      case "not_started":
        return <Package size={16} className="text-gray-400" />;
      default:
        return <AlertCircle size={16} className="text-amber-500" />;
    }
  };

  const totalScanned = materialCounts.reduce(
    (sum, material) => sum + material.count,
    0
  );
  const materialsInProgress = materialCounts.filter(
    (m) => m.status === "in_progress"
  ).length;
  const materialsCompleted = materialCounts.filter(
    (m) => m.status === "completed"
  ).length;

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Stock Take Dashboard</h1>
          <p className="text-gray-500">Real-time inventory scanning progress</p>
        </div>

        <div className="flex items-center gap-4">
          <Badge
            variant="outline"
            className={
              connectionStatus === "connected"
                ? "bg-green-100 text-green-800 border-green-300"
                : "bg-red-100 text-red-800 border-red-300"
            }
          >
            {connectionStatus === "connected" ? "Connected" : "Disconnected"}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Drums Scanned
                </p>
                <h3 className="text-2xl font-bold mt-1">{totalScanned}</h3>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Package size={24} className="text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Materials In Progress
                </p>
                <h3 className="text-2xl font-bold mt-1">
                  {materialsInProgress}
                </h3>
              </div>
              <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center">
                <Package size={24} className="text-amber-600 animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Materials Completed
                </p>
                <h3 className="text-2xl font-bold mt-1">
                  {materialsCompleted}
                </h3>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 size={24} className="text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Completion Rate
                </p>
                <h3 className="text-2xl font-bold mt-1">
                  {materials.length > 0
                    ? Math.round((materialsCompleted / materials.length) * 100)
                    : 0}
                  %
                </h3>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <CheckCircle2 size={24} className="text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Material Counts Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Material Counts</CardTitle>
            <CardDescription>
              Real-time count of scanned drums by material
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {materialCounts.map((material) => (
                  <div
                    key={material.materialId}
                    className={`flex items-center justify-between p-3 rounded-md ${
                      material.status === "in_progress"
                        ? "bg-blue-50"
                        : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {getStatusIcon(material.status)}
                      <div>
                        <div className="font-medium">
                          {material.materialName}
                        </div>
                        <div className="text-sm text-gray-500">
                          Code: {material.materialCode}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-xl font-bold">
                          {material.count}
                        </div>
                        <div className="text-xs text-gray-500">
                          {material.count > 0
                            ? material.lastScan.toLocaleTimeString()
                            : "Not scanned"}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          material.status === "completed"
                            ? "bg-green-100 text-green-800 border-green-300"
                            : material.status === "in_progress"
                              ? "bg-blue-100 text-blue-800 border-blue-300"
                              : "bg-gray-100 text-gray-800 border-gray-300"
                        }
                      >
                        {material.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Recent Scans Feed */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Scans</CardTitle>
            <CardDescription>Live feed of incoming scans</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {recentScans.length === 0 ? (
                  <div className="text-center text-gray-500 py-12">
                    Waiting for scan activity...
                  </div>
                ) : (
                  recentScans.map((scan) => (
                    <div
                      key={scan.id}
                      className="p-3 border rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className="font-medium">{scan.materialName}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(scan.scannedAt).toLocaleTimeString()}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        Drum ID:{" "}
                        <span className="font-mono bg-gray-100 px-1 rounded">
                          {scan.drumId}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Scanner: {scan.deviceId} • User: {scan.userId}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
