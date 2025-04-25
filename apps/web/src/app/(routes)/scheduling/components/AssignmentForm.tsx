"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createDrumAssignment } from "@/features/drum-assignment/data-utils";
import { DrumAssignmentFormData } from "@/features/drum-assignment/types";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AssignmentFormProps {
  drums: any[];
  distillations: any[];
  onSuccess?: () => void;
}

export function AssignmentForm({
  drums,
  distillations,
  onSuccess,
}: AssignmentFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm<DrumAssignmentFormData>({
    defaultValues: {
      drum_id: 0,
      distillation_id: 0,
      assigned_by: "",
      notes: "",
    },
  });

  // Watch the selected material to filter distillations
  const selectedDrumId = watch("drum_id");
  const selectedDrum = drums.find(
    (drum) => drum.drum_id === Number(selectedDrumId)
  );
  const selectedMaterial = selectedDrum?.material || "";

  // Filter distillations to match the selected material
  const filteredDistillations = selectedMaterial
    ? distillations.filter((d) => d.material === selectedMaterial)
    : distillations;

  const onSubmit = async (data: DrumAssignmentFormData) => {
    setIsSubmitting(true);

    try {
      const result = await createDrumAssignment(data);

      if (result.success) {
        toast({
          title: "Success",
          description: "Drum assignment created successfully",
          variant: "default",
        });

        reset();

        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Assign Drum</CardTitle>
        <CardDescription>
          Assign a drum to an upcoming distillation process
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="drum_id">Select Drum</Label>
            <Select
              onValueChange={(value) => {
                const form = document.getElementById(
                  "assignment-form"
                ) as HTMLFormElement;
                const drumIdInput = form.elements.namedItem(
                  "drum_id"
                ) as HTMLInputElement;
                if (drumIdInput) {
                  drumIdInput.value = value;
                  drumIdInput.dispatchEvent(
                    new Event("change", { bubbles: true })
                  );
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a drum" />
              </SelectTrigger>
              <SelectContent>
                {drums.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No drums available
                  </SelectItem>
                ) : (
                  drums.map((drum) => (
                    <SelectItem
                      key={drum.drum_id}
                      value={drum.drum_id.toString()}
                    >
                      {`Drum #${drum.drum_id} - ${drum.material} (${drum.supplier || "Unknown"})`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <input
              type="hidden"
              id="drum_id"
              {...register("drum_id", { required: "Drum is required" })}
            />
            {errors.drum_id && (
              <p className="text-sm text-red-500">{errors.drum_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="distillation_id">Select Distillation</Label>
            <Select
              onValueChange={(value) => {
                const form = document.getElementById(
                  "assignment-form"
                ) as HTMLFormElement;
                const distillationIdInput = form.elements.namedItem(
                  "distillation_id"
                ) as HTMLInputElement;
                if (distillationIdInput) {
                  distillationIdInput.value = value;
                  distillationIdInput.dispatchEvent(
                    new Event("change", { bubbles: true })
                  );
                }
              }}
              disabled={!selectedDrumId || filteredDistillations.length === 0}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    selectedDrumId
                      ? filteredDistillations.length === 0
                        ? "No matching distillations"
                        : "Select a distillation"
                      : "Select a drum first"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {filteredDistillations.length === 0 ? (
                  <SelectItem value="none" disabled>
                    {selectedDrumId
                      ? "No matching distillations"
                      : "Select a drum first"}
                  </SelectItem>
                ) : (
                  filteredDistillations.map((distillation) => (
                    <SelectItem
                      key={distillation.id}
                      value={distillation.id.toString()}
                    >
                      {`Distillation #${distillation.id} - ${distillation.material} (${new Date(distillation.distillation_date).toLocaleDateString()})`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <input
              type="hidden"
              id="distillation_id"
              {...register("distillation_id", {
                required: "Distillation is required",
              })}
            />
            {errors.distillation_id && (
              <p className="text-sm text-red-500">
                {errors.distillation_id.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigned_by">Assigned By</Label>
            <Input
              id="assigned_by"
              placeholder="Your name"
              {...register("assigned_by")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes about this assignment"
              {...register("notes")}
              rows={3}
            />
          </div>
        </CardContent>

        <CardFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Assigning..." : "Assign Drum"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
