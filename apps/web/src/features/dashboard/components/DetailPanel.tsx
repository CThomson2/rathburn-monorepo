"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit,
  Printer,
  Trash2,
  ExternalLink,
  FileText,
  Info,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { ChemicalItem } from "../types";
import {
  useColorScheme,
  getCategoryColor,
  getInventoryStatusVariant,
} from "../utils/theme-colors";

// Import shadcn components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DetailPanelProps {
  item: ChemicalItem | null;
  onClose?: () => void;
  onEdit?: (id: string) => void;
  onDelete: (id: string) => void;
  onPrint: (id: string) => void;
  onExport: (id: string) => void;
}

/**
 * DetailPanel is a React component that renders a detailed view of a chemical
 * item. It provides a tabbed interface with multiple sections for displaying
 * information about the chemical. The component also provides buttons for
 * editing, printing, and exporting the chemical item.
 *
 * @param {ChemicalItem | null} item The chemical item to display
 * @param {() => void} onClose A callback function to close the panel
 * @param {(id: string) => void} onEdit A callback function to edit the chemical
 * @param {(id: string) => void} onDelete A callback function to delete the chemical
 * @param {(id: string) => void} onPrint A callback function to print the chemical
 * @param {(id: string) => void} onExport A callback function to export the chemical
 */
export function DetailPanel({
  item,
  onClose,
  onEdit,
  onDelete,
  onPrint,
  onExport,
}: DetailPanelProps) {
  const { theme } = useTheme();
  const colors = useColorScheme();
  const [activeTab, setActiveTab] = React.useState("overview");

  if (!item) {
    return (
      <Card className="w-full h-full flex items-center justify-center p-6">
        <div className="text-center text-muted-foreground flex flex-col items-center gap-2">
          <Info className="h-12 w-12 opacity-50" />
          <p>Select a chemical to view details</p>
        </div>
      </Card>
    );
  }

  // Helper function to get status variant
  const getStatusVariant = () => {
    // For demo we'll use a 40% of total as critical threshold
    const criticalThreshold = Math.ceil(item.totalQuantity * 0.4);
    return getInventoryStatusVariant(
      item.totalQuantity,
      item.totalQuantity * 2, // Just for demo - in reality this would come from the item
      criticalThreshold
    );
  };

  // Format location data for the chart
  const locationChartData = item.locations.map((loc) => ({
    name: loc.name,
    quantity: loc.quantity,
  }));

  // Calculate days until expiry
  const daysUntilExpiry = () => {
    const today = new Date();
    const expiry = new Date(item.expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const expiryDays = daysUntilExpiry();
  const isExpiringSoon = expiryDays < 30 && expiryDays >= 0;
  const isExpired = expiryDays < 0;

  const getHazardBadgeVariant = (
    level: string
  ): "destructive" | "secondary" | "outline" | "default" => {
    switch (level) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <Card className="w-full h-full overflow-auto">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{item.name}</CardTitle>
            <CardDescription>ID: {item.id}</CardDescription>
          </div>
          <Badge variant={getHazardBadgeVariant(item.hazardLevel)}>
            {item.hazardLevel.toUpperCase()} HAZARD
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-2">General Information</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div className="text-muted-foreground">Formula</div>
            <div>{item.formula}</div>
            <div className="text-muted-foreground">CAS Number</div>
            <div>{item.casNumber}</div>
            <div className="text-muted-foreground">Total Quantity</div>
            <div>
              {item.totalQuantity} {item.unit}
            </div>
            <div className="text-muted-foreground">Storage Conditions</div>
            <div>{item.storageConditions}</div>
            <div className="text-muted-foreground">Supplier</div>
            <div>{item.supplier}</div>
            <div className="text-muted-foreground">Last Updated</div>
            <div>{new Date(item.lastUpdated).toLocaleDateString()}</div>
            <div className="text-muted-foreground">Expiry Date</div>
            <div>
              {item.expiryDate
                ? new Date(item.expiryDate).toLocaleDateString()
                : "N/A"}
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-sm font-medium mb-2">Inventory Locations</h3>
          {item.locations && item.locations.length > 0 ? (
            <div className="space-y-2">
              {item.locations.map((location, index) => (
                <div key={index} className="text-sm p-2 bg-muted/50 rounded-md">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <div className="text-muted-foreground">Location</div>
                    <div>{location.name}</div>
                    <div className="text-muted-foreground">Quantity</div>
                    <div>
                      {location.quantity} {item.unit}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No location data available
            </p>
          )}
        </div>

        {item.notes && (
          <>
            <Separator />
            <div>
              <h3 className="text-sm font-medium mb-2">Notes</h3>
              <p className="text-sm whitespace-pre-line">{item.notes}</p>
            </div>
          </>
        )}

        <Separator />

        <div className="flex gap-2 pt-2">
          {item.msdsUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={item.msdsUrl} target="_blank" rel="noopener noreferrer">
                <FileText className="h-4 w-4 mr-2" />
                MSDS
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>
          )}
          {item.coaUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={item.coaUrl} target="_blank" rel="noopener noreferrer">
                <FileText className="h-4 w-4 mr-2" />
                COA
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between border-t p-6">
        {onEdit && (
          <Button variant="default" onClick={() => onEdit(item.id)}>
            Edit Chemical
          </Button>
        )}
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onPrint(item.id)}
                >
                  <Printer className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Print</TooltipContent>
            </UITooltip>
          </TooltipProvider>

          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onExport(item.id)}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export</TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => onDelete(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </div>
      </CardFooter>
    </Card>
  );
}
