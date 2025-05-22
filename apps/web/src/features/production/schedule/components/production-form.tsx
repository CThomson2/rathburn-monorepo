"use client";

import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  PlusCircle,
  Trash2,
  Check,
  ChevronsUpDown,
  CalendarIcon,
  AlertTriangle,
} from "lucide-react";
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
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  createProductionJob,
  fetchStills,
  fetchAvailableBatchesByMaterial,
} from "@/app/actions/production"; // Corrected path
import { fetchMaterials } from "@/app/actions/orders"; // Assuming this action will be created
import { fetchItemsByMaterialId } from "@/app/actions/batches";
import { ProductionJobData } from "@/features/production/types";

import { useAuth } from "@/hooks/use-auth";

interface Material {
  id: string;
  name: string;
  // materialId: string; // Not strictly needed for form display if name is unique enough
}

interface Item {
  id: string;
  name: string;
}

interface Batch {
  batch_id: string;
  batch_code: string | null;
  drums_in_stock: number;
  supplier_name: string | null; // ADDED
}

interface Still {
  still_id: number;
  code: string;
  max_capacity: number;
}

interface ProductionFormProps {
  onJobCreated: (result: {
    success: boolean;
    jobId?: string;
    message?: string;
    jobName?: string;
    jobStatus?: "drafted" | "scheduled";
  }) => void;
  onCancel: () => void;
}

export function ProductionForm({
  onJobCreated,
  onCancel,
}: ProductionFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  if (!user) {
    toast.error("User not found. Please log in.");
    return (
      <div className="flex flex-col items-center justify-center text-destructive p-8">
        <AlertTriangle className="w-12 h-12 mb-4" />
        <p className="text-lg">Error loading scheduling data.</p>
        <p>Please try closing and reopening the dialog.</p>
      </div>
    );
  }

  console.log("ProductionForm: Component rendering/re-rendering");

  // Form State
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(
    null
  );
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [plannedDate, setPlannedDate] = useState<Date | undefined>(new Date());
  const [selectedStill, setSelectedStill] = useState<Still | null>(null);
  const [rawVolume, setRawVolume] = useState<number | string>("");
  const [priority, setPriority] = useState<number>(10);
  const [jobName, setJobName] = useState<string>("");

  console.log("ProductionForm: Current State", {
    selectedMaterial,
    selectedBatch,
    plannedDate: plannedDate?.toISOString(),
    selectedStill,
    rawVolume,
    priority,
    jobName,
  });

  // UI State for Popovers/Commands
  const [materialSearch, setMaterialSearch] = useState("");
  const [openMaterialPopover, setOpenMaterialPopover] = useState(false);
  const [openStillPopover, setOpenStillPopover] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // SWR Data Fetching
  const { data: items, error: itemsError } = useSWR<Material[]>(
    "allMaterials", // Changed: Fetch all items initially
    () => {
      console.log("ProductionForm: Fetching all materials");
      return fetchMaterials(); // Changed: Use new action
    }
  );

  const { data: batches, error: batchesError } = useSWR<Batch[]>(
    selectedMaterial ? `batchesByMaterial-${selectedMaterial.id}` : null,
    () => {
      console.log(
        "ProductionForm: Fetching batches for material:",
        selectedMaterial?.id
      );
      return fetchAvailableBatchesByMaterial(selectedMaterial!.id);
    }
  );
  const { data: stills, error: stillsError } = useSWR<Still[]>(
    "allStills",
    () => {
      console.log("ProductionForm: Fetching stills");
      return fetchStills();
    }
  );

  // Reset dependent fields when a higher-level selection changes
  useEffect(() => {
    // const item = fetchItemByMaterialId(selectedMaterial?.id || "");
    // console.log("ProductionForm: item:", item);
    // setSelectedMaterial(item);
    console.log(
      "ProductionForm: useEffect for selectedItem changed. Current item:",
      selectedMaterial
    );
    setSelectedBatch(null);
    setRawVolume(""); // Reset volume when item/batch context changes
  }, [selectedMaterial]);

  const filteredItems = items?.filter((i) =>
    i.name.toLowerCase().includes(materialSearch.toLowerCase())
  );

  const handleBatchSelect = (batch: Batch) => {
    console.log("ProductionForm: handleBatchSelect called with batch:", batch);
    setSelectedBatch(batch);
    const newRawVolume = batch.drums_in_stock * 200;
    setRawVolume(newRawVolume);
    console.log(
      "ProductionForm: selectedBatch set, rawVolume set to:",
      newRawVolume
    );
  };

  const validateForm = (): boolean => {
    console.log("ProductionForm: validateForm called. Current form values:", {
      selectedMaterial,
      selectedBatch,
      plannedDate,
      selectedStill,
      rawVolume,
      priority,
      jobName,
    });
    if (!selectedMaterial) {
      toast.error("Material item is required.");
      console.log(
        "ProductionForm: Validation failed - Material item is required."
      );
      return false;
    }
    if (!selectedBatch) {
      toast.error("Input batch is required.");
      console.log(
        "ProductionForm: Validation failed - Input batch is required."
      );
      return false;
    }
    if (!plannedDate) {
      toast.error("Planned date is required.");
      console.log(
        "ProductionForm: Validation failed - Planned date is required."
      );
      return false;
    }
    if (!selectedStill) {
      toast.error("Distillation still is required.");
      console.log(
        "ProductionForm: Validation failed - Distillation still is required."
      );
      return false;
    }
    if (!rawVolume || isNaN(Number(rawVolume)) || Number(rawVolume) <= 0) {
      toast.error("Valid raw material volume is required.");
      console.log(
        "ProductionForm: Validation failed - Valid raw material volume is required. Raw volume:",
        rawVolume
      );
      return false;
    }
    if (
      selectedBatch &&
      Number(rawVolume) > selectedBatch.drums_in_stock * 200
    ) {
      toast.error(
        `Volume exceeds available stock in batch (${
          selectedBatch.drums_in_stock * 200
        }L).`
      );
      console.log(
        "ProductionForm: Validation failed - Volume exceeds available stock in batch."
      );
      return false;
    }
    if (selectedStill && Number(rawVolume) > selectedStill.max_capacity * 200) {
      toast.error(
        `Volume exceeds still capacity (${selectedStill.max_capacity * 200}L).`
      );
      console.log(
        "ProductionForm: Validation failed - Volume exceeds still capacity."
      );
      return false;
    }
    console.log("ProductionForm: Validation successful.");
    return true;
  };

  const handleSubmit = async (status: "drafted" | "scheduled") => {
    console.log(`ProductionForm: handleSubmit called with status: ${status}`);
    if (!validateForm()) {
      console.log(
        "ProductionForm: handleSubmit - validation failed, aborting submission."
      );
      return;
    }

    console.log(
      "ProductionForm: handleSubmit - validation passed, proceeding with submission."
    );
    setSubmitting(true);

    const jobData: ProductionJobData = {
      batchId: selectedBatch!.batch_id,
      plannedDate: plannedDate!.toISOString(),
      stillId: selectedStill!.still_id,
      rawVolume: Number(rawVolume),
      priority: priority,
      jobName: jobName || undefined,
      jobStatus: status,
      createdBy: user.id,
    };

    const result = await createProductionJob(jobData);

    onJobCreated({ ...result, jobName, jobStatus: status });

    if (result.success) {
      toast.success(
        `Production job ${jobName ? `'${jobName}' ` : ""}(${result.jobId?.slice(0, 8)}) ${status} successfully!`
      );
    } else {
      toast.error(result.message || `Failed to ${status} job.`);
    }
    setSubmitting(false);
  };

  if (itemsError || batchesError || stillsError) {
    return (
      <div className="flex flex-col items-center justify-center text-destructive p-8">
        <AlertTriangle className="w-12 h-12 mb-4" />
        <p className="text-lg">Error loading scheduling data.</p>
        <p>Please try closing and reopening the dialog.</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
      }}
      className="space-y-6 p-1"
    >
      {/* Row 0: Optional Job Name */}
      <div className="space-y-2">
        <Label htmlFor="jobName">Job Name (Optional)</Label>
        <Input
          id="jobName"
          type="text"
          value={jobName}
          onChange={(e) => setJobName(e.target.value)}
          placeholder="E.g., Acetonitrile (ICC) 70w for ACROS"
        />
      </div>

      {/* Row 1: Item Selection (was Item and Supplier) */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
        {" "}
        {/* Changed to 1 col for item only */}
        <div className="space-y-2">
          <Label htmlFor="item">Material Item</Label>
          <Popover
            open={openMaterialPopover}
            onOpenChange={setOpenMaterialPopover}
            modal={true}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openMaterialPopover}
                className="w-full justify-between"
                // disabled={!selectedSupplier || !items} // REMOVED supplier dependency
                disabled={!items} // Item selection is now independent
              >
                {selectedMaterial?.name ??
                  (items ? ( // Simplified logic
                    "Select item..."
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ))}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput
                  placeholder="Search items..."
                  value={materialSearch}
                  onValueChange={setMaterialSearch}
                />
                <CommandList>
                  <CommandEmpty>
                    {/* No items found for this supplier.  REMOVED supplier context */}
                    No items found.
                  </CommandEmpty>
                  <CommandGroup>
                    {filteredItems?.map((i) => (
                      <CommandItem
                        key={i.id}
                        value={i.name}
                        onSelect={() => {
                          setSelectedMaterial(i);
                          setOpenMaterialPopover(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedMaterial?.id === i.id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {i.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* REMOVED Supplier Popover Section */}
      {/* <div className="space-y-2">
        <Label htmlFor="supplier">Supplier</Label>
        <Popover
          open={openSupplierPopover}
          onOpenChange={setOpenSupplierPopover}
        >
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openSupplierPopover}
              className="w-full justify-between"
              disabled={!suppliers}
            >
              {selectedSupplier?.name ??
                (suppliers ? (
                  "Select supplier..."
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ))}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
            <Command>
              <CommandInput
                placeholder="Search suppliers..."
                value={supplierSearch}
                onValueChange={setSupplierSearch}
              />
              <CommandList>
                <CommandEmpty>No suppliers found.</CommandEmpty>
                <CommandGroup>
                  {filteredSuppliers?.map((s) => (
                    <CommandItem
                      key={s.id}
                      value={s.name}
                      onSelect={() => {
                        setSelectedSupplier(s);
                        setOpenSupplierPopover(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedSupplier?.id === s.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {s.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div> */}

      {/* Row 2: Batch Selection (conditionally rendered) */}
      {selectedMaterial && (
        <div className="space-y-2 pt-4">
          <Label>Select Input Batch for: {selectedMaterial.name}</Label>
          {!batches && <Loader2 className="h-5 w-5 animate-spin my-4" />}
          {batchesError && (
            <p className="text-destructive text-sm">Error loading batches.</p>
          )}
          {batches && batches.length === 0 && (
            <p className="text-muted-foreground text-sm p-4 border rounded-md bg-muted/50">
              No in-stock batches found for this item.
            </p>
          )}
          {batches && batches.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2 bg-muted/20">
              {batches.map((batch) => (
                <Button
                  key={batch.batch_id}
                  type="button"
                  variant={
                    selectedBatch?.batch_id === batch.batch_id
                      ? "default"
                      : "outline"
                  }
                  className="w-full justify-start text-left h-auto py-2"
                  onClick={() => handleBatchSelect(batch)}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold">
                      Batch Code: {batch.batch_code || "N/A"}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Supplier: {batch.supplier_name || "N/A"}{" "}
                      {/* ADDED supplier display */}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Drums in Stock: {batch.drums_in_stock}
                    </span>
                  </div>
                  {selectedBatch?.batch_id === batch.batch_id && (
                    <Check className="ml-auto h-5 w-5 text-primary-foreground" />
                  )}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Row 3: Date and Still */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <div className="space-y-2">
          <Label htmlFor="plannedDate">Planned Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="plannedDate"
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !plannedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {plannedDate ? (
                  format(plannedDate, "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={plannedDate}
                onSelect={setPlannedDate}
                initialFocus
                disabled={(date) =>
                  date < new Date(new Date().setHours(0, 0, 0, 0))
                } // Disable past dates
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="still">Still</Label>
          <Popover
            open={openStillPopover}
            onOpenChange={setOpenStillPopover}
            modal={true}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openStillPopover}
                className="w-full justify-between"
                disabled={!stills}
              >
                {selectedStill?.code ? (
                  `Still ${selectedStill.code}`
                ) : stills ? (
                  "Select still..."
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput placeholder="Search stills..." />
                <CommandList className="max-h-[300px] overflow-y-auto">
                  <CommandEmpty>No stills found.</CommandEmpty>
                  <CommandGroup>
                    {stills?.map((s) => (
                      <CommandItem
                        key={s.still_id}
                        value={s.code}
                        onSelect={() => {
                          setSelectedStill(s);
                          setOpenStillPopover(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedStill?.still_id === s.still_id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        Still {s.code} (Capacity: {s.max_capacity * 200}L)
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Row 4: Volume and Priority */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <div className="space-y-2">
          <Label htmlFor="rawVolume">Raw Material Volume (L)</Label>
          <Input
            id="rawVolume"
            type="number"
            value={rawVolume}
            onChange={(e) => setRawVolume(e.target.value)}
            placeholder={`E.g., ${selectedBatch ? selectedBatch.drums_in_stock * 200 : 200}`}
            min={1}
            disabled={!selectedBatch || !selectedStill}
          />
          {selectedBatch &&
            Number(rawVolume) > selectedBatch.drums_in_stock * 200 && (
              <p className="text-xs text-destructive">
                Max available: {selectedBatch.drums_in_stock * 200}L
              </p>
            )}
          {selectedStill &&
            Number(rawVolume) > selectedStill.max_capacity * 200 && (
              <p className="text-xs text-destructive">
                Still capacity: {selectedStill.max_capacity * 200}L
              </p>
            )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priority (1-10, 10 is default)</Label>
          <Input
            id="priority"
            type="number"
            value={priority}
            onChange={(e) => setPriority(parseInt(e.target.value, 10) || 10)}
            min={1}
            max={10}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4 pt-6">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={() => handleSubmit("drafted")}
          disabled={
            submitting || !selectedBatch || !selectedStill || !rawVolume
          }
          variant="outline"
        >
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitting ? "Saving Draft..." : "Save as Draft"}
        </Button>
        <Button
          type="button"
          onClick={() => handleSubmit("scheduled")}
          disabled={
            submitting || !selectedBatch || !selectedStill || !rawVolume
          }
        >
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitting ? "Scheduling..." : "Schedule Job"}
        </Button>
      </div>
    </form>
  );
}
