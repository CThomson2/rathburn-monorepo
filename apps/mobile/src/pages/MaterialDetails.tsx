
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ChartLine, Database, Info } from "lucide-react";

const MaterialDetails = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-industrial-darkGray dark:text-gray-100">
            Acetone
          </h1>
          <Badge variant="outline" className="text-industrial-blue">
            Chemical Solvent
          </Badge>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          ID: MAT-2025-AC-001
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-600">Current Stock</h3>
            <Database className="h-4 w-4 text-industrial-blue" />
          </div>
          <p className="text-2xl font-bold mt-2">2,450 L</p>
          <Progress value={75} className="mt-2" />
          <p className="text-xs text-gray-500 mt-1">75% of maximum capacity</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-600">Monthly Usage</h3>
            <ChartLine className="h-4 w-4 text-industrial-blue" />
          </div>
          <p className="text-2xl font-bold mt-2">860 L</p>
          <Progress value={40} className="mt-2" />
          <p className="text-xs text-gray-500 mt-1">40% increase from last month</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-600">Safety Stock</h3>
            <Info className="h-4 w-4 text-industrial-blue" />
          </div>
          <p className="text-2xl font-bold mt-2">500 L</p>
          <div className="mt-2 flex items-center">
            <Badge variant="outline" className="text-green-600">
              Above Threshold
            </Badge>
          </div>
        </Card>
      </div>

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inventory">Inventory History</TabsTrigger>
          <TabsTrigger value="quality">Quality Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Material Properties</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Chemical Formula</p>
                <p className="font-medium">CH₃COCH₃</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Molecular Weight</p>
                <p className="font-medium">58.08 g/mol</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Flash Point</p>
                <p className="font-medium">-20°C (-4°F)</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Boiling Point</p>
                <p className="font-medium">56.05°C (132.89°F)</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Storage Requirements</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Badge variant="outline">Temperature: 15-25°C</Badge>
                <Badge variant="outline">Humidity: &lt;60%</Badge>
                <Badge variant="outline">Ventilation Required</Badge>
              </div>
              <p className="text-sm text-gray-600">
                Store in a cool, dry, well-ventilated area away from sources of heat, ignition, and direct sunlight.
              </p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
            {/* Add inventory transaction history here */}
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Quality Parameters</h3>
            {/* Add quality metrics and charts here */}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MaterialDetails;
