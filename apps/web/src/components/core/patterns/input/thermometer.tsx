import React, { useState, useEffect } from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

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

// Helper functions for color interpolation
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

  if (!result || result.length < 4) {
    return { r: 0, g: 0, b: 0 };
  }

  return {
    r: parseInt(result[1] ?? "0", 16),
    g: parseInt(result[2] ?? "0", 16),
    b: parseInt(result[3] ?? "0", 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function interpolateColor(
  color1: string | undefined,
  color2: string | undefined,
  factor: number
): string {
  // Use default colors if undefined
  const safeColor1 = color1 || "#3b82f6";
  const safeColor2 = color2 || "#ef4444";

  const rgb1 = hexToRgb(safeColor1);
  const rgb2 = hexToRgb(safeColor2);

  const r = Math.round(rgb1.r + factor * (rgb2.r - rgb1.r));
  const g = Math.round(rgb1.g + factor * (rgb2.g - rgb1.g));
  const b = Math.round(rgb1.b + factor * (rgb2.b - rgb1.b));

  return rgbToHex(r, g, b);
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
