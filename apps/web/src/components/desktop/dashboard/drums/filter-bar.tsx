import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DrumFilterBarProps {
  open: boolean;
  onClose: () => void;
}

export function DrumFilterBar({ open, onClose }: DrumFilterBarProps) {
  interface Filters {
    materialTypes: string[];
    status: string[];
    supplier: string;
    createdDateFrom: string;
    createdDateTo: string;
    fillLevelMin: string;
    fillLevelMax: string;
  }

  const [filters, setFilters] = useState<Filters>({
    materialTypes: [],
    status: [],
    supplier: "",
    createdDateFrom: "",
    createdDateTo: "",
    fillLevelMin: "",
    fillLevelMax: "",
  });

  const handleChange = (field: keyof Filters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCheckboxChange = (
    field: "materialTypes" | "status",
    value: string
  ) => {
    setFilters((prev) => {
      const values = [...prev[field]];

      if (values.includes(value)) {
        return {
          ...prev,
          [field]: values.filter((v) => v !== value),
        };
      } else {
        return {
          ...prev,
          [field]: [...values, value],
        };
      }
    });
  };

  const handleClearFilters = () => {
    setFilters({
      materialTypes: [],
      status: [],
      supplier: "",
      createdDateFrom: "",
      createdDateTo: "",
      fillLevelMin: "",
      fillLevelMax: "",
    });
  };

  const handleApplyFilters = () => {
    // Apply filters logic here
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filter Drums</SheetTitle>
          <SheetDescription>
            Refine your search with multiple criteria.
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Material Types */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Material Types</h3>
            <div className="grid grid-cols-2 gap-2">
              {["Benzene", "Toluene", "Xylene", "Ethanol", "Methanol"].map(
                (material) => (
                  <div key={material} className="flex items-center space-x-2">
                    <Checkbox
                      id={`material-${material}`}
                      checked={filters.materialTypes.includes(material)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleCheckboxChange("materialTypes", material);
                        } else {
                          handleCheckboxChange("materialTypes", material);
                        }
                      }}
                    />
                    <Label htmlFor={`material-${material}`} className="text-sm">
                      {material}
                    </Label>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Status</h3>
            <div className="grid grid-cols-2 gap-2">
              {["in_stock", "in_use", "empty", "scheduled", "in_transit"].map(
                (status) => (
                  <div key={status} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${status}`}
                      checked={filters.status.includes(status)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleCheckboxChange("status", status);
                        } else {
                          handleCheckboxChange("status", status);
                        }
                      }}
                    />
                    <Label
                      htmlFor={`status-${status}`}
                      className="text-sm capitalize"
                    >
                      {status.replace("_", " ")}
                    </Label>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Supplier */}
          <div className="space-y-3">
            <Label htmlFor="supplier" className="text-sm font-medium">
              Supplier
            </Label>
            <Select
              value={filters.supplier}
              onValueChange={(value) => handleChange("supplier", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All suppliers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All suppliers</SelectItem>
                <SelectItem value="Chemco">Chemco</SelectItem>
                <SelectItem value="ReactiveSupplies">
                  ReactiveSupplies
                </SelectItem>
                <SelectItem value="OrganicChem">OrganicChem</SelectItem>
                <SelectItem value="PetroChem">PetroChem</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Created Date Range</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date-from" className="text-sm">
                  From
                </Label>
                <Input
                  id="date-from"
                  type="date"
                  value={filters.createdDateFrom}
                  onChange={(e) =>
                    handleChange("createdDateFrom", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-to" className="text-sm">
                  To
                </Label>
                <Input
                  id="date-to"
                  type="date"
                  value={filters.createdDateTo}
                  onChange={(e) =>
                    handleChange("createdDateTo", e.target.value)
                  }
                />
              </div>
            </div>
          </div>

          {/* Fill Level Range */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Fill Level Range (Liters)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fill-min" className="text-sm">
                  Min
                </Label>
                <Input
                  id="fill-min"
                  type="number"
                  placeholder="0"
                  value={filters.fillLevelMin}
                  onChange={(e) => handleChange("fillLevelMin", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fill-max" className="text-sm">
                  Max
                </Label>
                <Input
                  id="fill-max"
                  type="number"
                  placeholder="200"
                  value={filters.fillLevelMax}
                  onChange={(e) => handleChange("fillLevelMax", e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="flex justify-between sm:justify-between mt-8">
          <Button variant="outline" onClick={handleClearFilters}>
            Clear Filters
          </Button>
          <Button onClick={handleApplyFilters}>Apply Filters</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
