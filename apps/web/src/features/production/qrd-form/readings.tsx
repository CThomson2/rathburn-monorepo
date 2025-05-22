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
import { format } from "date-fns";
import { QRDFormData } from "@/features/production/types/qrd";
import { Plus, Trash2, Clock, Thermometer, Gauge } from "lucide-react";

// Reading interface
interface Reading {
  timestamp: string;
  temperature: number;
  pressure: number;
  notes: string;
}

interface QRDReadingsProps {
  data: QRDFormData;
  onChange: (data: Partial<QRDFormData>) => void;
  disabled?: boolean;
}

export function QRDReadings({
  data,
  onChange,
  disabled = false,
}: QRDReadingsProps) {
  const [readings, setReadings] = useState<Reading[]>(data.readings || []);

  // New reading form state
  const [newReading, setNewReading] = useState<Partial<Reading>>({
    timestamp: new Date().toISOString(),
    temperature: data.initialTemperature || 20,
    pressure: data.initialPressure || 1013,
    notes: "",
  });

  // Update parent when readings change
  useEffect(() => {
    onChange({ readings });
  }, [readings, onChange]);

  // Add new reading
  const handleAddReading = () => {
    if (newReading.temperature && newReading.pressure) {
      const reading: Reading = {
        timestamp: newReading.timestamp || new Date().toISOString(),
        temperature: newReading.temperature,
        pressure: newReading.pressure,
        notes: newReading.notes || "",
      };

      setReadings((prev) =>
        [...prev, reading].sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
      );

      // Reset form
      setNewReading({
        timestamp: new Date().toISOString(),
        temperature: newReading.temperature, // Keep last temperature as starting point
        pressure: newReading.pressure, // Keep last pressure as starting point
        notes: "",
      });
    }
  };

  // Remove reading
  const handleRemoveReading = (index: number) => {
    setReadings((prev) => prev.filter((_, i) => i !== index));
  };

  // Set current time for new reading
  const handleSetCurrentTime = () => {
    setNewReading((prev) => ({ ...prev, timestamp: new Date().toISOString() }));
  };

  // Quick add reading with current values
  const handleQuickAdd = () => {
    const quickReading: Reading = {
      timestamp: new Date().toISOString(),
      temperature: newReading.temperature || data.initialTemperature || 20,
      pressure: newReading.pressure || data.initialPressure || 1013,
      notes: "Quick reading",
    };

    setReadings((prev) =>
      [...prev, quickReading].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
    );
  };

  const formatTime = (timestamp: string) => {
    return format(new Date(timestamp), "HH:mm:ss");
  };

  const formatFullTime = (timestamp: string) => {
    return format(new Date(timestamp), "PPp");
  };

  // Calculate distillation duration if readings exist
  const getDistillationDuration = () => {
    if (readings.length === 0) return null;

    const setupTime = data.setupTime ? new Date(data.setupTime) : null;
    const latestReading = new Date(readings[0].timestamp);

    if (!setupTime) return null;

    const durationMs = latestReading.getTime() - setupTime.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Process Readings</h3>
        {readings.length > 0 && (
          <Badge variant="secondary">
            {readings.length} reading{readings.length !== 1 ? "s" : ""}
            {getDistillationDuration() && ` • ${getDistillationDuration()}`}
          </Badge>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Record temperature and pressure readings throughout the distillation
        process. Regular readings help monitor the progress and ensure quality
        control.
      </p>

      {/* Add New Reading Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add New Reading</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Time */}
            <div className="space-y-2">
              <Label>Time</Label>
              <div className="flex gap-2">
                <Input
                  type="datetime-local"
                  value={
                    newReading.timestamp
                      ? format(
                          new Date(newReading.timestamp),
                          "yyyy-MM-dd'T'HH:mm"
                        )
                      : ""
                  }
                  onChange={(e) =>
                    setNewReading((prev) => ({
                      ...prev,
                      timestamp: new Date(e.target.value).toISOString(),
                    }))
                  }
                  disabled={disabled}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSetCurrentTime}
                  disabled={disabled}
                >
                  <Clock className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Temperature */}
            <div className="space-y-2">
              <Label>Temperature (°C)</Label>
              <div className="relative">
                <Thermometer className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={newReading.temperature || ""}
                  onChange={(e) =>
                    setNewReading((prev) => ({
                      ...prev,
                      temperature: Number(e.target.value),
                    }))
                  }
                  min={0}
                  max={500}
                  step={0.1}
                  disabled={disabled}
                  className="pl-8"
                  placeholder="°C"
                />
              </div>
            </div>

            {/* Pressure */}
            <div className="space-y-2">
              <Label>Pressure (mbar)</Label>
              <div className="relative">
                <Gauge className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={newReading.pressure || ""}
                  onChange={(e) =>
                    setNewReading((prev) => ({
                      ...prev,
                      pressure: Number(e.target.value),
                    }))
                  }
                  min={0}
                  max={2000}
                  step={1}
                  disabled={disabled}
                  className="pl-8"
                  placeholder="mbar"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={newReading.notes || ""}
              onChange={(e) =>
                setNewReading((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Any observations, changes, or notes about this reading..."
              disabled={disabled}
              rows={2}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleQuickAdd}
              disabled={
                disabled || !newReading.temperature || !newReading.pressure
              }
            >
              Quick Add
            </Button>
            <Button
              type="button"
              onClick={handleAddReading}
              disabled={
                disabled || !newReading.temperature || !newReading.pressure
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Reading
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Readings Table */}
      {readings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recorded Readings</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Temp (°C)</TableHead>
                  <TableHead>Pressure (mbar)</TableHead>
                  <TableHead>Notes</TableHead>
                  {!disabled && <TableHead className="w-16">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {readings.map((reading, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-sm">
                      <div>
                        <div className="font-medium">
                          {formatTime(reading.timestamp)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(reading.timestamp), "MMM dd")}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Thermometer className="h-3 w-3 mr-1 text-muted-foreground" />
                        {reading.temperature}°C
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Gauge className="h-3 w-3 mr-1 text-muted-foreground" />
                        {reading.pressure}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={reading.notes}>
                        {reading.notes || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                    {!disabled && (
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveReading(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* No readings message */}
      {readings.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Thermometer className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No readings recorded yet</p>
          <p className="text-sm">
            Add your first reading above to begin tracking the distillation
            process.
          </p>
        </div>
      )}
    </div>
  );
}
