"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

// Manually define the type based on the view structure
interface DrumDetailView {
  drum_id: string;
  serial_number: string | null; // View might have null serial if drum is somehow invalid
  drum_status: string | null;
  current_volume: number | null;
  current_location: string | null;
  drum_created_at: string | null;
  drum_updated_at: string | null;
  batch_id: string | null;
  batch_type: string | null;
  batch_created_at: string | null;
  item_id: string | null;
  item_name: string | null;
  material_id: string | null;
  pod_id: string | null;
  pol_id: string | null;
  label_is_printed: boolean | null;
  drum_is_received: boolean | null;
  pol_quantity: number | null;
  pol_unit_weight: number | null;
  po_id: string | null;
  po_number: string | null;
  po_order_date: string | null;
  po_eta_date: string | null;
  po_status: string | null;
  supplier_id: string | null;
  supplier_name: string | null;
  last_updated_source?: "realtime" | "fetch";
}

const pageSize = 100;

/**
 * Component for displaying a grid of raw material drums.
 * Includes filtering options and realtime updates.
 * Fetches data from the public.v_drum_inventory_details view.
 */
const DrumInventoryGrid: React.FC = () => {
  const [drums, setDrums] = useState<DrumDetailView[]>([]);
  const [highlightedDrumId, setHighlightedDrumId] = useState<string | null>(
    null
  );
  const [filters, setFilters] = useState({
    serial_number: "",
    drum_status: "",
    current_location: "",
    item_name: "",
    supplier_name: "",
    po_number: "",
  });
  const [page, setPage] = useState(1);
  const [selectedDrum, setSelectedDrum] = useState<DrumDetailView | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedLocationName, setSelectedLocationName] = useState<
    string | null
  >(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const supabase = createClient();
  const { toast } = useToast();

  const fetchDrums = useCallback(
    async (currentPage = page, currentFilters = filters) => {
      let query = supabase
        .from("v_drum_inventory_details" as any) // Cast to any as types might not include the view
        .select("*")
        .order("drum_created_at", { ascending: false });

      if (currentFilters.serial_number) {
        query = query.ilike(
          "serial_number",
          `%${currentFilters.serial_number}%`
        );
      }
      if (currentFilters.drum_status) {
        query = query.ilike(
          "drum_status",
          `%${currentFilters.drum_status.replace(/ /g, "_")}%`
        );
      }
      if (currentFilters.current_location) {
        query = query.ilike(
          "current_location",
          `%${currentFilters.current_location}%`
        );
      }
      if (currentFilters.item_name) {
        query = query.ilike("item_name", `%${currentFilters.item_name}%`);
      }
      if (currentFilters.supplier_name) {
        query = query.ilike(
          "supplier_name",
          `%${currentFilters.supplier_name}%`
        );
      }
      if (currentFilters.po_number) {
        query = query.ilike("po_number", `%${currentFilters.po_number}%`);
      }

      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await query.range(from, to);

      if (error) {
        console.error("Error fetching drum details view:", error);
        setDrums([]);
      } else {
        setDrums(
          (data as unknown as DrumDetailView[]).map((d) => ({
            ...d,
            last_updated_source: "fetch",
          }))
        );
      }
    },
    [page, filters, supabase]
  );

  useEffect(() => {
    fetchDrums(page, filters);
  }, [fetchDrums, page, filters]);

  useEffect(() => {
    // This is the shape of the record within the payload (new/old properties)
    type DrumBaseRecord = { drum_id: string; [key: string]: any };

    const channel = supabase
      .channel("inventory_drums_realtime_changes")
      .on<DrumBaseRecord>( // Use DrumBaseRecord for the payload's record type
        "postgres_changes",
        { event: "*", schema: "inventory", table: "drums" },
        (payload: RealtimePostgresChangesPayload<DrumBaseRecord>) => {
          // Explicitly type payload
          console.log("Realtime inventory.drums Change:", payload);
          fetchDrums();

          let changedDrumId: string | undefined = undefined;
          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE"
          ) {
            changedDrumId = payload.new?.drum_id;
          } else if (payload.eventType === "DELETE") {
            changedDrumId = payload.old?.drum_id;
          }

          if (changedDrumId) {
            setHighlightedDrumId(changedDrumId);
            setTimeout(() => setHighlightedDrumId(null), 1500);
          }
        }
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          console.log("Subscribed to inventory_drums_realtime_changes!");
        }
        // Add other status checks if needed
        if (err) {
          console.error("Realtime subscription error:", err);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchDrums]);

  const getStatusClass = (status: string | null) => {
    if (!status) return "bg-gray-200";
    switch (
      status.toLowerCase() // Add toLowerCase for case-insensitivity
    ) {
      case "pending":
        return "text-gray-300 opacity-50";
      case "in_stock":
        return "text-blue-400";
      case "pre_production":
        return "text-green-400";
      case "in_production":
        return "text-yellow-400";
      case "decommissioning":
        return "text-red-400";
      case "empty":
        return "text-gray-200";
      default:
        return "text-gray-200";
    }
  };

  const handleFilterChange = (
    filterName: keyof typeof filters,
    value: string
  ) => {
    setFilters((f) => ({ ...f, [filterName]: value }));
    setPage(1);
  };

  const handleDrumClick = async (drum: DrumDetailView) => {
    setSelectedDrum(drum);
    setIsDrawerOpen(true);

    // Fetch location name for the selected drum (if location_id present)
    if (drum.current_location) {
      try {
        const { data, error } = await supabase
          .schema("inventory")
          .from("locations")
          .select("name")
          .eq("location_id", drum.current_location)
          .single();

        if (error) {
          console.error("Error fetching location name:", error);
          setSelectedLocationName(null);
        } else {
          setSelectedLocationName(
            (data as { name: string } | null)?.name ?? null
          );
        }
      } catch (err) {
        console.error("Unexpected error fetching location name:", err);
        setSelectedLocationName(null);
      }
    } else {
      setSelectedLocationName(null);
    }
  };

  const handleAssignToProductionRun = async () => {
    if (!selectedDrum) {
      toast.info("No drum selected.");
      return;
    }
    setIsAssigning(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        toast.warning("You must be logged in to assign a drum to production.");
        console.error("User error:", userError);
        setIsAssigning(false);
        return;
      }

      // Use the new assign_drum_to_production_job function that assigns drums to existing scheduled jobs
      const { data, error } = await supabase
        .schema("production")
        .rpc("assign_drum_to_production_job", {
          p_drum_id: selectedDrum.drum_id,
          p_job_id: null, // Let the function find the appropriate job for this drum's batch
          p_created_by: user.id,
        });

      if (error) {
        console.error("Error assigning drum to production:", error);
        toast.error(
          `Assignment Failed: Failed to assign drum: ${error.message}`
        );
      } else if (data && data.length > 0) {
        const result = data[0];
        if (result && result.success) {
          toast.success(
            `Drum ${selectedDrum.serial_number || selectedDrum.drum_id} assigned to production job ${result.job_id?.toString().slice(0, 8)}`
          );
          // Refresh the drum data to show updated status
          fetchDrums();
          // Optionally close the drawer
          setIsDrawerOpen(false);
        } else {
          toast.error(
            `Assignment Failed: ${result?.message || "Failed to assign drum to production"}`
          );
        }
      } else {
        toast.error(
          "Assignment Failed: No response received from assignment function"
        );
      }
    } catch (rpcError) {
      console.error("RPC error:", rpcError);
      toast.error(
        "Assignment Error: An unexpected error occurred while assigning the drum."
      );
    } finally {
      setIsAssigning(false);
    }
  };

  const handleDownloadLabel = async (drumId: string) => {
    if (!drumId) {
      toast.warning("Cannot download label: Drum ID is missing.");
      return;
    }
    try {
      window.open(`/api/barcodes/single-drum-label/${drumId}`, "_blank");
      toast.success("Label download initiated.");
    } catch (error) {
      console.error("Error initiating label download:", error);
      toast.error(
        `Error downloading label: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Raw Material Drums</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
        <Input
          placeholder="Serial Number"
          value={filters.serial_number}
          onChange={(e) => handleFilterChange("serial_number", e.target.value)}
        />
        <Input
          placeholder="Status"
          value={filters.drum_status}
          onChange={(e) => handleFilterChange("drum_status", e.target.value)}
        />
        <Input
          placeholder="Location"
          value={filters.current_location}
          onChange={(e) =>
            handleFilterChange("current_location", e.target.value)
          }
        />
        <Input
          placeholder="Item Name"
          value={filters.item_name}
          onChange={(e) => handleFilterChange("item_name", e.target.value)}
        />
        <Input
          placeholder="Supplier Name"
          value={filters.supplier_name}
          onChange={(e) => handleFilterChange("supplier_name", e.target.value)}
        />
        <Input
          placeholder="PO Number"
          value={filters.po_number}
          onChange={(e) => handleFilterChange("po_number", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-4 mb-6">
        {drums.map((drum) => (
          <div
            key={drum.drum_id}
            className={cn(
              "flex flex-col items-center cursor-pointer p-2 rounded-lg transition-all duration-300 hover:shadow-md dark:hover:bg-slate-700",
              highlightedDrumId === drum.drum_id &&
                drum.last_updated_source === "realtime"
                ? "bg-yellow-200 scale-105 shadow-lg dark:bg-yellow-700"
                : "bg-white dark:bg-slate-800"
            )}
            onClick={() => handleDrumClick(drum)}
          >
            <div
              className={cn(
                "w-12 h-12 rounded-full mb-1",
                getStatusClass(drum.drum_status)
              )}
            />
            <span className="text-xs text-center font-medium text-slate-700 dark:text-slate-300 truncate w-full">
              {drum.item_name || "N/A"}
            </span>
            <span className="text-xs text-center text-slate-500 dark:text-slate-400">
              {drum.serial_number || "S/N N/A"}
            </span>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <Button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </Button>
        <span>Page {page}</span>
        <Button
          onClick={() => setPage((p) => p + 1)}
          disabled={drums.length < pageSize}
        >
          Next
        </Button>
      </div>

      {/* Drum Details Drawer */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="w-full max-w-md ml-auto h-full">
          {selectedDrum && (
            <div className="flex flex-col h-full">
              <DrawerHeader className="text-left border-b">
                <DrawerTitle>
                  Drum #{selectedDrum.serial_number || "N/A"}
                </DrawerTitle>
                <DrawerDescription>
                  Status:{" "}
                  <span
                    className={cn(
                      "font-semibold",
                      getStatusClass(selectedDrum.drum_status)
                    )}
                  >
                    {selectedDrum.drum_status || "N/A"}
                  </span>
                </DrawerDescription>
              </DrawerHeader>
              <ScrollArea className="flex-grow p-4">
                <div className="grid grid-cols-3 gap-4 items-start mb-6">
                  <div className="col-span-1 flex justify-center items-center relative aspect-square">
                    <Image
                      src="/images/drum-white.png"
                      alt="Drum image"
                      fill
                      style={{ objectFit: "contain" }}
                    />
                  </div>
                  <div className="col-span-2 space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Material
                      </Label>
                      <p className="font-medium text-sm">
                        {selectedDrum.item_name || "--"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Supplier
                      </Label>
                      <p className="font-medium text-sm">
                        {selectedDrum.supplier_name || "--"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Purchase Order
                      </Label>
                      <p className="font-medium text-sm">
                        {selectedDrum.po_number || "--"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Location
                      </Label>
                      <p className="font-medium text-sm">
                        {selectedLocationName || "--"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Received
                      </Label>
                      <p className="font-medium text-sm">
                        {selectedDrum.drum_is_received ? "Yes" : "No"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={handleAssignToProductionRun}
                    disabled={!selectedDrum || isAssigning}
                  >
                    {isAssigning ? "Assigning..." : "Assign to Production Run"}{" "}
                    <span>&rarr;</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    disabled
                  >
                    Locate Drum <span>&rarr;</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    disabled
                  >
                    View Activity History <span>&rarr;</span>
                  </Button>
                  <Button
                    className="w-full"
                    onClick={() => handleDownloadLabel(selectedDrum.drum_id)}
                    disabled={!selectedDrum.drum_id}
                  >
                    Download Label
                  </Button>
                </div>
              </ScrollArea>
              <DrawerFooter className="pt-2 border-t mt-auto">
                <DrawerClose asChild>
                  <Button variant="outline">Close</Button>
                </DrawerClose>
              </DrawerFooter>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default DrumInventoryGrid;
