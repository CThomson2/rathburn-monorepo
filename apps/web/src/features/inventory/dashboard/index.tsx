import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/server";
import { ViewType } from "@/types/models/base";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  ArrowUpDown,
  Filter,
  Search,
  AlertTriangle,
  Package,
} from "lucide-react";

// View for chemical inventory dashboard: `vw_drum_inventory`
// Types: `ViewType<'vw_drum_inventory'>`
export default function ChemicalInventoryDashboard() {
  const [inventory, setInventory] = useState<ViewType<"vw_drum_inventory">[]>(
    []
  );
  const [filteredInventory, setFilteredInventory] = useState<
    ViewType<"vw_drum_inventory">[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });
  const [selectedItem, setSelectedItem] = useState(null);
  const [showLowStock, setShowLowStock] = useState(false);

  // Summary statistics
  const totalNew = filteredInventory.reduce(
    (sum, item) => sum + (item.raw_drums ?? 0),
    0
  );
  const totalRepro = filteredInventory.reduce(
    (sum, item) => sum + (item.repro_drums ?? 0),
    0
  );
  const totalStock = totalNew + totalRepro;
  const lowStockCount = filteredInventory.filter(
    (item) =>
      (item.raw_drums ?? 0) + (item.repro_drums ?? 0) < (item.threshold ?? 0)
  ).length;

  useEffect(() => {
    async function fetchInventory() {
      try {
        setLoading(true);

        // Fetch inventory data from Supabase
        const supabase = createClient();
        const { data, error } = await supabase
          .from("vw_drum_inventory")
          .select("*");

        if (error) throw error;

        // Transform data for visualization
        const transformedData = data.map((item) => ({
          id: item.id,
          name: item.chemical_name,
          rawDrums: item.raw_drums,
          reproDrums: item.repro_drums,
          category: item.ch_group,
          reorderThreshold: item.threshold,
          total: item.raw_drums + item.repro_drums,
        }));

        setInventory(transformedData);
        setFilteredInventory(transformedData);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching inventory:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchInventory();
  }, []);

  useEffect(() => {
    // Apply filters and search
    let result = [...inventory];

    if (searchTerm) {
      result = result.filter(
        (item) =>
          item?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item?.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (showLowStock) {
      result = result.filter(
        (item) => item.raw_drums + item.reproStock < item.reorderThreshold
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });

    setFilteredInventory(result);
  }, [inventory, searchTerm, sortConfig, showLowStock]);

  const handleSort = (key) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const handleBarClick = (item) => {
    setSelectedItem(item);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        Loading inventory data...
      </div>
    );
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="p-6 max-w-full bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Chemical Solvent Inventory</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Total Inventory</h3>
          <div className="flex items-center">
            <Package className="mr-2 text-blue-500" />
            <span className="text-2xl font-bold">{totalStock}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">New Stock</h3>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded mr-2 bg-blue-500"></div>
            <span className="text-2xl font-bold">{totalNew}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Repro Stock</h3>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded mr-2 bg-green-500"></div>
            <span className="text-2xl font-bold">{totalRepro}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Low Stock Alert</h3>
          <div className="flex items-center">
            <AlertTriangle className="mr-2 text-amber-500" />
            <span className="text-2xl font-bold">{lowStockCount}</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex items-center bg-white rounded-lg shadow px-3 py-2 flex-grow">
          <Search className="text-gray-400 mr-2" size={18} />
          <input
            type="text"
            placeholder="Search chemicals..."
            className="flex-grow focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <button
            className="flex items-center bg-white rounded-lg shadow px-4 py-2"
            onClick={() => handleSort("name")}
          >
            <ArrowUpDown size={18} className="mr-2 text-gray-500" />
            Sort by Name
          </button>

          <button
            className="flex items-center bg-white rounded-lg shadow px-4 py-2"
            onClick={() => handleSort("total")}
          >
            <ArrowUpDown size={18} className="mr-2 text-gray-500" />
            Sort by Total
          </button>

          <button
            className={`flex items-center rounded-lg shadow px-4 py-2 ${showLowStock ? "bg-amber-100" : "bg-white"}`}
            onClick={() => setShowLowStock(!showLowStock)}
          >
            <Filter size={18} className="mr-2 text-gray-500" />
            {showLowStock ? "All Items" : "Low Stock Only"}
          </button>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Stock Levels</h2>

        {filteredInventory.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            No matching inventory items found.
          </div>
        ) : (
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={filteredInventory}
                margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
                barSize={20}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value, name) => [
                    value,
                    name === "raw_drums" ? "New Stock" : "Repro Stock",
                  ]}
                  labelFormatter={(label) => `Chemical: ${label}`}
                />
                <Legend
                  payload={[
                    { value: "New Stock", type: "square", color: "#3b82f6" },
                    { value: "Repro Stock", type: "square", color: "#10b981" },
                  ]}
                />
                <Bar
                  dataKey="raw_drums"
                  stackId="a"
                  fill="#3b82f6"
                  name="New Stock"
                  onClick={(data) => handleBarClick(data)}
                />
                <Bar
                  dataKey="reproStock"
                  stackId="a"
                  fill="#10b981"
                  name="Repro Stock"
                  onClick={(data) => handleBarClick(data)}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Detail Panel (conditionally rendered) */}
      {selectedItem && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold">
              {selectedItem.name} Details
            </h2>
            <button
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setSelectedItem(null)}
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-3">
                Inventory Information
              </h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                <dt className="text-gray-500">Category:</dt>
                <dd>{selectedItem.category}</dd>
                <dt className="text-gray-500">New Stock:</dt>
                <dd className="font-semibold">
                  {selectedItem.raw_drums} drums
                </dd>
                <dt className="text-gray-500">Repro Stock:</dt>
                <dd className="font-semibold">
                  {selectedItem.reproStock} drums
                </dd>
                <dt className="text-gray-500">Total:</dt>
                <dd className="font-semibold">
                  {selectedItem.raw_drums + selectedItem.reproStock} drums
                </dd>
                <dt className="text-gray-500">Reorder Threshold:</dt>
                <dd
                  className={
                    selectedItem.total < selectedItem.reorderThreshold
                      ? "text-red-500 font-bold"
                      : ""
                  }
                >
                  {selectedItem.reorderThreshold} drums
                </dd>
              </dl>

              {selectedItem.total < selectedItem.reorderThreshold && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-center">
                  <AlertTriangle className="text-amber-500 mr-2" />
                  <span className="text-amber-700">
                    Stock is below reorder threshold
                  </span>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3">Stock Distribution</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      {
                        name: selectedItem.name,
                        raw_drums: selectedItem.raw_drums,
                        reproStock: selectedItem.reproStock,
                      },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="raw_drums" name="New Stock" fill="#3b82f6" />
                    <Bar
                      dataKey="reproStock"
                      name="Repro Stock"
                      fill="#10b981"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
