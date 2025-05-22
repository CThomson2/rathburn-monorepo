"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { QRDFormData } from "@/features/production/types/qrd";
import { Plus, Trash2, Clock, Beaker, Droplet, Eye } from "lucide-react";

// Fraction interface
interface Fraction {
  number: number;
  startTime: string;
  endTime: string;
  volume: number;
  temperature: number;
  appearance: string;
  density?: number;
  contaminants?: string;
}

interface QRDFractionsProps {
  data: QRDFormData;
  onChange: (data: Partial<QRDFormData>) => void;
  disabled?: boolean;
}

// Common appearance options
const APPEARANCE_OPTIONS = [
  "Clear",
  "Slightly cloudy",
  "Cloudy",
  "Yellow tint",
  "Amber",
  "Dark amber",
  "Contains particles",
  "Oily residue",
  "Water layer",
  "Other",
];

export function QRDFractions({
  data,
  onChange,
  disabled = false,
}: QRDFractionsProps) {
  const [fractions, setFractions] = useState<Fraction[]>(data.fractions || []);

  // New fraction form state
  const [newFraction, setNewFraction] = useState<Partial<Fraction>>({
    number: fractions.length + 1,
    startTime: new Date().toISOString(),
    endTime: "",
    volume: 0,
    temperature: data.initialTemperature || 20,
    appearance: "Clear",
    density: undefined,
    contaminants: "",
  });

  // Update parent when fractions change
  useEffect(() => {
    onChange({ fractions });
  }, [fractions, onChange]);

  // Update fraction number when fractions change
  useEffect(() => {
    setNewFraction((prev) => ({ ...prev, number: fractions.length + 1 }));
  }, [fractions.length]);

  // Add new fraction
  const handleAddFraction = () => {
    if (
      newFraction.number &&
      newFraction.startTime &&
      newFraction.endTime &&
      newFraction.volume &&
      newFraction.temperature &&
      newFraction.appearance
    ) {
      const fraction: Fraction = {
        number: newFraction.number,
        startTime: newFraction.startTime,
        endTime: newFraction.endTime,
        volume: newFraction.volume,
        temperature: newFraction.temperature,
        appearance: newFraction.appearance,
        density: newFraction.density,
        contaminants: newFraction.contaminants,
      };

      setFractions((prev) =>
        [...prev, fraction].sort((a, b) => a.number - b.number)
      );

      // Reset form
      setNewFraction({
        number: fractions.length + 2,
        startTime: newFraction.endTime, // Next fraction starts when this one ended
        endTime: "",
        volume: 0,
        temperature: newFraction.temperature, // Keep last temperature
        appearance: "Clear",
        density: undefined,
        contaminants: "",
      });
    }
  };

  // Remove fraction
  const handleRemoveFraction = (index: number) => {
    setFractions((prev) => prev.filter((_, i) => i !== index));
  };

  // Set current time for start/end times
  const handleSetCurrentTime = (field: "startTime" | "endTime") => {
    const currentTime = new Date().toISOString();
    setNewFraction((prev) => ({ ...prev, [field]: currentTime }));
  };

  // Calculate total volume
  const getTotalVolume = () => {
    return fractions.reduce((total, fraction) => total + fraction.volume, 0);
  };

  // Calculate average temperature
  const getAverageTemperature = () => {
    if (fractions.length === 0) return 0;
    const totalTemp = fractions.reduce(
      (sum, fraction) => sum + fraction.temperature,
      0
    );
    return Math.round((totalTemp / fractions.length) * 10) / 10;
  };

  // Calculate fraction duration
  const getFractionDuration = (fraction: Fraction) => {
    const start = new Date(fraction.startTime);
    const end = new Date(fraction.endTime);
    const durationMs = end.getTime() - start.getTime();
    const minutes = Math.floor(durationMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  const formatTime = (timestamp: string) => {
    return format(new Date(timestamp), "HH:mm");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Fraction Collection</h3>
        {fractions.length > 0 && (
          <div className="flex gap-2">
            <Badge variant="secondary">
              {fractions.length} fraction{fractions.length !== 1 ? "s" : ""}
            </Badge>
            <Badge variant="outline">Total: {getTotalVolume()}L</Badge>
            {fractions.length > 1 && (
              <Badge variant="outline">
                Avg temp: {getAverageTemperature()}°C
              </Badge>
            )}
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Record each fraction collected during the distillation process. Monitor
        volume, temperature, and appearance for quality control.
      </p>

      {/* Add New Fraction Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add New Fraction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Fraction Number */}
            <div className="space-y-2">
              <Label>Fraction #</Label>
              <Input
                type="number"
                value={newFraction.number || ""}
                onChange={(e) =>
                  setNewFraction((prev) => ({
                    ...prev,
                    number: Number(e.target.value),
                  }))
                }
                min={1}
                disabled={disabled}
              />
            </div>

            {/* Start Time */}
            <div className="space-y-2">
              <Label>Start Time</Label>
              <div className="flex gap-2">
                <Input
                  type="datetime-local"
                  value={
                    newFraction.startTime
                      ? format(
                          new Date(newFraction.startTime),
                          "yyyy-MM-dd'T'HH:mm"
                        )
                      : ""
                  }
                  onChange={(e) =>
                    setNewFraction((prev) => ({
                      ...prev,
                      startTime: new Date(e.target.value).toISOString(),
                    }))
                  }
                  disabled={disabled}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleSetCurrentTime("startTime")}
                  disabled={disabled}
                >
                  <Clock className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* End Time */}
            <div className="space-y-2">
              <Label>End Time</Label>
              <div className="flex gap-2">
                <Input
                  type="datetime-local"
                  value={
                    newFraction.endTime
                      ? format(
                          new Date(newFraction.endTime),
                          "yyyy-MM-dd'T'HH:mm"
                        )
                      : ""
                  }
                  onChange={(e) =>
                    setNewFraction((prev) => ({
                      ...prev,
                      endTime: new Date(e.target.value).toISOString(),
                    }))
                  }
                  disabled={disabled}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleSetCurrentTime("endTime")}
                  disabled={disabled}
                >
                  <Clock className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Volume */}
            <div className="space-y-2">
              <Label>Volume (L)</Label>
              <div className="relative">
                <Droplet className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={newFraction.volume || ""}
                  onChange={(e) =>
                    setNewFraction((prev) => ({
                      ...prev,
                      volume: Number(e.target.value),
                    }))
                  }
                  min={0}
                  step={0.1}
                  disabled={disabled}
                  className="pl-8"
                  placeholder="Liters"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Temperature */}
            <div className="space-y-2">
              <Label>Collection Temperature (°C)</Label>
              <Input
                type="number"
                value={newFraction.temperature || ""}
                onChange={(e) =>
                  setNewFraction((prev) => ({
                    ...prev,
                    temperature: Number(e.target.value),
                  }))
                }
                min={0}
                max={500}
                step={0.1}
                disabled={disabled}
                placeholder="°C"
              />
            </div>

            {/* Appearance */}
            <div className="space-y-2">
              <Label>Appearance</Label>
              <Select
                value={newFraction.appearance || ""}
                onValueChange={(value) =>
                  setNewFraction((prev) => ({ ...prev, appearance: value }))
                }
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select appearance" />
                </SelectTrigger>
                <SelectContent>
                  {APPEARANCE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Density (Optional) */}
            <div className="space-y-2">
              <Label>
                Density (g/mL){" "}
                <span className="text-muted-foreground">(Optional)</span>
              </Label>
              <Input
                type="number"
                value={newFraction.density || ""}
                onChange={(e) =>
                  setNewFraction((prev) => ({
                    ...prev,
                    density: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  }))
                }
                min={0}
                max={10}
                step={0.001}
                disabled={disabled}
                placeholder="g/mL"
              />
            </div>
          </div>

          {/* Contaminants */}
          <div className="space-y-2">
            <Label>
              Contaminants / Notes{" "}
              <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Textarea
              value={newFraction.contaminants || ""}
              onChange={(e) =>
                setNewFraction((prev) => ({
                  ...prev,
                  contaminants: e.target.value,
                }))
              }
              placeholder="Any observed contaminants, particles, or additional notes..."
              disabled={disabled}
              rows={2}
              registration={{} as any}
            />
          </div>

          {/* Action Button */}
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={handleAddFraction}
              disabled={
                disabled ||
                !newFraction.number ||
                !newFraction.startTime ||
                !newFraction.endTime ||
                !newFraction.volume ||
                !newFraction.temperature ||
                !newFraction.appearance
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Fraction
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Fractions Table */}
      {fractions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Collected Fractions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fraction</TableHead>
                  <TableHead>Time Period</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Volume (L)</TableHead>
                  <TableHead>Temp (°C)</TableHead>
                  <TableHead>Appearance</TableHead>
                  <TableHead>Density</TableHead>
                  {!disabled && <TableHead className="w-16">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {fractions.map((fraction, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Beaker className="h-4 w-4 mr-1 text-muted-foreground" />
                        #{fraction.number}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      <div>
                        <div>
                          {formatTime(fraction.startTime)} -{" "}
                          {formatTime(fraction.endTime)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(fraction.startTime), "MMM dd")}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {getFractionDuration(fraction)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Droplet className="h-3 w-3 mr-1 text-muted-foreground" />
                        {fraction.volume}L
                      </div>
                    </TableCell>
                    <TableCell>{fraction.temperature}°C</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Eye className="h-3 w-3 mr-1 text-muted-foreground" />
                        <span
                          className="truncate max-w-24"
                          title={fraction.appearance}
                        >
                          {fraction.appearance}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {fraction.density ? (
                        `${fraction.density} g/mL`
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    {!disabled && (
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFraction(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Summary row */}
            <div className="mt-4 pt-4 border-t flex justify-between text-sm">
              <span className="font-medium">Total Volume Collected:</span>
              <span className="font-medium">{getTotalVolume()}L</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No fractions message */}
      {fractions.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Beaker className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No fractions collected yet</p>
          <p className="text-sm">
            Add your first fraction above to begin tracking collection data.
          </p>
        </div>
      )}
    </div>
  );
}
