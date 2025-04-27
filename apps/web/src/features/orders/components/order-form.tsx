"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, PlusCircle, Trash2 } from "lucide-react";
import { createOrder } from "@/app/actions/orders";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Supplier {
  id: string;
  name: string;
}

interface Material {
  id: string;
  name: string;
}

interface OrderMaterial {
  id: string;
  materialId: string;
  materialName: string;
  quantity: number;
  weight?: number;
}

interface OrderFormProps {
  onOrderCreated: (result: {
    success: boolean;
    orderId?: string;
    message?: string;
  }) => void;
}

export default function OrderForm({ onOrderCreated }: OrderFormProps) {
  const { toast } = useToast();

  // Form state
  const [poNumber, setPoNumber] = useState("");
  const [supplier, setSupplier] = useState("");
  const [orderDate, setOrderDate] = useState<Date>(new Date());
  const [etaDate, setEtaDate] = useState<Date | undefined>(undefined);
  const [materials, setMaterials] = useState<OrderMaterial[]>([
    {
      id: crypto.randomUUID(),
      materialId: "",
      materialName: "",
      quantity: 1,
    },
  ]);

  // API data
  const [suppliers, setSuppliers] = useState<Supplier[]>([
    { id: "0e84084f-139e-44b5-8041-faabbad25166", name: "Acme Corp" },
    { id: "1e84084f-139e-44b5-8041-faabbad25167", name: "Globex Industries" },
    { id: "2e84084f-139e-44b5-8041-faabbad25168", name: "Initech" },
  ]);
  const [materialOptions, setMaterialOptions] = useState<Material[]>([
    { id: "de651fa6-bcfd-4127-b266-8c23e473583e", name: "Acetone" },
    { id: "de651fa6-bcfd-4127-b266-8c23e473583f", name: "Methanol" },
    { id: "de651fa6-bcfd-4127-b266-8c23e473584g", name: "Ethanol" },
  ]);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Add additional material line
  const addMaterial = () => {
    setMaterials([
      ...materials,
      {
        id: crypto.randomUUID(),
        materialId: "",
        materialName: "",
        quantity: 1,
      },
    ]);
  };

  // Remove material line
  const removeMaterial = (id: string) => {
    if (materials.length > 1) {
      setMaterials(materials.filter((mat) => mat.id !== id));
    } else {
      toast({
        title: "Cannot remove",
        description: "At least one material is required",
        variant: "destructive",
        onClose: () => {},
      });
    }
  };

  // Update material field
  const updateMaterial = (
    id: string,
    field: keyof OrderMaterial,
    value: any
  ) => {
    setMaterials(
      materials.map((mat) => {
        if (mat.id === id) {
          if (field === "materialId") {
            // When materialId changes, also update the materialName
            const selectedMaterial = materialOptions.find(
              (m) => m.id === value
            );
            return {
              ...mat,
              [field]: value,
              materialName: selectedMaterial ? selectedMaterial.name : "",
            };
          }
          return { ...mat, [field]: value };
        }
        return mat;
      })
    );
  };

  // Form validation
  const isValid = () => {
    return (
      poNumber.trim() !== "" &&
      supplier !== "" &&
      orderDate !== undefined &&
      materials.every((mat) => mat.materialId !== "" && mat.quantity > 0)
    );
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append("poNumber", poNumber);
      formData.append("supplier", supplier);
      formData.append("orderDate", orderDate.toISOString());

      if (etaDate) {
        formData.append("etaDate", etaDate.toISOString());
      }

      // Add materials
      materials.forEach((mat, index) => {
        formData.append(`material-${index + 1}-name`, mat.materialName);
        formData.append(`material-${index + 1}-id`, mat.materialId);
        formData.append(
          `material-${index + 1}-quantity`,
          mat.quantity.toString()
        );

        if (mat.weight) {
          formData.append(
            `material-${index + 1}-weight`,
            mat.weight.toString()
          );
        }
      });

      const result = await createOrder(formData);
      onOrderCreated(result);

      if (result.success) {
        toast({
          title: "Order Created",
          description: `Purchase Order ${poNumber} has been created successfully.`,
        });
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to create order",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      onOrderCreated({
        success: false,
        message: "An unexpected error occurred",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PO Number */}
        <div className="space-y-2">
          <Label htmlFor="poNumber" className="required">
            Purchase Order Number
          </Label>
          <Input
            id="poNumber"
            value={poNumber}
            onChange={(e) => setPoNumber(e.target.value)}
            placeholder="e.g. PO-2025-001"
            required
          />
        </div>

        {/* Supplier */}
        <div className="space-y-2">
          <Label htmlFor="supplier" className="required">
            Supplier
          </Label>
          <Select value={supplier} onValueChange={setSupplier} required>
            <SelectTrigger id="supplier">
              <SelectValue placeholder="Select a supplier" />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Order Date */}
        <div className="space-y-2">
          <Label htmlFor="orderDate" className="required">
            Order Date
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="orderDate"
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !orderDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {orderDate ? (
                  format(orderDate, "PPP")
                ) : (
                  <span>Select date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={orderDate}
                onSelect={(date) => date && setOrderDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* ETA Date (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="etaDate">Expected Arrival Date (Optional)</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="etaDate"
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !etaDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {etaDate ? format(etaDate, "PPP") : <span>Select date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={etaDate}
                onSelect={setEtaDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium">Order Materials</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addMaterial}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Material
          </Button>
        </div>

        <div className="space-y-4">
          {materials.map((mat, index) => (
            <div
              key={mat.id}
              className="p-4 border rounded-md grid grid-cols-1 md:grid-cols-12 gap-4 items-end"
            >
              <div className="space-y-2 md:col-span-5">
                <Label htmlFor={`material-${index}-name`} className="required">
                  Material
                </Label>
                <Select
                  value={mat.materialId}
                  onValueChange={(value) =>
                    updateMaterial(mat.id, "materialId", value)
                  }
                  required
                >
                  <SelectTrigger id={`material-${index}-name`}>
                    <SelectValue placeholder="Select a material" />
                  </SelectTrigger>
                  <SelectContent>
                    {materialOptions.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-3">
                <Label
                  htmlFor={`material-${index}-quantity`}
                  className="required"
                >
                  Drum Quantity
                </Label>
                <Input
                  id={`material-${index}-quantity`}
                  type="number"
                  min={1}
                  value={mat.quantity}
                  onChange={(e) =>
                    updateMaterial(mat.id, "quantity", parseInt(e.target.value))
                  }
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-3">
                <Label htmlFor={`material-${index}-weight`}>
                  Drum Weight (kg)
                </Label>
                <Input
                  id={`material-${index}-weight`}
                  type="number"
                  step="0.01"
                  min={0}
                  value={mat.weight || ""}
                  onChange={(e) =>
                    updateMaterial(
                      mat.id,
                      "weight",
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                  placeholder="Optional"
                />
              </div>

              <div className="md:col-span-1 flex justify-end items-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeMaterial(mat.id)}
                  disabled={materials.length <= 1}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <Button type="submit" disabled={submitting || !isValid()}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitting ? "Creating Order..." : "Create Order"}
        </Button>
      </div>
    </form>
  );
}

/**
 * Testing with Postman
To test this function in Postman:
URL Structure:
123
Where 123 is the drum ID you want to generate a label for.
Response:
The function returns a PDF file directly in the response body
Content-Type will be application/pdf
Postman will display the PDF in its preview window or offer to download it
Postman won't open a browser - it will display the PDF in its own viewer or let you save it. The Content-Disposition: inline header tells clients to display the PDF rather than download it, but how this is handled depends on the client.
To properly view the PDF, you can:
Use Postman's visualizer
Save the response to a file
Copy the request URL to a browser, which will display the PDF directly
 */
