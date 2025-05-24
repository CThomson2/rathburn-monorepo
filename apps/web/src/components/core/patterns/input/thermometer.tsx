import React, { useState, useEffect } from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";
import { hexToRgb, rgbToHex, interpolateColor } from "@/utils/colors";

type ThermometerValue = [number, ...number[]];

interface ThermometerProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  startColor?: string;
  endColor?: string;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: ThermometerValue;
  value?: ThermometerValue;
}

export const Thermometer = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  ThermometerProps
>(
  (
    {
      className,
      startColor = "#3b82f6", // blue
      endColor = "#ef4444", // red
      min = 0,
      max = 100,
      step = 1,
      value,
      defaultValue = [20],
      onValueChange,
      ...props
    },
    ref
  ) => {
    const [currentValue, setCurrentValue] = useState<ThermometerValue>(
      value || defaultValue
    );
    const [rangeColor, setRangeColor] = useState<string>(
      startColor || "#3b82f6"
    );

    // Calculate the color at current position
    useEffect(() => {
      if (currentValue && currentValue.length > 0) {
        const normalizedValue = (currentValue[0]! - min) / (max - min);
        const color = interpolateColor(startColor, endColor, normalizedValue);
        setRangeColor(color);
      }
    }, [currentValue, min, max, startColor, endColor]);

    // Handle value changes
    const handleValueChange = (newValue: ThermometerValue) => {
      setCurrentValue(newValue);
      if (onValueChange) {
        onValueChange(newValue);
      }
    };

    // Ensure we have valid colors for the gradient
    const gradientStart = startColor || "#3b82f6";
    const gradientEnd = endColor || "#ef4444";

    return (
      <SliderPrimitive.Root
        ref={ref}
        className={cn(
          "relative flex w-full touch-none select-none items-center",
          className
        )}
        min={min}
        max={max}
        step={step}
        value={value}
        defaultValue={defaultValue}
        onValueChange={handleValueChange}
        {...props}
      >
        <SliderPrimitive.Track
          className="relative h-2 w-full grow overflow-hidden rounded-full"
          style={{
            background: `linear-gradient(to right, ${gradientStart} 0%, ${gradientEnd} 100%)`,
          }}
        >
          <SliderPrimitive.Range
            className="absolute h-full"
            style={{ backgroundColor: rangeColor }}
          />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
      </SliderPrimitive.Root>
    );
  }
);

Thermometer.displayName = "Thermometer";
