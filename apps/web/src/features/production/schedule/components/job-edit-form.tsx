"use client";

import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Check,
  ChevronsUpDown,
  CalendarIcon,
  AlertTriangle,
  Save,
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
  fetchStills,
  fetchAvailableBatchesByMaterial,
  updateProductionJobDetails,
} from "@/app/actions/production";
import { fetchMaterials } from "@/app/actions/orders";
import type {
  ProductionJobViewData as JobDetails,
  OperationStatus as TaskStatusType,
} from "@/features/production/types";

// Interfaces from ProductionForm (can be shared or redefined)
interface Material {
  id: string;
  name: string;
}
interface Batch {
  batch_id: string;
  batch_code: string | null;
  drums_in_stock: number;
  supplier_name: string | null;
}
interface Still {
  still_id: number;
  code: string;
  max_capacity: number;
}

interface ProductionJobDataForUpdate {
  batchId?: string;
  plannedDate?: string; // ISO string
  stillId?: number;
  rawVolume?: number;
  priority?: number;
  jobName?: string;
  // jobStatus is handled by a separate action
}

interface TaskDefinition {
  name: string;
  completed: boolean;
  assignedTo?: string;
  details?: string;
  status: TaskStatusType;
  started_at?: string | null;
  ended_at?: string | null;
}

interface JobEditFormProps {
  job: JobDetails;
  onUpdateSuccess: () => void; // Callback to refresh data on parent page
  onCancelEdit: () => void;
}

/**
 * JobEditForm is a React component that provides a form interface for editing
 * production job details. It allows users to modify fields such as job name,
 * material item, input batch, planned start date, still, raw material volume,
 * and priority. The form uses SWR for data fetching and manages form state
 * with React hooks. It validates input fields before submission and handles
 * success or error responses with toast notifications.
 *
 * Props:
 * - job: The initial job details to populate the form fields.
 * - onUpdateSuccess: Callback function triggered upon successful job update.
 * - onCancelEdit: Callback function to handle form cancellation.
 */

export function JobEditForm({
  job,
  onUpdateSuccess,
  onCancelEdit,
}: JobEditFormProps) {
  const { toast } = useToast();

  // Initialize form state from job prop
  const [jobName, setJobName] = useState(job.jobName || "");
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(
    () => {
      // Use material_id from the job if available
      return job.material_id && job.itemName
        ? { id: job.material_id, name: job.itemName }
        : null;
    }
  );
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(() => {
    // Use input_batch_id and batch_code from the job if available
    if (job.batch_id && job.batch_code) {
      return {
        batch_id: job.batch_id,
        batch_code: job.batch_code,
        drums_in_stock: job.quantity, // Still an approximation, ideally view provides actual drums_in_stock for the specific input_batch
        supplier_name: job.supplier,
      };
    }
    return null;
  });
  const [plannedDate, setPlannedDate] = useState<Date | undefined>(
    job.scheduledDate ? new Date(job.scheduledDate) : new Date()
  );
  const [selectedStill, setSelectedStill] = useState<Still | null>(() => {
    const distillationOp = job.tasks?.find(
      (task: TaskDefinition) => task.name === "distillation"
    );
    const stillCodeMatch = distillationOp?.details?.match(/Still: (\w+)/);
    if (stillCodeMatch && stillCodeMatch[1]) {
      // This is a hacky way to get still, ideally view provides still_id for the op
      return {
        still_id: parseInt(stillCodeMatch[1], 10) || 0,
        code: stillCodeMatch[1],
        max_capacity: 0,
      }; // Max capacity unknown here
    }
    return null;
  });

  const [rawVolume, setRawVolume] = useState<number | string>(() => {
    const distillationOp = job.tasks?.find(
      (task: TaskDefinition) => task.name === "distillation"
    );
    const rawVolumeMatch = distillationOp?.details?.match(/Raw Vol: (\d+)L/);
    return rawVolumeMatch ? Number(rawVolumeMatch[1]) : "";
  });
  const [priority, setPriority] = useState<number>(() => {
    if (job.priority === "high") return 10;
    if (job.priority === "medium") return 5;
    if (job.priority === "low") return 1;
    return 5;
  });

  // SWR Data (similar to ProductionForm)
  const [materialSearch, setMaterialSearch] = useState("");
  const [openMaterialPopover, setOpenMaterialPopover] = useState(false);
  const [openStillPopover, setOpenStillPopover] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data: materials, error: materialsError } = useSWR<Material[]>(
    "allMaterials",
    fetchMaterials
  );
  const { data: batches, error: batchesError } = useSWR<Batch[]>(
    selectedMaterial ? `batchesByMaterial-${selectedMaterial.id}` : null,
    selectedMaterial
      ? () => fetchAvailableBatchesByMaterial(selectedMaterial!.id)
      : null
  );
  const { data: stills, error: stillsError } = useSWR<Still[]>(
    "allStills",
    fetchStills
  );

  // Effect to try and pre-select still if its code matches one from the fetched list
  useEffect(() => {
    if (
      selectedStill &&
      selectedStill.code &&
      stills &&
      !stills.find((s) => s.still_id === selectedStill.still_id)
    ) {
      const matchingStill = stills.find((s) => s.code === selectedStill.code);
      if (matchingStill) setSelectedStill(matchingStill);
    }
  }, [stills, selectedStill]);

  // Reset dependent fields (similar to ProductionForm)
  useEffect(() => {
    setSelectedBatch(null);
    setRawVolume("");
  }, [selectedMaterial]);

  const filteredMaterials = materials?.filter((m) =>
    m.name.toLowerCase().includes(materialSearch.toLowerCase())
  );

  const handleBatchSelect = (batch: Batch) => {
    setSelectedBatch(batch);
    setRawVolume(batch.drums_in_stock * 200);
  };

  const validateForm = (): boolean => {
    // Simplified validation for an edit form, can be expanded
    if (!selectedMaterial) {
      toast.error("Material is required.");
      return false;
    }
    if (!selectedBatch) {
      toast.error("Input batch is required.");
      return false;
    }
    if (!plannedDate) {
      toast.error("Planned date is required.");
      return false;
    }
    if (!selectedStill) {
      toast.error("Still is required.");
      return false;
    }
    if (!rawVolume || isNaN(Number(rawVolume)) || Number(rawVolume) <= 0) {
      toast.error("Valid raw volume is required.");
      return false;
    }
    // Add volume checks against batch stock and still capacity if needed
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitting(true);

    const updatePayload: ProductionJobDataForUpdate = {
      jobName: jobName !== job.jobName ? jobName : undefined,
      batchId: selectedBatch?.batch_id, // This needs to be the *actual* input_batch_id
      plannedDate: plannedDate?.toISOString(),
      // stillId and rawVolume need careful handling as they might not be direct job fields
      // This depends on how `updateProductionJobDetails` is implemented to handle them (e.g. via RPC for operations table)
      // For now, we assume they can be passed if `updateProductionJobDetails` handles them.
      stillId: selectedStill?.still_id,
      rawVolume: Number(rawVolume),
      priority: priority,
    };

    // Filter out undefined values to only send changed fields
    const definedPayload = Object.fromEntries(
      Object.entries(updatePayload).filter(([_, v]) => v !== undefined)
    );

    const result = await updateProductionJobDetails(job.id, definedPayload);
    setSubmitting(false);

    if (result.success) {
      toast.success("Job details updated successfully!");
      onUpdateSuccess();
    } else {
      toast.error(result.message || "Failed to update job details.");
    }
  };

  if (materialsError || batchesError || stillsError) {
    return (
      <div className="text-destructive p-4">
        <AlertTriangle className="inline mr-2" />
        Error loading form data.
      </div>
    );
  }

  // FORM JSX (heavily based on ProductionForm, adapted for editing)
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      className="space-y-6 p-1"
    >
      <div className="space-y-2">
        <Label htmlFor="jobNameEdit">Job Name (Optional)</Label>
        <Input
          id="jobNameEdit"
          type="text"
          value={jobName}
          onChange={(e) => setJobName(e.target.value)}
        />
      </div>

      {/* Material Item (similar to ProductionForm) */}
      <div className="space-y-2">
        <Label htmlFor="materialEdit">Material Item</Label>
        <Popover
          open={openMaterialPopover}
          onOpenChange={setOpenMaterialPopover}
        >
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="w-full justify-between"
              disabled={!materials}
            >
              {selectedMaterial?.name ??
                (materials ? (
                  "Select material..."
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ))}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
            <Command>
              <CommandInput
                placeholder="Search materials..."
                value={materialSearch}
                onValueChange={setMaterialSearch}
              />
              <CommandList>
                <CommandEmpty>No materials found.</CommandEmpty>
                <CommandGroup>
                  {filteredMaterials?.map((m) => (
                    <CommandItem
                      key={m.id}
                      value={m.name}
                      onSelect={() => {
                        setSelectedMaterial(m);
                        setOpenMaterialPopover(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedMaterial?.id === m.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {m.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Batch Selection (similar to ProductionForm, needs job.input_batch_id for correct initial state) */}
      {selectedMaterial && (
        <div className="space-y-2 pt-4">
          <Label>Select Input Batch for: {selectedMaterial.name}</Label>
          {!batches && !batchesError && (
            <Loader2 className="h-5 w-5 animate-spin my-4" />
          )}
          {batchesError && (
            <p className="text-destructive text-sm">Error loading batches.</p>
          )}
          {batches && batches.length === 0 && (
            <p className="text-muted-foreground text-sm p-4 border rounded-md bg-muted/50">
              No in-stock batches.
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
                      Supplier: {batch.supplier_name || "N/A"}
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

      {/* Date and Still (similar to ProductionForm) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <div className="space-y-2">
          <Label htmlFor="plannedDateEdit">Planned Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="plannedDateEdit"
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
                }
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label htmlFor="stillEdit">Still</Label>
          <Popover open={openStillPopover} onOpenChange={setOpenStillPopover}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
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
                <CommandList>
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

      {/* Volume and Priority (similar to ProductionForm) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <div className="space-y-2">
          <Label htmlFor="rawVolumeEdit">Raw Material Volume (L)</Label>
          <Input
            id="rawVolumeEdit"
            type="number"
            value={rawVolume}
            onChange={(e) => setRawVolume(e.target.value)}
            placeholder={`E.g., ${selectedBatch ? selectedBatch.drums_in_stock * 200 : 200}`}
            min={1}
            disabled={!selectedBatch || !selectedStill}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="priorityEdit">Priority</Label>
          <Input
            id="priorityEdit"
            type="number"
            value={priority}
            onChange={(e) => setPriority(parseInt(e.target.value, 10) || 5)}
            min={1}
            max={10}
          />
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancelEdit}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={
            submitting || !selectedBatch || !selectedStill || !rawVolume
          }
        >
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </form>
  );
}
