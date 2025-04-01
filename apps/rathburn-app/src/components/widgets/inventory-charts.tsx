
import { useState } from "react";
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, ChevronUp, BarChart2, PieChart as PieChartIcon, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const InventoryCharts = ({ stockLevels, categories, trendData }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Colors for the charts
  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#14b8a6", "#f97316", "#6366f1"];
  
  // Format large numbers with K suffix
  const formatNumber = (num) => {
    return num >= 1000 ? `${(num / 1000).toFixed(1)}k` : num;
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      {/* Widget Header */}
      <div className="p-4 flex justify-between items-center">
        <div className="flex items-center">
          <BarChart2 className="text-blue-600 h-5 w-5 mr-2" />
          <h3 className="font-medium text-gray-900">Inventory Analysis</h3>
        </div>
        <button 
          className="text-gray-500"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </button>
      </div>
      
      {/* Chart Content */}
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        isCollapsed ? "max-h-0 opacity-0 overflow-hidden" : "max-h-[800px] opacity-100"
      )}>
        <div className="p-4 border-t border-gray-100">
          <Tabs defaultValue="stock" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="stock" className="flex items-center justify-center">
                <BarChart2 className="h-4 w-4 mr-2" />
                <span>Stock Levels</span>
              </TabsTrigger>
              <TabsTrigger value="categories" className="flex items-center justify-center">
                <PieChartIcon className="h-4 w-4 mr-2" />
                <span>Categories</span>
              </TabsTrigger>
              <TabsTrigger value="trends" className="flex items-center justify-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                <span>Trends</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Stock Levels Chart */}
            <TabsContent value="stock" className="mt-2">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stockLevels}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={60} 
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      stroke="#10b981"
                      tickFormatter={(value) => `$${formatNumber(value)}`}
                    />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === "quantity") return [`${value} units`, "Quantity"];
                        if (name === "value") return [`$${value.toLocaleString()}`, "Value"];
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="quantity" name="Quantity" fill="#3b82f6" />
                    <Bar yAxisId="right" dataKey="value" name="Value ($)" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Top 10 inventory items by quantity and value
              </p>
            </TabsContent>
            
            {/* Categories Chart */}
            <TabsContent value="categories" className="mt-2">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categories}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {categories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, "Value"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Inventory value distribution by category
              </p>
            </TabsContent>
            
            {/* Trends Chart */}
            <TabsContent value="trends" className="mt-2">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={trendData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(value) => `$${formatNumber(value)}`} />
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, "Inventory Value"]} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      name="Inventory Value"
                      stroke="#3b82f6"
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Total inventory value trend over the last 6 months
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default InventoryCharts;
