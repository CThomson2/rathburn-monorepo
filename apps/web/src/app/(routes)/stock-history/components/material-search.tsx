"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface MaterialSearchProps {
  onSelect: (materialCode: string | null) => void;
}

// This would come from an API in a real implementation
const MOCK_MATERIALS = [
  { code: "HEX", value: "Hexane", group: "Hydrocarbon" },
  { code: "MET", value: "Methanol", group: "Alcohol" },
  { code: "ETH", value: "Ethanol", group: "Alcohol" },
  { code: "ACT", value: "Acetone", group: "Ketone" },
  { code: "TOL", value: "Toluene", group: "Aromatic" },
  { code: "DCM", value: "Dichloromethane", group: "Halogenated" },
  { code: "HEP", value: "Heptane", group: "Hydrocarbon" },
  { code: "IPA", value: "Isopropyl Alcohol", group: "Alcohol" },
  { code: "ETA", value: "Ethyl Acetate", group: "Ester" },
  { code: "BEN", value: "Benzene", group: "Aromatic" },
];

export default function MaterialSearch({ onSelect }: MaterialSearchProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [materials, setMaterials] = useState(MOCK_MATERIALS);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadMaterials = async () => {
      // In a real implementation, we would fetch materials from the API
      // For now, we'll just simulate a network request
      setIsLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        // setMaterials would be set with the API response
      } catch (error) {
        console.error("Failed to load materials:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMaterials();
  }, []);

  // Clear selection
  const handleClear = () => {
    setValue("");
    onSelect(null);
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="min-w-[200px] justify-between"
          >
            {value
              ? materials.find((material) => material.code === value)?.value
              : "Select material..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput placeholder="Search materials..." className="h-9" />
            {isLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Loading materials...
              </div>
            ) : (
              <>
                <CommandEmpty>No materials found.</CommandEmpty>
                <CommandGroup>
                  {materials.map((material) => (
                    <CommandItem
                      key={material.code}
                      value={material.code}
                      onSelect={(currentValue) => {
                        setValue(currentValue === value ? "" : currentValue);
                        onSelect(currentValue === value ? null : currentValue);
                        setOpen(false);
                      }}
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center">
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              value === material.code
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {material.value}
                        </div>
                        <span className="ml-6 text-xs text-muted-foreground">
                          {material.code} - {material.group}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </Command>
        </PopoverContent>
      </Popover>

      {value && (
        <Button variant="ghost" size="sm" onClick={handleClear} className="h-9">
          Clear
        </Button>
      )}
    </div>
  );
}
