"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, Printer, FileDown, AlertTriangle } from "lucide-react";
import { QRDFormData } from "@/features/production/types/qrd";
import { updateQRDData } from "@/app/actions/qrd";

// Import QRD section components
import { QRDHeader } from "./header";
import { QRDSetup } from "./setup";
import { QRDReadings } from "./readings";
import { QRDFractions } from "./fractions";
import { QRDSummary } from "./summary";

interface QRDFormProps {
  initialData: QRDFormData;
}

/**
 * A component to render a QRD form for a given operation.
 *
 * It accepts an `initialData` prop which should contain the initial QRD data
 * for the operation, including the operation ID, job ID, scheduled start time,
 * and any existing distillation records.
 *
 * The form includes sections for setup, process readings, fractions, and summary
 * & QC. It will display warnings if the user attempts to leave the page with
 * unsaved changes.
 *
 * The form can be printed in its entirety, or exported to CSV (not implemented).
 *
 * @param {QRDFormData} initialData The initial data for the QRD form.
 * @returns A JSX element representing the QRD form.
 */
export function QRDForm({ initialData }: QRDFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("setup");
  const [formData, setFormData] = useState<QRDFormData>(initialData);
  const [printDate, setPrintDate] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    setPrintDate(format(new Date(), "PPpp"));
  }, []);

  // Update formData when initialData changes (from parent)
  useEffect(() => {
    const initialDataStr = JSON.stringify(initialData);
    const formDataStr = JSON.stringify(formData);

    // Only update if initialData is different from current formData
    if (initialDataStr !== formDataStr) {
      setFormData(initialData);
      setHasUnsavedChanges(false);
    }
  }, [initialData]);

  // Handle form data updates from child components
  const handleDataChange = useCallback((updatedData: Partial<QRDFormData>) => {
    if (Object.keys(updatedData).length === 0) return;

    setFormData((prev) => {
      // Create the new state
      const newState = { ...prev };

      // Track if anything changed
      let changed = false;

      // Only update fields that are actually different
      Object.entries(updatedData).forEach(([key, value]) => {
        const typedKey = key as keyof QRDFormData;
        if (JSON.stringify(prev[typedKey]) !== JSON.stringify(value)) {
          // Use type assertion to ensure TypeScript knows we're setting a valid property
          (newState as any)[typedKey] = value;
          changed = true;
        }
      });

      // Only mark as unsaved and return new state if something changed
      if (changed) {
        setHasUnsavedChanges(true);
        return newState;
      }

      // Nothing changed, return previous state
      return prev;
    });
  }, []);

  // Save form data
  const handleSave = async () => {
    if (!hasUnsavedChanges) return;

    setSaving(true);
    try {
      // Extract only the QRD-specific data (excluding metadata)
      const {
        jobId,
        jobName,
        materialName,
        batchCode,
        supplierName,
        operationId,
        scheduledStart,
        startedAt,
        endedAt,
        status,
        stillId,
        stillCode,
        rawVolume,
        expectedYield,
        ...qrdData
      } = formData;

      const result = await updateQRDData(initialData.operationId, qrdData);

      if (result.success) {
        // Update state first
        setHasUnsavedChanges(false);

        // Show success message
        toast.success("Distillation record saved successfully");

        // Use setTimeout to separate router refresh from state updates
        setTimeout(() => {
          // router.refresh();
        }, 100);
      } else {
        toast.error(result.message || "Failed to save distillation record");
      }
    } catch (error) {
      console.error("Error saving QRD data:", error);
      toast.error("An unexpected error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  // Print the form
  const handlePrint = () => {
    window.print();
  };

  // Export as CSV
  const handleExport = () => {
    // Implementation for exporting data as CSV
    // This is a placeholder - actual implementation would depend on requirements
    toast.info("Export functionality to be implemented");
  };

  // Warn user about unsaved changes when leaving the page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Handle tab change logic - potentially warn about unsaved changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Format dates for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not started";
    return format(new Date(dateString), "PPp"); // e.g. "Apr 29, 2021, 1:30 PM"
  };

  // Determine if operation is active
  const isOperationActive =
    formData.status === "active" || formData.status === "pending";

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Print-only header */}
      <div className="hidden print:block">
        <h1 className="text-2xl font-bold text-center">
          Distillation Record (QRD)
        </h1>
        <div className="text-sm text-center text-muted-foreground">
          Printed on {printDate}
        </div>
      </div>

      {/* Form header (doesn't change with tabs) */}
      <Card className="print:shadow-none print:border-none">
        <CardContent className="pt-6">
          <QRDHeader data={formData} className="print:block" />

          {/* Operation status banner */}
          {formData.status === "completed" && (
            <div className="mt-4 p-2 bg-green-100 border border-green-300 rounded-md text-green-800 text-center">
              This distillation operation has been completed on{" "}
              {formatDate(formData.endedAt)}.
            </div>
          )}
          {formData.status === "error" && (
            <div className="mt-4 p-2 bg-red-100 border border-red-300 rounded-md text-red-800 text-center">
              This operation encountered an error. Please check with a
              supervisor.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main form content - tabs */}
      <Card className="print:shadow-none print:border-none">
        <CardHeader className="print:hidden">
          <CardTitle>Distillation Record Form</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="w-full print:hidden">
              <TabsTrigger value="setup" className="flex-1">
                Setup
              </TabsTrigger>
              <TabsTrigger value="readings" className="flex-1">
                Process Readings
              </TabsTrigger>
              <TabsTrigger value="fractions" className="flex-1">
                Fractions
              </TabsTrigger>
              <TabsTrigger value="summary" className="flex-1">
                Summary & QC
              </TabsTrigger>
            </TabsList>

            {/* All content visible when printing */}
            <div className="hidden print:block space-y-8">
              <QRDSetup
                data={formData}
                onChange={handleDataChange}
                disabled={!isOperationActive}
              />
              <QRDReadings
                data={formData}
                onChange={handleDataChange}
                disabled={!isOperationActive || !formData.setupTime}
              />
              <QRDFractions
                data={formData}
                onChange={handleDataChange}
                disabled={!isOperationActive || !formData.setupTime}
              />
              <QRDSummary
                data={formData}
                onChange={handleDataChange}
                disabled={!isOperationActive}
              />
            </div>

            {/* Tab content - only shown on screen */}
            <div className="print:hidden">
              <TabsContent value="setup">
                <QRDSetup
                  data={formData}
                  onChange={handleDataChange}
                  disabled={!isOperationActive}
                />
              </TabsContent>
              <TabsContent value="readings">
                <QRDReadings
                  data={formData}
                  onChange={handleDataChange}
                  disabled={!isOperationActive || !formData.setupTime}
                />
              </TabsContent>
              <TabsContent value="fractions">
                <QRDFractions
                  data={formData}
                  onChange={handleDataChange}
                  disabled={!isOperationActive || !formData.setupTime}
                />
              </TabsContent>
              <TabsContent value="summary">
                <QRDSummary
                  data={formData}
                  onChange={handleDataChange}
                  disabled={!isOperationActive}
                />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex justify-between print:hidden">
        <div className="flex space-x-2">
          {hasUnsavedChanges && (
            <div className="flex items-center text-amber-600 text-sm">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Unsaved changes
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handlePrint}
            className="print:hidden"
          >
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            className="print:hidden"
          >
            <FileDown className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !isOperationActive || !hasUnsavedChanges}
            className="print:hidden"
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
