"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { QRDFormData } from "@/features/production/types/qrd";
import { cn } from "@/lib/utils";
import { CalendarIcon, BookUser, CheckCircle } from "lucide-react";

interface QRDSetupProps {
  data: QRDFormData;
  onChange: (data: Partial<QRDFormData>) => void;
  disabled?: boolean;
}

export function QRDSetup({ data, onChange, disabled = false }: QRDSetupProps) {
  // Local state for setup fields
  const [setupTime, setSetupTime] = useState<Date | undefined>(
    data.setupTime ? new Date(data.setupTime) : undefined
  );
  const [setupBy, setSetupBy] = useState<string>(data.setupBy || "");
  const [initialTemperature, setInitialTemperature] = useState<number>(
    data.initialTemperature || 20
  );
  const [initialPressure, setInitialPressure] = useState<number>(
    data.initialPressure || 1013
  );
  const [heatSetting, setHeatSetting] = useState<number>(
    data.heatSetting || 50
  );

  // Update parent component with setup fields
  useEffect(() => {
    // Only trigger onChange if one of the actual values changed
    const updatedData = {
      setupTime: setupTime?.toISOString(),
      setupBy,
      initialTemperature,
      initialPressure,
      heatSetting,
    };

    // Check if data actually changed before calling onChange
    const hasChanges =
      data.setupTime !== updatedData.setupTime ||
      data.setupBy !== updatedData.setupBy ||
      data.initialTemperature !== updatedData.initialTemperature ||
      data.initialPressure !== updatedData.initialPressure ||
      data.heatSetting !== updatedData.heatSetting;

    if (hasChanges) {
      onChange(updatedData);
    }
  }, [
    setupTime,
    setupBy,
    initialTemperature,
    initialPressure,
    heatSetting,
    onChange,
    data,
  ]);

  // Quick actions for common values
  const handleSetCurrentTime = () => {
    setSetupTime(new Date());
  };

  const handleSetStandardConditions = () => {
    setInitialTemperature(20);
    setInitialPressure(1013);
    setHeatSetting(50);
  };

  // Check if setup is complete
  const isSetupComplete =
    setupTime &&
    setupBy &&
    initialTemperature &&
    initialPressure &&
    heatSetting;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Initial Setup</h3>
        {isSetupComplete && (
          <div className="flex items-center text-green-600 text-sm">
            <CheckCircle className="h-4 w-4 mr-1" />
            Setup Complete
          </div>
        )}
      </div>

      {/* Setup section instruction text */}
      <p className="text-sm text-muted-foreground">
        Record the initial setup parameters before beginning the distillation
        process. All fields are required before starting the distillation.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Setup Time */}
        <div className="space-y-2">
          <Label htmlFor="setupTime">Setup Time</Label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="setupTime"
                  variant={"outline"}
                  className={cn(
                    "flex-1 justify-start text-left font-normal",
                    !setupTime && "text-muted-foreground"
                  )}
                  disabled={disabled}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {setupTime ? (
                    format(setupTime, "PPp")
                  ) : (
                    <span>Select date and time</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={setupTime}
                  onSelect={setSetupTime}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSetCurrentTime}
              disabled={disabled}
            >
              Now
            </Button>
          </div>
        </div>

        {/* Setup By (Operator) */}
        <div className="space-y-2">
          <Label htmlFor="setupBy">Setup By (Operator)</Label>
          <div className="relative">
            <BookUser className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="setupBy"
              placeholder="Operator name"
              value={setupBy}
              onChange={(e) => setSetupBy(e.target.value)}
              className="pl-8"
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Initial Temperature */}
        <div className="space-y-3">
          <Label htmlFor="initialTemperature">
            Initial Temperature (°C): {initialTemperature}°C
          </Label>
          <Slider
            id="initialTemperature"
            min={0}
            max={100}
            step={1}
            value={[initialTemperature]}
            onValueChange={(values) => {
              if (values.length > 0 && values[0] !== undefined) {
                setInitialTemperature(values[0]);
              }
            }}
            disabled={disabled}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0°C</span>
            <span>100°C</span>
          </div>
        </div>

        {/* Initial Pressure */}
        <div className="space-y-3">
          <Label htmlFor="initialPressure">
            Initial Pressure (mbar): {initialPressure}
          </Label>
          <Input
            id="initialPressure"
            type="number"
            value={initialPressure}
            onChange={(e) => setInitialPressure(Number(e.target.value))}
            min={0}
            max={2000}
            step={1}
            disabled={disabled}
            className="w-full"
          />
          <div className="text-xs text-muted-foreground">
            Standard atmospheric pressure: 1013 mbar
          </div>
        </div>
      </div>

      {/* Heat Setting */}
      <div className="space-y-3">
        <Label htmlFor="heatSetting">Heat Setting (%): {heatSetting}%</Label>
        <Slider
          id="heatSetting"
          min={0}
          max={100}
          step={5}
          value={[heatSetting]}
          onValueChange={(values) => {
            if (values.length > 0 && values[0] !== undefined) {
              setHeatSetting(values[0]);
            }
          }}
          disabled={disabled}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSetStandardConditions}
          disabled={disabled}
        >
          Set Standard Conditions
        </Button>
      </div>

      {/* Setup completion notice */}
      {!isSetupComplete && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-sm text-amber-800">
            Complete all setup fields to proceed with distillation readings.
          </p>
        </div>
      )}
    </div>
  );
}
