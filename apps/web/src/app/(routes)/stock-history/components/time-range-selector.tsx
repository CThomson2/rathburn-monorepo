"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";

interface TimeRangeSelectorProps {
  currentRange: string;
  onRangeChange: (range: string) => void;
}

const TIME_RANGES = [
  { value: "1D", label: "1D" },
  { value: "1W", label: "1W" },
  { value: "1M", label: "1M" },
  { value: "3M", label: "3M" },
  { value: "1Y", label: "1Y" },
  { value: "3Y", label: "3Y" },
  { value: "ALL", label: "ALL" },
];

export default function TimeRangeSelector({
  currentRange,
  onRangeChange,
}: TimeRangeSelectorProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isCustomRange, setIsCustomRange] = useState(false);

  // Handle custom date range selection
  const handleCustomRange = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      // In a real implementation, you would convert this date range to a format
      // your data fetching function understands and pass it along
      setIsCustomRange(true);
      onRangeChange("custom");
    }
  };

  // Reset to predefined ranges
  const handlePredefinedRange = (value: string) => {
    setIsCustomRange(false);
    setDateRange(undefined);
    onRangeChange(value);
  };

  return (
    <div className="flex items-center gap-2">
      <ToggleGroup
        type="single"
        value={isCustomRange ? "custom" : currentRange}
        onValueChange={(value) => {
          if (value) handlePredefinedRange(value);
        }}
        className="bg-muted rounded-md p-1"
      >
        {TIME_RANGES.map((range) => (
          <ToggleGroupItem
            key={range.value}
            value={range.value}
            size="sm"
            className="px-3 text-xs font-medium"
          >
            {range.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <CalendarIcon className="h-3.5 w-3.5" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "MMM d, yyyy")} -{" "}
                  {format(dateRange.to, "MMM d, yyyy")}
                </>
              ) : (
                format(dateRange.from, "MMM d, yyyy")
              )
            ) : (
              "Custom Range"
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={handleCustomRange}
            numberOfMonths={2}
            disabled={{ after: new Date() }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
