
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, Play, Save, Trash } from "lucide-react";

// Sample pre-defined queries
const sampleQueries = [
  {
    name: "Low Stock Items",
    query: "SELECT item_name, current_stock, min_stock\nFROM inventory\nWHERE current_stock < min_stock\nORDER BY (current_stock / min_stock) ASC;"
  },
  {
    name: "Items by Supplier",
    query: "SELECT supplier_name, COUNT(*) as item_count, SUM(current_stock * unit_price) as total_value\nFROM inventory\nJOIN suppliers ON inventory.supplier_id = suppliers.id\nGROUP BY supplier_name\nORDER BY total_value DESC;"
  },
  {
    name: "Recent Transactions",
    query: "SELECT t.transaction_date, i.item_name, t.quantity, t.transaction_type\nFROM transactions t\nJOIN inventory i ON t.item_id = i.id\nWHERE t.transaction_date > NOW() - INTERVAL '7 days'\nORDER BY t.transaction_date DESC;"
  }
];

// Sample results for demonstration
const sampleResults = [
  { item_name: "Aluminum Sheets", current_stock: 15, min_stock: 50 },
  { item_name: "Circuit Boards", current_stock: 32, min_stock: 75 },
  { item_name: "Steel Rods", current_stock: 40, min_stock: 100 },
  { item_name: "Copper Wire", current_stock: 180, min_stock: 200 },
  { item_name: "Plastic Casings", current_stock: 90, min_stock: 150 }
];

const SQLQueryWidget = () => {
  const [queryText, setQueryText] = useState(sampleQueries[0].query);
  const [results, setResults] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [savedQueries, setSavedQueries] = useState<{name: string, query: string}[]>([
    { name: "My Saved Query 1", query: "SELECT * FROM inventory WHERE category = 'Electronics'" }
  ]);

  const runQuery = () => {
    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setResults(sampleResults);
      setIsLoading(false);
    }, 800);
  };

  const saveCurrentQuery = () => {
    // In a real app, you would prompt for a name and save to backend
    const newSavedQuery = { 
      name: `Saved Query ${savedQueries.length + 1}`, 
      query: queryText 
    };
    
    setSavedQueries([...savedQueries, newSavedQuery]);
  };

  const loadSampleQuery = (query: string) => {
    setQueryText(query);
  };

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="query" className="flex-grow flex flex-col">
        <TabsList className="mb-2">
          <TabsTrigger value="query">Query Editor</TabsTrigger>
          <TabsTrigger value="samples">Sample Queries</TabsTrigger>
          <TabsTrigger value="saved">Saved Queries</TabsTrigger>
        </TabsList>
        
        <TabsContent value="query" className="flex-grow flex flex-col space-y-2 mt-0">
          <Textarea 
            placeholder="Enter your SQL query here..." 
            className="font-mono text-sm flex-grow min-h-[100px]"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
          />
          
          <div className="flex justify-between">
            <Button variant="outline" size="sm" onClick={saveCurrentQuery}>
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
            <Button size="sm" onClick={runQuery} disabled={isLoading}>
              <Play className="h-4 w-4 mr-1" />
              {isLoading ? "Running..." : "Run Query"}
            </Button>
          </div>
          
          {results && (
            <div className="mt-4 border rounded-md overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-muted">
                  <tr>
                    {Object.keys(results[0]).map((key) => (
                      <th 
                        key={key} 
                        className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {Object.values(row).map((value, cellIndex) => (
                        <td key={cellIndex} className="px-4 py-2 text-sm">
                          {String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="samples" className="mt-0">
          <div className="space-y-3">
            {sampleQueries.map((sample, index) => (
              <div key={index} className="border rounded-md p-3 hover:bg-muted/50 cursor-pointer" onClick={() => loadSampleQuery(sample.query)}>
                <div className="font-medium mb-1">{sample.name}</div>
                <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                  {sample.query}
                </pre>
              </div>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="saved" className="mt-0">
          {savedQueries.length > 0 ? (
            <div className="space-y-3">
              {savedQueries.map((saved, index) => (
                <div key={index} className="border rounded-md p-3 hover:bg-muted/50">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">{saved.name}</span>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => loadSampleQuery(saved.query)}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-6 w-6 text-red-500"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                    {saved.query}
                  </pre>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No saved queries yet</p>
              <p className="text-sm">Run and save a query to see it here</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SQLQueryWidget;
