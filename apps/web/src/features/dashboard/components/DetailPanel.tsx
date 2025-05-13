"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Check,
  X,
  ExternalLink,
  FileText,
  Info,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { ChemicalItem, Category, ChemicalInventoryLocation } from "../types";
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

import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

interface DetailPanelProps {
  itemId: string | null;
  onClose?: () => void;
  onEdit: (id: string) => void;
  onPrint: (id: string) => void;
}

// Helper function to safely parse JSON storage conditions
const parseStorageConditions = (conditions: any): string => {
  if (typeof conditions === "string") {
    try {
      // Attempt to parse if it looks like JSON, otherwise return as is
      if (
        (conditions.startsWith("{") && conditions.endsWith("}")) ||
        (conditions.startsWith("[") && conditions.endsWith("]"))
      ) {
        return JSON.stringify(JSON.parse(conditions), null, 2);
      }
      return conditions; // Return as plain text if not JSON-like
    } catch (e) {
      return conditions; // Return original string if parsing fails
    }
  } else if (typeof conditions === "object" && conditions !== null) {
    return JSON.stringify(conditions, null, 2);
  }
  return "N/A";
};

/**
 * DetailPanel is a React component that renders a detailed view of a chemical
 * item. It provides a tabbed interface with multiple sections for displaying
 * information about the chemical. The component also provides buttons for
 * editing, printing, and exporting the chemical item.
 *
 * @param {string | null} itemId The ID of the chemical item to display
 * @param {() => void} onClose A callback function to close the panel
 * @param {(id: string) => void} onPrint A callback function to print the chemical
 */
export function DetailPanel({
  itemId,
  onClose,
  onEdit,
  onPrint,
}: DetailPanelProps) {
  const { theme } = useTheme();
  const colors = useColorScheme();
  const supabase = createClient();
  const panelContentRef = useRef<HTMLDivElement>(null);

  const [item, setItem] = useState<ChemicalItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [editFormData, setEditFormData] = useState<Partial<ChemicalItem>>({});

  const initializeFormData = (currentItem: ChemicalItem | null) => {
    if (currentItem) {
      setEditFormData({
        formula: currentItem.formula,
        default_expiry_date: currentItem.default_expiry_date,
        threshold: currentItem.threshold,
        storageConditions: currentItem.storageConditions,
      });
    } else {
      setEditFormData({});
    }
  };

  useEffect(() => {
    async function fetchChemicalDetails() {
      if (!itemId) {
        setItem(null);
        setIsEditing(false);
        initializeFormData(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      setItem(null);
      setIsEditing(false);

      try {
        interface MaterialWithItemsAndSupplier {
          material_id: string;
          name: string;
          cas_number: string;
          chemical_group: string;
          items: {
            supplier_id: string | null;
            suppliers: { name: string | null } | null;
          }[];
          threshold_stock: number | null;
          formula: string | null;
          default_expiry_date: string | null;
          storage_conditions: Record<string, any> | string | null;
        }

        const { data: materialDataUntyped, error: materialError } = await (
          supabase as any
        )
          .schema("inventory")
          .from("materials")
          .select(
            "material_id, name, cas_number, chemical_group, items(supplier_id, suppliers(name)), threshold_stock, formula, default_expiry_date, storage_conditions"
          )
          .eq("material_id", itemId)
          .single();
        const materialData =
          materialDataUntyped as MaterialWithItemsAndSupplier;

        if (materialError) throw materialError;
        if (!materialData) throw new Error("Material not found");

        interface DrumDetail {
          drum_id: string;
          current_location: string | null;
          current_volume: number | null;
          drum_status: string | null;
        }
        const { data: drumDetailsUntyped, error: drumError } = await (
          supabase as any
        )
          .from("v_drum_inventory_details")
          .select("drum_id, current_location, current_volume, drum_status")
          .eq("material_id", itemId)
          .not("drum_status", "in", '("empty", "decommissioned")')
          .returns();
        const drumDetails = drumDetailsUntyped as DrumDetail[];
        const locationsMap = new Map<string, number>();
        let totalQuantity = 0;
        if (drumDetails) {
          drumDetails.forEach((drum) => {
            const locationName = drum.current_location || "Unknown Location";
            locationsMap.set(
              locationName,
              (locationsMap.get(locationName) || 0) + 1
            );
            totalQuantity++;
          });
        }
        const locationsArray: ChemicalInventoryLocation[] = Array.from(
          locationsMap,
          ([name, quantity]) => ({ name, quantity })
        );

        const fetchedItem: ChemicalItem = {
          id: materialData.material_id,
          name: materialData.name,
          formula: materialData.formula,
          casNumber: materialData.cas_number,
          category: materialData.chemical_group as Category,
          hazardLevel: "medium",
          storageConditions: materialData.storage_conditions,
          totalQuantity: totalQuantity,
          threshold: materialData.threshold_stock || 10,
          unit: "drums",
          locations: locationsArray,
          lastUpdated: null,
          default_expiry_date: materialData.default_expiry_date,
          supplier: materialData.items?.[0]?.suppliers?.name || null,
          notes: undefined,
          msdsUrl: undefined,
          coaUrl: undefined,
        };

        setItem(fetchedItem);
        initializeFormData(fetchedItem);
      } catch (err: any) {
        console.error("Error fetching chemical details:", err);
        setError(err.message || "Failed to fetch chemical details.");
        setItem(null);
        initializeFormData(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchChemicalDetails();
  }, [itemId, supabase]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    if (!item) return;
    setIsSaving(true);
    setError(null);

    const updateData: Record<string, any> = {
      formula: editFormData.formula,
      default_expiry_date: editFormData.default_expiry_date || null,
      threshold_stock: editFormData.threshold
        ? parseInt(String(editFormData.threshold), 10)
        : null,
    };

    // Prepare storageConditions for update
    let conditionsToSave: any = null;
    if (
      typeof editFormData.storageConditions === "string" &&
      editFormData.storageConditions.trim() !== ""
    ) {
      try {
        // Try parsing only if it looks like JSON, otherwise save as text (if schema allows)
        if (
          (editFormData.storageConditions.startsWith("{") &&
            editFormData.storageConditions.endsWith("}")) ||
          (editFormData.storageConditions.startsWith("[") &&
            editFormData.storageConditions.endsWith("]"))
        ) {
          conditionsToSave = JSON.parse(editFormData.storageConditions);
        } else {
          // Assuming the DB column can handle plain text if needed, otherwise error
          // If strictly JSONB, might need validation here or save null/error
          console.warn(
            "Saving storage conditions as plain text, ensure DB schema supports this or handle as error."
          );
          conditionsToSave = editFormData.storageConditions; // Or handle error/validation
        }
      } catch (jsonError) {
        setError("Invalid JSON format for Storage Conditions.");
        setIsSaving(false);
        return;
      }
    } else if (
      typeof editFormData.storageConditions === "object" &&
      editFormData.storageConditions !== null
    ) {
      conditionsToSave = editFormData.storageConditions; // Already an object
    }
    updateData.storage_conditions = conditionsToSave;

    try {
      const { error: updateError } = await (supabase as any)
        .schema("inventory")
        .from("materials")
        .update(updateData)
        .eq("material_id", item.id);

      if (updateError) throw updateError;

      setItem((prev) =>
        prev ? ({ ...prev, ...editFormData } as ChemicalItem) : null
      );
      setIsEditing(false);
    } catch (err: any) {
      console.error("Error updating chemical details:", err);
      setError(err.message || "Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    if (!panelContentRef.current) return;

    html2canvas(panelContentRef.current, { scale: 2 }).then(
      (canvas: HTMLCanvasElement) => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "pt",
          format: "a4",
        });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const imgX = (pdfWidth - imgWidth * ratio) / 2;
        const imgY = 30;
        pdf.addImage(
          imgData,
          "PNG",
          imgX,
          imgY,
          imgWidth * ratio,
          imgHeight * ratio
        );
        pdf.save(`${item?.name || "chemical"}_details.pdf`);
      }
    );
    if (item) onPrint(item.id);
  };

  if (isLoading) {
    return (
      <Card className="w-full h-full p-6">
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/4 mt-1" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-20 w-full" />
          <Separator />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
        <CardFooter className="flex justify-between border-t p-6">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </CardFooter>
      </Card>
    );
  }

  if (error && !isEditing) {
    return (
      <Card className="w-full h-full flex flex-col items-center justify-center p-6 bg-destructive/10 border-destructive">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold text-destructive mb-2">
          Error Loading Details
        </h3>
        <p className="text-sm text-destructive/80 mb-4">{error}</p>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </Card>
    );
  }

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

  const locationChartData = item.locations.map((loc) => ({
    name: loc.name,
    quantity: loc.quantity,
  }));

  const daysUntilExpiry = () => {
    if (!item.default_expiry_date) return null;
    const today = new Date();
    const expiry = new Date(item.default_expiry_date);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  const expiryDays = daysUntilExpiry();
  const isExpiringSoon =
    expiryDays !== null && expiryDays < 30 && expiryDays >= 0;
  const isExpired = expiryDays !== null && expiryDays < 0;

  const getHazardBadgeVariant = (
    level?: string | null
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

  const renderEditableField = (
    label: string,
    name: keyof ChemicalItem,
    value: any,
    inputType: "text" | "number" | "date" | "textarea" = "text"
  ) => {
    const displayValue = value ?? "N/A";
    const formValue = editFormData[name] ?? "";

    return (
      <>
        <div className="text-muted-foreground">
          <Label htmlFor={name}>{label}</Label>
        </div>
        <div>
          {isEditing ? (
            inputType === "textarea" ? (
              <Textarea
                id={name}
                name={name}
                value={parseStorageConditions(formValue)}
                onChange={handleInputChange}
                registration={{} as any}
                rows={3}
                className="text-sm"
              />
            ) : (
              <Input
                id={name}
                name={name}
                type={inputType}
                value={String(formValue ?? "")}
                onChange={handleInputChange}
                className="text-sm h-8"
              />
            )
          ) : name === "storageConditions" ? (
            parseStorageConditions(value)
          ) : (
            (value ?? "N/A")
          )}
        </div>
      </>
    );
  };

  return (
    <Card className="w-full h-full overflow-hidden flex flex-col">
      <div ref={panelContentRef} className="flex-grow overflow-y-auto p-6">
        <CardHeader className="pt-0 px-0 pb-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{item.name}</CardTitle>
              <CardDescription>
                CAS: {item.casNumber || item.id}
              </CardDescription>
            </div>
            <Badge variant={getHazardBadgeVariant(item.hazardLevel)}>
              {item.hazardLevel
                ? `${item.hazardLevel.toUpperCase()} HAZARD`
                : "HAZARD N/A"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0 space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">General Information</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div className="text-muted-foreground">Name</div>
              <div>{item.name}</div>
              <div className="text-muted-foreground">CAS Number</div>
              <div>{item.casNumber || "N/A"}</div>
              <div className="text-muted-foreground">Category</div>
              <div>{item.category || "N/A"}</div>
              {renderEditableField("Formula", "formula", item.formula)}
              {renderEditableField(
                "Threshold",
                "threshold",
                item.threshold,
                "number"
              )}
              {renderEditableField(
                "Default Expiry",
                "default_expiry_date",
                item.default_expiry_date,
                "date"
              )}
              {renderEditableField(
                "Storage Conditions",
                "storageConditions",
                item.storageConditions,
                "textarea"
              )}
              <div className="text-muted-foreground">Total Quantity</div>
              <div>
                {item.totalQuantity} {item.unit}
              </div>
              <div className="text-muted-foreground">Supplier</div>
              <div>{item.supplier || "N/A"}</div>
              <div className="text-muted-foreground">Last Updated</div>
              <div>
                {item.lastUpdated
                  ? new Date(item.lastUpdated).toLocaleDateString()
                  : "N/A"}
              </div>
              <div className="text-muted-foreground">Expiry Status</div>
              <div>
                {expiryDays !== null ? `${expiryDays} days remaining` : "N/A"}
                {isExpiringSoon && (
                  <Badge variant="default" className="ml-2 text-xs">
                    Expiring Soon
                  </Badge>
                )}
                {isExpired && (
                  <Badge variant="destructive" className="ml-2 text-xs">
                    Expired
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-medium mb-2">
              Inventory Locations ({item.locations.length})
            </h3>
            {item.locations && item.locations.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                {item.locations.map((location, index) => (
                  <div
                    key={index}
                    className="text-sm p-2 bg-muted/50 rounded-md"
                  >
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
                <a
                  href={item.msdsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
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
            {!item.msdsUrl && !item.coaUrl && (
              <p className="text-sm text-muted-foreground">
                No documents linked.
              </p>
            )}
          </div>
        </CardContent>
      </div>

      <CardFooter className="flex justify-between border-t p-4 mt-auto">
        <div>
          {!isEditing ? (
            <Button
              variant="default"
              onClick={() => {
                setIsEditing(true);
                initializeFormData(item);
              }}
            >
              <Edit className="h-4 w-4 mr-2" /> Edit Chemical
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                setError(null);
                initializeFormData(item);
              }}
            >
              <X className="h-4 w-4 mr-2" /> Cancel
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          {isSaving && "Saving..."}
          {error && isEditing && (
            <span className="text-destructive">Error: {error}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePrint}
                  disabled={isEditing}
                >
                  <Printer className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Print Details</TooltipContent>
            </UITooltip>
          </TooltipProvider>

          {!isEditing ? (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          ) : (
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="success"
                    size="icon"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Save Changes</TooltipContent>
              </UITooltip>
            </TooltipProvider>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
