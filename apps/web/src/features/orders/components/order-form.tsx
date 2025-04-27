"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  PlusCircle,
  Trash2,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import {
  createOrder,
  fetchSuppliers,
  fetchMaterials,
  searchSuppliers,
  searchMaterials,
} from "@/app/actions/orders";
import { useToast } from "@/components/ui/use-toast";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import useSWR from "swr";

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

// Helper functions to fetch data with SWR
const suppliersFetcher = async () => await fetchSuppliers();
const materialsFetcher = async () => await fetchMaterials();

/**
 * A form for creating a new purchase order.
 *
 * @param onOrderCreated A callback function that is called when the order
 * is created successfully. The function receives an object with a `success`
 * property indicating whether the order was created successfully, and an
 * optional `orderId` property with the ID of the created order.
 */
export function OrderForm({ onOrderCreated }: OrderFormProps) {
  const { toast } = useToast();

  // Form state
  const [poNumber, setPoNumber] = useState("");
  const [supplier, setSupplier] = useState("");
  const [supplierName, setSupplierName] = useState("");
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

  // State for searchable dropdowns
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("");
  const [materialSearchTerms, setMaterialSearchTerms] = useState<
    Record<string, string>
  >({});
  const [openSupplier, setOpenSupplier] = useState(false);
  const [openMaterial, setOpenMaterial] = useState<Record<string, boolean>>({});

  // Fetch all suppliers and materials with SWR for caching
  const { data: allSuppliers, error: suppliersError } = useSWR(
    "all-suppliers",
    suppliersFetcher,
    { revalidateOnFocus: false }
  );

  const { data: allMaterials, error: materialsError } = useSWR(
    "all-materials",
    materialsFetcher,
    { revalidateOnFocus: false }
  );

  // Filtered suppliers based on search term
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<
    Record<string, Material[]>
  >({});

  // Debounced search for suppliers
  const debouncedSupplierSearch = useCallback(
    async (term: string) => {
      if (!term.trim() && allSuppliers) {
        // If empty term and we have all suppliers, use them (limited to 10)
        setFilteredSuppliers(allSuppliers.slice(0, 10));
        return;
      }

      // Otherwise call the search endpoint
      try {
        const results = await searchSuppliers(term);
        setFilteredSuppliers(results);
      } catch (error) {
        console.error("Error searching suppliers:", error);
        setFilteredSuppliers([]);
      }
    },
    [allSuppliers]
  );

  // Debounced search for materials
  const debouncedMaterialSearch = useCallback(
    async (id: string, term: string) => {
      if (!term.trim() && allMaterials) {
        // If empty term and we have all materials, use them (limited to 10)
        setFilteredMaterials((prev) => ({
          ...prev,
          [id]: allMaterials.slice(0, 10),
        }));
        return;
      }

      // Otherwise call the search endpoint
      try {
        const results = await searchMaterials(term);
        setFilteredMaterials((prev) => ({
          ...prev,
          [id]: results,
        }));
      } catch (error) {
        console.error("Error searching materials:", error);
        setFilteredMaterials((prev) => ({
          ...prev,
          [id]: [],
        }));
      }
    },
    [allMaterials]
  );

  // Update filtered suppliers when search term changes
  useEffect(() => {
    const timer = setTimeout(() => {
      debouncedSupplierSearch(supplierSearchTerm);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [supplierSearchTerm, debouncedSupplierSearch]);

  // Load initial suppliers and materials
  useEffect(() => {
    if (allSuppliers) {
      setFilteredSuppliers(allSuppliers.slice(0, 10));
    }

    // Initialize filteredMaterials for each material in the form
    if (allMaterials) {
      const initialFiltered: Record<string, Material[]> = {};
      materials.forEach((mat) => {
        initialFiltered[mat.id] = allMaterials.slice(0, 10);
      });
      setFilteredMaterials(initialFiltered);
    }
  }, [allSuppliers, allMaterials, materials]);

  // Update material search terms when searching
  const handleMaterialSearch = (id: string, term: string) => {
    setMaterialSearchTerms((prev) => ({
      ...prev,
      [id]: term,
    }));

    const timer = setTimeout(() => {
      debouncedMaterialSearch(id, term);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  };

  // Loading states
  const [submitting, setSubmitting] = useState(false);

  // Add additional material line
  const addMaterial = () => {
    const newId = crypto.randomUUID();
    setMaterials([
      ...materials,
      {
        id: newId,
        materialId: "",
        materialName: "",
        quantity: 1,
      },
    ]);

    // Initialize the material search for this new line
    setOpenMaterial((prev) => ({
      ...prev,
      [newId]: false,
    }));

    setMaterialSearchTerms((prev) => ({
      ...prev,
      [newId]: "",
    }));

    // If we have all materials, initialize the filtered list for this new line
    if (allMaterials) {
      setFilteredMaterials((prev) => ({
        ...prev,
        [newId]: allMaterials.slice(0, 10),
      }));
    }
  };

  // Remove material line
  const removeMaterial = (id: string) => {
    if (materials.length > 1) {
      setMaterials(materials.filter((mat) => mat.id !== id));

      // Clean up state for this material line
      setOpenMaterial((prev) => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });

      setMaterialSearchTerms((prev) => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });

      setFilteredMaterials((prev) => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
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
          return { ...mat, [field]: value };
        }
        return mat;
      })
    );
  };

  // Set material with ID and name
  const setMaterialWithDetails = (
    id: string,
    materialId: string,
    materialName: string
  ) => {
    setMaterials(
      materials.map((mat) => {
        if (mat.id === id) {
          return { ...mat, materialId, materialName };
        }
        return mat;
      })
    );

    // Close the dropdown after selection
    setOpenMaterial((prev) => ({
      ...prev,
      [id]: false,
    }));

    // Reset the search term
    setMaterialSearchTerms((prev) => ({
      ...prev,
      [id]: "",
    }));
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
          <Popover open={openSupplier} onOpenChange={setOpenSupplier}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openSupplier}
                className="w-full justify-between"
              >
                {supplier ? supplierName : "Select a supplier..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput
                  placeholder="Search suppliers..."
                  value={supplierSearchTerm}
                  onValueChange={setSupplierSearchTerm}
                />
                <CommandList>
                  <CommandEmpty>No suppliers found.</CommandEmpty>
                  <CommandGroup>
                    {filteredSuppliers?.map((item) => (
                      <CommandItem
                        key={item.id}
                        value={item.id}
                        onSelect={() => {
                          setSupplier(item.id);
                          setSupplierName(item.name);
                          setOpenSupplier(false);
                          setSupplierSearchTerm("");
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            supplier === item.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {item.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
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
                disabled={(date) => date <= new Date()}
                classNames={{
                  day_disabled: "text-gray-300 opacity-50",
                }}
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
                <Popover
                  open={openMaterial[mat.id]}
                  onOpenChange={(open) => {
                    setOpenMaterial((prev) => ({ ...prev, [mat.id]: open }));
                    // Reset search and reload filtered materials when reopening
                    if (open && allMaterials) {
                      setMaterialSearchTerms((prev) => ({
                        ...prev,
                        [mat.id]: "",
                      }));
                      setFilteredMaterials((prev) => ({
                        ...prev,
                        [mat.id]: allMaterials.slice(0, 10),
                      }));
                    }
                  }}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openMaterial[mat.id]}
                      className="w-full justify-between"
                    >
                      {mat.materialName || "Select a material..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search materials..."
                        value={materialSearchTerms[mat.id] || ""}
                        onValueChange={(term) =>
                          handleMaterialSearch(mat.id, term)
                        }
                      />
                      <CommandList>
                        <CommandEmpty>No materials found.</CommandEmpty>
                        <CommandGroup>
                          {filteredMaterials[mat.id]?.map((item) => (
                            <CommandItem
                              key={item.id}
                              value={item.id}
                              onSelect={() => {
                                setMaterialWithDetails(
                                  mat.id,
                                  item.id,
                                  item.name
                                );
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  mat.materialId === item.id
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {item.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
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
                    updateMaterial(
                      mat.id,
                      "quantity",
                      parseInt(e.target.value) || 1
                    )
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
