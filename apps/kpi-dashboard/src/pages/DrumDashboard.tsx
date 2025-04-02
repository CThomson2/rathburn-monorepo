import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { InfoIcon, AlertCircle, Clock, Boxes, FlaskConical, Recycle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell 
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import DashboardLayout from "@/components/layouts/DashboardLayout";

// Define types for our data
interface Drum {
  id: number;
  old_id: number;
  material: string;
  site: string;
  status: string;
  batch_code: string | null;
  supplier: string | null;
  date_ordered: string | null;
  created_at: string;
  updated_at: string | null;
}

interface MaterialCount {
  material: string;
  count: number;
  color: string;
}

interface ChemicalGroupCount {
  group: string;
  count: number;
  color: string;
}

interface OrdersByMonth {
  month: string;
  count: number;
}

// Colors for charts
const COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", 
  "#ec4899", "#06b6d4", "#14b8a6", "#f97316", "#6366f1"
];

// Function to get a fixed color for a given string
const getColorForString = (str: string, palette = COLORS) => {
  const index = str.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % palette.length;
  return palette[index];
};

// Format date for display
const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "Unknown";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
};

const DrumDashboard = () => {
  // Fetch drums data
  const { data: drums, isLoading, error } = useQuery({
    queryKey: ["drums"],
    queryFn: async () => {
      console.log("Fetching drums data from Supabase...");
      const { data, error } = await supabase
        .from("drums")
        .select("*")
        .order("id", { ascending: true });
      
      if (error) {
        console.error("Supabase query error:", error);
        throw error;
      }
      
      console.log("Supabase returned data:", data);
      
      // Explicitly map the data to match our Drum interface
      return (data as any[]).map(item => ({
        id: item.id,
        old_id: item.old_id,
        material: item.material,
        site: item.site,
        status: item.status,
        batch_code: item.batch_code,
        supplier: item.supplier,
        date_ordered: item.date_ordered,
        created_at: item.created_at,
        updated_at: item.updated_at
      })) as Drum[];
    }
  });

  // Derived states
  const [materialData, setMaterialData] = useState<MaterialCount[]>([]);
  const [chemicalGroups, setChemicalGroups] = useState<ChemicalGroupCount[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<OrdersByMonth[]>([]);
  const [newDrums, setNewDrums] = useState<Drum[]>([]);
  const [reprocessingDrums, setReprocessingDrums] = useState<Drum[]>([]);

  useEffect(() => {
    if (!drums) {
      console.log("No drums data available yet");
      return;
    }
    
    console.log("Processing drums data:", drums);
    console.log("Number of drums:", drums.length);

    // Process data for material count chart
    const materialCounts = drums.reduce((acc, drum) => {
      acc[drum.material] = (acc[drum.material] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const materialChartData = Object.entries(materialCounts)
      .map(([material, count]) => ({
        material,
        count,
        color: getColorForString(material)
      }))
      .sort((a, b) => b.count - a.count);

    setMaterialData(materialChartData);

    // Use material as the grouping field (instead of chemical_group)
    // Group drums by their material type, which can be considered a chemical group
    const groupCounts = drums.reduce((acc, drum) => {
      // Use the material field for grouping since chemical_group doesn't exist
      const group = drum.material || "Unknown";
      acc[group] = (acc[group] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const groupChartData = Object.entries(groupCounts)
      .map(([group, count]) => ({
        group,
        count,
        color: getColorForString(group)
      }))
      .sort((a, b) => b.count - a.count);

    setChemicalGroups(groupChartData);

    // Process data for time series chart
    const monthlyData: Record<string, number> = {};
    
    drums.forEach(drum => {
      if (drum.date_ordered) {
        const date = new Date(drum.date_ordered);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
      }
    });

    // Convert to array and sort by date
    const timeSeriesArray = Object.entries(monthlyData)
      .map(([month, count]) => {
        const [year, monthNum] = month.split('-');
        return {
          month: `${new Date(0, parseInt(monthNum) - 1).toLocaleString('default', { month: 'short' })} ${year}`,
          fullDate: month, // Keep original for sorting
          count
        };
      })
      .sort((a, b) => a.fullDate.localeCompare(b.fullDate))
      .map(({ month, count }) => ({ month, count }));

    setTimeSeriesData(timeSeriesArray);

    // Filter drums by status
    setNewDrums(drums.filter(drum => drum.status === 'N'));
    setReprocessingDrums(drums.filter(drum => drum.status === 'R'));

  }, [drums]);

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center text-destructive">
                <AlertCircle className="mr-2" />
                Error Loading Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>There was an error loading the drum data. Please try again later.</p>
              <p className="text-sm text-muted-foreground mt-2">{(error as Error).message}</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Drum Inventory Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Overview of current drum inventory and status
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <InfoIcon className="h-3.5 w-3.5" />
              <span>Total Drums: {drums?.length || 0}</span>
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <FlaskConical className="h-3.5 w-3.5" />
              <span>Materials: {materialData.length}</span>
            </Badge>
          </div>
        </div>

        {/* Top row with summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">New Drums</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-10 w-20" />
              ) : (
                <div className="flex items-center">
                  <Boxes className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-2xl font-bold">{newDrums.length}</span>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Reprocessing Drums</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-10 w-20" />
              ) : (
                <div className="flex items-center">
                  <Recycle className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-2xl font-bold">{reprocessingDrums.length}</span>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Most Common Material</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <div className="flex items-center">
                  <FlaskConical className="h-5 w-5 text-amber-500 mr-2" />
                  <span className="text-lg font-medium truncate">
                    {materialData.length > 0 ? materialData[0].material : "None"}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Latest Order Date</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-purple-500 mr-2" />
                  <span className="text-lg font-medium">
                    {drums && drums.length > 0
                      ? formatDate(
                          drums
                            .filter(d => d.date_ordered)
                            .sort((a, b) => {
                              if (!a.date_ordered) return 1;
                              if (!b.date_ordered) return -1;
                              return new Date(b.date_ordered).getTime() - new Date(a.date_ordered).getTime();
                            })[0]?.date_ordered || null
                        )
                      : "None"}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main charts grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Stock by Material Chart */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Stock Levels by Material</CardTitle>
              <CardDescription>Number of drums per material type</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-80 w-full flex items-center justify-center">
                  <Skeleton className="h-80 w-full" />
                </div>
              ) : (
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={materialData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" />
                      <YAxis 
                        type="category" 
                        dataKey="material" 
                        width={90}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        formatter={(value) => [`${value} drums`, "Count"]}
                        contentStyle={{ fontSize: 12 }}
                      />
                      <Bar dataKey="count" name="Drums">
                        {materialData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chemical Group Pie Chart */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Distribution by Chemical Group</CardTitle>
              <CardDescription>Percentage of drums by chemical classification</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-80 w-full flex items-center justify-center">
                  <Skeleton className="h-80 w-full" />
                </div>
              ) : (
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chemicalGroups}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={100}
                        dataKey="count"
                        nameKey="group"
                        label={({ group, percent }) => `${group}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {chemicalGroups.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name, props) => [`${value} drums`, props.payload.group]}
                        contentStyle={{ fontSize: 12 }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Time Series Chart */}
          <Card className="col-span-1 md:col-span-2">
            <CardHeader>
              <CardTitle>Drum Orders Over Time</CardTitle>
              <CardDescription>Number of drums ordered by month</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-80 w-full flex items-center justify-center">
                  <Skeleton className="h-80 w-full" />
                </div>
              ) : timeSeriesData.length > 0 ? (
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={timeSeriesData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="month" 
                        angle={-45} 
                        textAnchor="end"
                        height={60}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => [`${value} drums`, "Orders"]}
                        contentStyle={{ fontSize: 12 }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="count"
                        name="Drums Ordered"
                        stroke="#3b82f6"
                        activeDot={{ r: 8 }}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 w-full flex items-center justify-center text-muted-foreground">
                  Not enough time series data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Status based tables */}
        <div className="mt-8">
          <Tabs defaultValue="new" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="new" className="flex items-center gap-2">
                <Boxes className="h-4 w-4" />
                <span>New Drums (N)</span>
              </TabsTrigger>
              <TabsTrigger value="reprocessing" className="flex items-center gap-2">
                <Recycle className="h-4 w-4" />
                <span>Reprocessing Drums (R)</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="new">
              <Card>
                <CardHeader>
                  <CardTitle>New Drums</CardTitle>
                  <CardDescription>Drums with 'N' status in the inventory</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-96 w-full" />
                  ) : newDrums.length > 0 ? (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Material</TableHead>
                            <TableHead>Supplier</TableHead>
                            <TableHead>Batch Code</TableHead>
                            <TableHead>Date Ordered</TableHead>
                            <TableHead>Site</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {newDrums.slice(0, 10).map((drum) => (
                            <TableRow key={drum.id}>
                              <TableCell className="font-medium">{drum.id}</TableCell>
                              <TableCell>{drum.material}</TableCell>
                              <TableCell>{drum.supplier || "Unknown"}</TableCell>
                              <TableCell>{drum.batch_code || "Unknown"}</TableCell>
                              <TableCell>{formatDate(drum.date_ordered)}</TableCell>
                              <TableCell>{drum.site}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {newDrums.length > 10 && (
                        <div className="flex justify-center py-2 border-t">
                          <p className="text-sm text-muted-foreground">
                            Showing 10 of {newDrums.length} drums
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                      No new drums found in inventory
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="reprocessing">
              <Card>
                <CardHeader>
                  <CardTitle>Reprocessing Drums</CardTitle>
                  <CardDescription>Drums with 'R' status in the inventory</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-96 w-full" />
                  ) : reprocessingDrums.length > 0 ? (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Material</TableHead>
                            <TableHead>Supplier</TableHead>
                            <TableHead>Batch Code</TableHead>
                            <TableHead>Date Ordered</TableHead>
                            <TableHead>Site</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reprocessingDrums.slice(0, 10).map((drum) => (
                            <TableRow key={drum.id}>
                              <TableCell className="font-medium">{drum.id}</TableCell>
                              <TableCell>{drum.material}</TableCell>
                              <TableCell>{drum.supplier || "Unknown"}</TableCell>
                              <TableCell>{drum.batch_code || "Unknown"}</TableCell>
                              <TableCell>{formatDate(drum.date_ordered)}</TableCell>
                              <TableCell>{drum.site}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {reprocessingDrums.length > 10 && (
                        <div className="flex justify-center py-2 border-t">
                          <p className="text-sm text-muted-foreground">
                            Showing 10 of {reprocessingDrums.length} drums
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                      No reprocessing drums found in inventory
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Debug Panel */}
        <div className="mt-8 border-t pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Debugging Panel</CardTitle>
              <CardDescription>Tools to troubleshoot data issues</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-sm mb-2">Test database connection:</p>
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick={async () => {
                      try {
                        // Test a simple query to the drums table
                        const { data, error } = await supabase
                          .from('drums')
                          .select('id')
                          .limit(1);
                          
                        if (error) {
                          console.error("Error connecting to database:", error);
                          alert(`Database error: ${error.message}`);
                        } else {
                          console.log("Database connection successful:", data);
                          alert(`Connection successful! ${data.length > 0 ? "Data found" : "No data found"}`);
                          
                          // Force refresh the data
                          window.location.reload();
                        }
                      } catch (e) {
                        console.error("Exception during database test:", e);
                        alert(`Exception: ${e instanceof Error ? e.message : String(e)}`);
                      }
                    }}
                  >
                    Test Connection & Refresh
                  </button>
                </div>
                <div>
                  <p className="text-sm mb-2">Data status:</p>
                  <ul className="list-disc pl-5 text-sm">
                    <li>Loading state: {isLoading ? "Loading..." : "Completed"}</li>
                    <li>Error state: {error ? `Error: ${(error as Error).message}` : "No errors"}</li>
                    <li>Drums count: {drums?.length || 0}</li>
                    <li>Material types: {materialData.length}</li>
                    <li>Chemical groups: {chemicalGroups.length}</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DrumDashboard;
