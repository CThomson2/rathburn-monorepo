"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/core/ui/button";
import { Input } from "@/components/core/ui/input";
import { Label } from "@/components/core/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/core/ui/radio-group";
import { Separator } from "@/components/core/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/core/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/core/ui/accordion";

interface FilterControlsProps {
  filters: {
    drumType: string;
    supplier: string;
  };
  onFilterChange: (filters: { drumType: string; supplier: string }) => void;
}

// Mock suppliers for the demo
const MOCK_SUPPLIERS = [
  { id: "all", name: "All Suppliers" },
  { id: "1", name: "Brenntag UK" },
  { id: "2", name: "Sigma-Aldrich" },
  { id: "3", name: "VWR International" },
  { id: "4", name: "Fisher Scientific" },
  { id: "5", name: "Merck KGaA" },
];

export default function FilterControls({
  filters,
  onFilterChange,
}: FilterControlsProps) {
  const [localFilters, setLocalFilters] = useState(filters);
  const [suppliers, setSuppliers] = useState(MOCK_SUPPLIERS);
  const [isLoading, setIsLoading] = useState(false);

  // Effect to fetch suppliers (mock)
  useEffect(() => {
    const fetchSuppliers = async () => {
      setIsLoading(true);
      try {
        // In a real implementation, fetch from API
        await new Promise((resolve) => setTimeout(resolve, 300));
        // setSuppliers(response.data);
      } catch (error) {
        console.error("Failed to fetch suppliers:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuppliers();
  }, []);

  // Update filters and propagate changes
  const updateFilter = (key: string, value: string) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="space-y-4">
      <Accordion
        type="multiple"
        defaultValue={["drum-type", "supplier"]}
        className="w-full"
      >
        <AccordionItem value="drum-type">
          <AccordionTrigger className="text-sm font-medium">
            Drum Type
          </AccordionTrigger>
          <AccordionContent>
            <RadioGroup
              value={localFilters.drumType}
              onValueChange={(value) => updateFilter("drumType", value)}
              className="flex flex-col gap-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all-types" />
                <Label htmlFor="all-types">All Types</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="new" id="new" />
                <Label htmlFor="new">New (Raw Material)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="repro" id="repro" />
                <Label htmlFor="repro">Reprocessed</Label>
              </div>
            </RadioGroup>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="supplier">
          <AccordionTrigger className="text-sm font-medium">
            Supplier
          </AccordionTrigger>
          <AccordionContent>
            {isLoading ? (
              <div className="text-sm text-muted-foreground">
                Loading suppliers...
              </div>
            ) : (
              <Select
                value={localFilters.supplier}
                onValueChange={(value) => updateFilter("supplier", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="advanced">
          <AccordionTrigger className="text-sm font-medium">
            Advanced Filters
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="min-quantity">Minimum Quantity</Label>
                <Input
                  id="min-quantity"
                  type="number"
                  placeholder="0"
                  min={0}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-quantity">Maximum Quantity</Label>
                <Input
                  id="max-quantity"
                  type="number"
                  placeholder="Maximum"
                  min={0}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Chemical Group</Label>
                <Select defaultValue="all">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Groups</SelectItem>
                    <SelectItem value="hydrocarbon">Hydrocarbon</SelectItem>
                    <SelectItem value="alcohol">Alcohol</SelectItem>
                    <SelectItem value="ketone">Ketone</SelectItem>
                    <SelectItem value="aromatic">Aromatic</SelectItem>
                    <SelectItem value="halogenated">Halogenated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="default"
                size="sm"
                disabled
                className="w-full mt-2"
              >
                Apply Advanced Filters
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Separator />

      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => {
          const resetFilters = { drumType: "all", supplier: "all" };
          setLocalFilters(resetFilters);
          onFilterChange(resetFilters);
        }}
      >
        Reset All Filters
      </Button>
    </div>
  );
}
