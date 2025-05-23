"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Thermometer } from "@/components/core/patterns/input/thermometer";
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

/**
 * Component for configuring the initial setup parameters of a distillation process.
 *
 * This component allows the user to specify and edit the initial setup details such as
 * setup time, operator, initial temperature, pressure, and heat setting before starting
 * the distillation process. It updates the parent component with the setup data and provides
 * quick actions for setting the current time and standard conditions.
 *
 * @param {QRDSetupProps} props - The props for the component.
 * @param {QRDFormData} props.data - The setup data including time, operator, temperature, pressure, and heat setting.
 * @param {(data: Partial<QRDFormData>) => void} props.onChange - Function to call when the setup data changes.
 * @param {boolean} [props.disabled=false] - Whether the input fields are disabled.
 * @returns {JSX.Element} The QRDSetup component.
 */
export function QRDSetup({ data, onChange, disabled = false }: QRDSetupProps) {
  const [localSetupTime, setLocalSetupTime] = useState<Date | undefined>(
    data.setupTime ? new Date(data.setupTime) : undefined
  );
  const [localSetupBy, setLocalSetupBy] = useState<string>(data.setupBy || "");
  const [localInitialTemperature, setLocalInitialTemperature] = useState<
    number | undefined
  >(data.initialTemperature ?? undefined);
  const [localInitialPressure, setLocalInitialPressure] = useState<
    number | undefined
  >(data.initialPressure ?? undefined);
  const [localHeatSetting, setLocalHeatSetting] = useState<number | undefined>(
    data.heatSetting ?? undefined
  );

  useEffect(() => {
    console.log("Slider state: Temperature", localInitialTemperature);
  }, [localInitialTemperature]);

  useEffect(() => {
    console.log("Slider state: Pressure", localInitialPressure);
  }, [localInitialPressure]);

  useEffect(() => {
    console.log("Slider state: Heat Setting", localHeatSetting);
  }, [localHeatSetting]);

  // Sync local state with incoming specific props when they change
  useEffect(() => {
    if (data.setupTime) {
      const propDate = new Date(data.setupTime);
      if (
        !localSetupTime ||
        propDate.toISOString() !== localSetupTime.toISOString()
      ) {
        setLocalSetupTime(propDate);
      }
    } else if (data.setupTime === null && localSetupTime) {
      setLocalSetupTime(undefined);
    }
  }, [data.setupTime]);

  useEffect(() => {
    const propSetupBy = data.setupBy || "";
    if (propSetupBy !== localSetupBy) {
      setLocalSetupBy(propSetupBy);
    }
  }, [data.setupBy]);

  useEffect(() => {
    const propTemp = data.initialTemperature ?? undefined;
    if (propTemp !== localInitialTemperature) {
      setLocalInitialTemperature(propTemp);
    } else if (
      data.initialTemperature === null &&
      localInitialTemperature !== undefined
    ) {
      setLocalInitialTemperature(undefined);
    }
  }, [data.initialTemperature]);

  useEffect(() => {
    const propPressure = data.initialPressure ?? undefined;
    if (propPressure !== localInitialPressure) {
      setLocalInitialPressure(propPressure);
    } else if (
      data.initialPressure === null &&
      localInitialPressure !== undefined
    ) {
      setLocalInitialPressure(undefined);
    }
  }, [data.initialPressure]);

  useEffect(() => {
    const propHeat = data.heatSetting ?? undefined;
    if (propHeat !== localHeatSetting) {
      setLocalHeatSetting(propHeat);
    } else if (data.heatSetting === null && localHeatSetting !== undefined) {
      setLocalHeatSetting(undefined);
    }
  }, [data.heatSetting]);

  // Handlers for input changes
  const handleSetupTimeChange = (date: Date | undefined) => {
    setLocalSetupTime(date);
    onChange({ setupTime: date ? date.toISOString() : undefined });
  };

  const handleSetupByChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalSetupBy(newValue);
    onChange({ setupBy: newValue });
  };

  const handleTemperatureChange = (values: number[]) => {
    if (values.length > 0 && values[0] !== undefined) {
      const newValue = values[0];
      setLocalInitialTemperature(newValue);
      onChange({ initialTemperature: newValue });
    }
  };

  const handlePressureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valueStr = e.target.value;
    const newValue = valueStr === "" ? undefined : Number(valueStr);
    setLocalInitialPressure(newValue);
    onChange({ initialPressure: newValue });
  };

  const handleHeatSettingChange = (values: number[]) => {
    if (values.length > 0 && values[0] !== undefined) {
      const newValue = values[0];
      setLocalHeatSetting(newValue);
      onChange({ heatSetting: newValue });
    }
  };

  // Quick actions
  const handleSetCurrentTime = () => {
    const now = new Date();
    setLocalSetupTime(now);
    onChange({ setupTime: now.toISOString() });
  };

  const handleSetStandardConditions = () => {
    setLocalInitialTemperature(20);
    setLocalInitialPressure(1013);
    handleTemperatureChange([20]);
    handleHeatSettingChange([50]);
    onChange({
      initialTemperature: 20,
      initialPressure: 1013,
      heatSetting: 50,
    });
  };

  const isSetupComplete =
    localSetupTime &&
    localSetupBy && // Assuming empty string is not complete for setupBy
    localInitialTemperature !== undefined &&
    localInitialPressure !== undefined &&
    localHeatSetting !== undefined;

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

      <p className="text-sm text-muted-foreground">
        Record the initial setup parameters before beginning the distillation
        process. All fields are required before starting the distillation.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    !localSetupTime && "text-muted-foreground"
                  )}
                  disabled={disabled}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {localSetupTime ? (
                    format(localSetupTime, "PPp") // Displays in local time
                  ) : (
                    <span>Select date and time</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={localSetupTime}
                  onSelect={handleSetupTimeChange} // Use new handler
                  initialFocus
                />
                {/* TODO: Add Time Picker here if needed, and restrict to 6 AM - 6 PM */}
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

        <div className="space-y-2">
          <Label htmlFor="setupBy">Setup By (Operator)</Label>
          <div className="relative">
            <BookUser className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="setupBy"
              placeholder="Operator name"
              value={localSetupBy}
              onChange={handleSetupByChange} // Use new handler
              className="pl-8"
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label htmlFor="initialTemperature">
            Initial Temperature (°C):{" "}
            {localInitialTemperature !== undefined
              ? localInitialTemperature
              : "-"}
            °C
          </Label>
          <Thermometer
            id="initialTemperature"
            min={0}
            max={150}
            step={1}
            value={
              localInitialTemperature !== undefined
                ? [localInitialTemperature]
                : undefined
            } // Pass empty array if undefined to let slider use its default
            onValueChange={handleTemperatureChange} // Use new handler
            disabled={disabled}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0°C</span>
            <span>75˚C</span>
            <span>150°C</span>
          </div>
        </div>

        {/* Initial Pressure */}
        <div className="space-y-3">
          <Label htmlFor="initialPressure">
            Initial Pressure (mbar):{" "}
            {localInitialPressure !== undefined ? localInitialPressure : "-"}
          </Label>
          <Input
            id="initialPressure"
            type="number"
            value={localInitialPressure ?? ""} // Input expects string or number for value
            onChange={handlePressureChange} // Use new handler
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
        <Label htmlFor="heatSetting">
          Heat Setting (%):{" "}
          {localHeatSetting !== undefined ? localHeatSetting : "-"}%
        </Label>
        <Slider
          id="heatSetting"
          min={0}
          max={100}
          step={1}
          value={localHeatSetting !== undefined ? [localHeatSetting] : []} // Pass empty array if undefined
          onValueChange={handleHeatSettingChange} // Use new handler
          disabled={disabled}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
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
