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
  fetchItemsBySupplier,
  searchItemsBySupplier,
  getNextPONumber,
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
  email?: string;
}

interface Item {
  id: string;
  name: string;
  materialId: string;
  supplierId?: string;
}

interface OrderMaterial {
  id: string;
  itemId: string;
  itemName: string;
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
const itemsBySupplierFetcher = async (supplierId: string) => {
  if (!supplierId) return [];
  return await fetchItemsBySupplier(supplierId);
};

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
      itemId: "",
      itemName: "",
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
    suppliersFetcher
  );

  // Fetch items for the selected supplier
  const { data: supplierItems, error: itemsError } = useSWR(
    supplier ? `supplier-items-${supplier}` : null,
    () => itemsBySupplierFetcher(supplier),
    { revalidateOnFocus: false }
  );

  // Auto-generate PO number on load
  useEffect(() => {
    const fetchNextPONumber = async () => {
      try {
        const nextPoNumber = await getNextPONumber();
        if (nextPoNumber) {
          console.log("nextPoNumber", nextPoNumber);
          setPoNumber(nextPoNumber);
        }
      } catch (error) {
        console.error("Error fetching next PO number:", error);
      }
    };

    fetchNextPONumber();
  }, []);

  // Reset material selections when supplier changes
  useEffect(() => {
    if (supplier) {
      // Reset all material selections when supplier changes
      setMaterials((prev) =>
        prev.map((mat) => ({
          ...mat,
          itemId: "",
          itemName: "",
        }))
      );

      // Clear filtered materials
      setFilteredMaterials({});

      // Reset search terms
      setMaterialSearchTerms({});
    }
  }, [supplier]);

  // Filtered suppliers based on search term
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<
    Record<string, Item[]>
  >({});

  // Filter suppliers client-side based on search term
  useEffect(() => {
    if (!allSuppliers) return;

    if (!supplierSearchTerm.trim()) {
      // Show all suppliers if no search term
      setFilteredSuppliers(allSuppliers);
      return;
    }

    // Client-side filtering based on search term
    const searchTermLower = supplierSearchTerm.toLowerCase();

    const filtered = allSuppliers.filter((supplier) => {
      const supplierNameLower = supplier.name.toLowerCase();
      return supplierNameLower.includes(searchTermLower);
    });

    setFilteredSuppliers(filtered);
  }, [supplierSearchTerm, allSuppliers]);

  // Client-side filtering for items by supplier
  const filterItemsBySearch = useCallback(
    async (id: string, term: string) => {
      if (!supplier) {
        // If no supplier is selected, we can't search for items
        setFilteredMaterials((prev) => ({
          ...prev,
          [id]: [],
        }));
        return;
      }

      if (!term.trim() && supplierItems) {
        // If empty term and we have supplier items, use them all
        setFilteredMaterials((prev) => ({
          ...prev,
          [id]: supplierItems as Item[],
        }));
        return;
      }

      // Client-side filtering for material items
      if (supplierItems) {
        const searchTermLower = term.toLowerCase();
        const filtered = (supplierItems as Item[]).filter((item) =>
          item.name.toLowerCase().includes(searchTermLower)
        );
        setFilteredMaterials((prev) => ({
          ...prev,
          [id]: filtered,
        }));
        return;
      }

      // Fallback to server search if supplierItems is not available
      try {
        const results = await searchItemsBySupplier(supplier, term);
        setFilteredMaterials((prev) => ({
          ...prev,
          [id]: results as Item[],
        }));
      } catch (error) {
        console.error("Error searching items:", error);
        setFilteredMaterials((prev) => ({
          ...prev,
          [id]: [],
        }));
      }
    },
    [supplier, supplierItems]
  );

  // Load initial suppliers
  useEffect(() => {
    if (allSuppliers) {
      setFilteredSuppliers(allSuppliers);
    }
  }, [allSuppliers]);

  // Initialize filtered items when supplier items load
  useEffect(() => {
    if (supplierItems && supplier) {
      const initialFiltered: Record<string, Item[]> = {};
      materials.forEach((mat) => {
        initialFiltered[mat.id] = supplierItems as Item[];
      });
      setFilteredMaterials(initialFiltered);
    }
  }, [supplierItems, supplier, materials]);

  // Update material search terms when searching
  const handleMaterialSearch = (id: string, term: string) => {
    setMaterialSearchTerms((prev) => ({
      ...prev,
      [id]: term,
    }));

    // Call the search function immediately without debounce
    filterItemsBySearch(id, term);
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
        itemId: "",
        itemName: "",
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

    // If we have supplier items, initialize the filtered list for this new line
    if (supplierItems) {
      setFilteredMaterials((prev) => ({
        ...prev,
        [newId]: supplierItems as Item[],
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
    itemId: string,
    itemName: string
  ) => {
    setMaterials(
      materials.map((mat) => {
        if (mat.id === id) {
          return { ...mat, itemId, itemName };
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
      materials.every((mat) => mat.itemId !== "" && mat.quantity > 0)
    );
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid()) {
      console.log("Order form validation failed, showing toast");
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
        formData.append(`material-${index + 1}-name`, mat.itemName);
        formData.append(`material-${index + 1}-id`, mat.itemId);
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
        console.log("Order created successfully, showing success toast");
        toast({
          title: "Order Created",
          description: `Purchase Order ${poNumber} has been created successfully.`,
        });
      } else {
        console.log(
          "Order creation failed, showing error toast",
          result.message
        );
        toast({
          title: "Error",
          description: result.message || "Failed to create order",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating order:", error);
      console.log("Exception in order creation, showing error toast");
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
            placeholder="e.g. 2023-04-27ARS"
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
                    {filteredSuppliers?.map((item) => {
                      return (
                        <CommandItem
                          key={item.id}
                          value={item.name}
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
                      );
                    })}
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

        {!supplier && (
          <div className="p-4 mb-4 border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-900 rounded-md text-yellow-800 dark:text-yellow-200">
            Please select a supplier first to see available materials.
          </div>
        )}

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
                    // Don't allow opening if no supplier selected
                    if (!supplier && open) {
                      toast({
                        title: "Select Supplier First",
                        description:
                          "Please select a supplier before choosing materials",
                        variant: "destructive",
                      });
                      return;
                    }

                    setOpenMaterial((prev) => ({ ...prev, [mat.id]: open }));
                    // Reset search and reload filtered materials when reopening
                    if (open && supplierItems) {
                      setMaterialSearchTerms((prev) => ({
                        ...prev,
                        [mat.id]: "",
                      }));
                      setFilteredMaterials((prev) => ({
                        ...prev,
                        [mat.id]: (supplierItems || []) as Item[],
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
                      disabled={!supplier}
                    >
                      {mat.itemName || "Select a material..."}
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
                        <CommandEmpty>
                          {supplier
                            ? "No materials found for this supplier."
                            : "Please select a supplier first."}
                        </CommandEmpty>
                        <CommandGroup>
                          {filteredMaterials[mat.id]?.map((item) => (
                            <CommandItem
                              key={item.id}
                              value={item.name}
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
                                  mat.itemId === item.id
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
