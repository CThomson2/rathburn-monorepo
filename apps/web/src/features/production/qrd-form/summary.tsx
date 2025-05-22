"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { QRDFormData } from "@/features/production/types/qrd";
import {
  Clock,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  BookUser,
  Shield,
  Calculator,
} from "lucide-react";

interface QRDSummaryProps {
  data: QRDFormData;
  onChange: (data: Partial<QRDFormData>) => void;
  disabled?: boolean;
}

/**
 * @summary A component for displaying and editing a QRD (Quality Record for Distillation) summary.
 * @description
 * This component is used to display and edit a summary of a distillation, including auto-calculated values
 * such as total process time, total yield volume, and yield percentage. It also allows the user to input
 * additional information such as final notes and quality control results. Finally, it provides a way for a
 * supervisor to approve the distillation record.
 * @param {QRDSummaryProps} props
 * @prop {QRDFormData} data The data for the distillation to be displayed and edited.
 * @prop {(data: Partial<QRDFormData>) => void} onChange A function to be called when any of the data changes.
 * @prop {boolean} [disabled=false] Whether the component should be disabled.
 * @returns {JSX.Element}
 */
export function QRDSummary({
  data,
  onChange,
  disabled = false,
}: QRDSummaryProps) {
  // Calculate derived values
  const calculateTotalTime = () => {
    if (!data.setupTime || !data.fractions || data.fractions.length === 0)
      return 0;

    const setup = new Date(data.setupTime);
    const lastFraction = data.fractions.sort(
      (a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime()
    )[0];

    if (!lastFraction) return 0;

    const end = new Date(lastFraction.endTime);
    return (end.getTime() - setup.getTime()) / (1000 * 60 * 60); // Hours
  };

  const calculateTotalYield = () => {
    if (!data.fractions) return 0;
    return data.fractions.reduce(
      (total, fraction) => total + fraction.volume,
      0
    );
  };

  const calculateYieldPercentage = () => {
    const totalYield = calculateTotalYield();
    const rawVolume = data.rawVolume || 0;
    if (rawVolume === 0) return 0;
    return (totalYield / rawVolume) * 100;
  };

  // Local state
  const [totalTimeHours, setTotalTimeHours] = useState<number>(
    data.totalTimeHours || calculateTotalTime()
  );
  const [totalYieldVolume, setTotalYieldVolume] = useState<number>(
    data.totalYieldVolume || calculateTotalYield()
  );
  const [yieldPercentage, setYieldPercentage] = useState<number>(
    data.yieldPercentage || calculateYieldPercentage()
  );
  const [finalNotes, setFinalNotes] = useState<string>(data.finalNotes || "");
  const [completedBy, setCompletedBy] = useState<string>(
    data.completedBy || ""
  );

  // Quality Check state
  const [qcPerformed, setQcPerformed] = useState<boolean>(
    data.qualityCheck?.performed || false
  );
  const [qcPassed, setQcPassed] = useState<boolean>(
    data.qualityCheck?.passedQC || false
  );
  const [qcNotes, setQcNotes] = useState<string>(
    data.qualityCheck?.qcNotes || ""
  );
  const [qcPerformedBy, setQcPerformedBy] = useState<string>(
    data.qualityCheck?.qcPerformedBy || ""
  );

  // Supervisor Approval state
  const [approvalApproved, setApprovalApproved] = useState<boolean>(
    data.supervisorApproval?.approved || false
  );
  const [approvalBy, setApprovalBy] = useState<string>(
    data.supervisorApproval?.approvedBy || ""
  );
  const [approvalAt, setApprovalAt] = useState<string>(
    data.supervisorApproval?.approvedAt || ""
  );
  const [approvalNotes, setApprovalNotes] = useState<string>(
    data.supervisorApproval?.notes || ""
  );

  // Auto-calculate values when fractions change
  useEffect(() => {
    const autoTotalTime = calculateTotalTime();
    const autoTotalYield = calculateTotalYield();
    const autoYieldPercentage = calculateYieldPercentage();

    setTotalTimeHours(autoTotalTime);
    setTotalYieldVolume(autoTotalYield);
    setYieldPercentage(autoYieldPercentage);
  }, [data.fractions, data.setupTime, data.rawVolume]);

  // Update parent component
  useEffect(() => {
    onChange({
      totalTimeHours,
      totalYieldVolume,
      yieldPercentage,
      finalNotes,
      completedBy,
      qualityCheck: {
        performed: qcPerformed,
        passedQC: qcPassed,
        qcNotes,
        qcPerformedBy,
      },
      supervisorApproval: {
        approved: approvalApproved,
        approvedBy: approvalBy,
        approvedAt: approvalAt,
        notes: approvalNotes,
      },
    });
  }, [
    totalTimeHours,
    totalYieldVolume,
    yieldPercentage,
    finalNotes,
    completedBy,
    qcPerformed,
    qcPassed,
    qcNotes,
    qcPerformedBy,
    approvalApproved,
    approvalBy,
    approvalAt,
    approvalNotes,
    onChange,
  ]);

  // Handle approval
  const handleApprove = () => {
    setApprovalApproved(true);
    setApprovalAt(new Date().toISOString());
  };

  // Handle completion
  const handleComplete = () => {
    if (!completedBy) {
      setCompletedBy(data.setupBy || "");
    }
  };

  // Check if distillation is complete
  const isComplete = completedBy && totalYieldVolume > 0;
  const canApprove = isComplete && qcPerformed;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Summary & Quality Control</h3>
        <div className="flex gap-2">
          {isComplete && (
            <Badge variant="default">
              <CheckCircle className="h-3 w-3 mr-1" />
              Complete
            </Badge>
          )}
          {approvalApproved && (
            <Badge variant="default">
              <Shield className="h-3 w-3 mr-1" />
              Approved
            </Badge>
          )}
        </div>
      </div>

      {/* Auto-calculated Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <Calculator className="h-4 w-4 mr-2" />
            Distillation Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Time */}
            <div className="space-y-2">
              <Label>Total Process Time</Label>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-lg font-semibold">
                  {totalTimeHours.toFixed(1)} hours
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                Auto-calculated from setup to last fraction
              </div>
            </div>

            {/* Total Yield */}
            <div className="space-y-2">
              <Label>Total Yield Volume</Label>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-lg font-semibold">
                  {totalYieldVolume.toFixed(1)}L
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                Sum of all collected fractions
              </div>
            </div>

            {/* Yield Percentage */}
            <div className="space-y-2">
              <Label>Yield Percentage</Label>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span
                  className={`text-lg font-semibold ${
                    yieldPercentage >= 80
                      ? "text-green-600"
                      : yieldPercentage >= 60
                        ? "text-yellow-600"
                        : "text-red-600"
                  }`}
                >
                  {yieldPercentage.toFixed(1)}%
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                Of {data.rawVolume}L input volume
              </div>
            </div>
          </div>

          {/* Expected vs Actual Yield */}
          {data.expectedYield && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span>Expected yield:</span>
                <span>{data.expectedYield}L</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span>Actual yield:</span>
                <span
                  className={
                    totalYieldVolume >= data.expectedYield * 0.9
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {totalYieldVolume.toFixed(1)}L
                </span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Variance:</span>
                <span>
                  {totalYieldVolume >= data.expectedYield ? "+" : ""}
                  {(totalYieldVolume - data.expectedYield).toFixed(1)}L
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Final Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Final Notes & Completion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Final Notes</Label>
            <Textarea
              value={finalNotes}
              onChange={(e) => setFinalNotes(e.target.value)}
              placeholder="Any final observations, issues encountered, or notes about the distillation process..."
              disabled={disabled}
              rows={3}
              registration={{} as any}
            />
          </div>

          <div className="space-y-2">
            <Label>Completed By</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <BookUser className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={completedBy}
                  onChange={(e) => setCompletedBy(e.target.value)}
                  placeholder="Operator who completed the distillation"
                  disabled={disabled}
                  className="pl-8"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleComplete}
                disabled={disabled || !data.setupBy}
              >
                Use Setup Operator
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quality Control */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quality Control</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="qc-performed"
              checked={qcPerformed}
              onCheckedChange={(checked) => setQcPerformed(checked as boolean)}
              disabled={disabled}
            />
            <Label htmlFor="qc-performed">
              Quality control testing performed
            </Label>
          </div>

          {qcPerformed && (
            <div className="ml-6 space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="qc-passed"
                  checked={qcPassed}
                  onCheckedChange={(checked) => setQcPassed(checked as boolean)}
                  disabled={disabled}
                />
                <Label htmlFor="qc-passed">Sample passed QC testing</Label>
              </div>

              <div className="space-y-2">
                <Label>QC Notes</Label>
                <Textarea
                  value={qcNotes}
                  onChange={(e) => setQcNotes(e.target.value)}
                  placeholder="Results of quality control testing, purity measurements, etc..."
                  disabled={disabled}
                  rows={2}
                  registration={{} as any}
                />
              </div>

              <div className="space-y-2">
                <Label>QC Performed By</Label>
                <Input
                  value={qcPerformedBy}
                  onChange={(e) => setQcPerformedBy(e.target.value)}
                  placeholder="Name of person who performed QC"
                  disabled={disabled}
                />
              </div>
            </div>
          )}

          {!qcPassed && qcPerformed && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Sample failed QC testing. Supervisor approval may be required
                before proceeding.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Supervisor Approval */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <Shield className="h-4 w-4 mr-2" />
            Supervisor Approval
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="approval"
                checked={approvalApproved}
                onCheckedChange={(checked) =>
                  setApprovalApproved(checked as boolean)
                }
                disabled={disabled || !canApprove}
              />
              <Label htmlFor="approval">Approve distillation record</Label>
            </div>
            {canApprove && !approvalApproved && (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleApprove}
                disabled={disabled}
              >
                <Shield className="h-4 w-4 mr-1" />
                Approve Now
              </Button>
            )}
          </div>

          {!canApprove && (
            <div className="text-sm text-muted-foreground">
              Complete the distillation and QC testing before approval.
            </div>
          )}

          {approvalApproved && (
            <div className="ml-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Approved By</Label>
                  <Input
                    value={approvalBy}
                    onChange={(e) => setApprovalBy(e.target.value)}
                    placeholder="Supervisor name"
                    disabled={disabled}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Approval Date</Label>
                  <Input
                    type="datetime-local"
                    value={
                      approvalAt
                        ? format(new Date(approvalAt), "yyyy-MM-dd'T'HH:mm")
                        : ""
                    }
                    onChange={(e) =>
                      setApprovalAt(new Date(e.target.value).toISOString())
                    }
                    disabled={disabled}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Approval Notes</Label>
                <Textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Any additional notes from supervisor..."
                  disabled={disabled}
                  rows={2}
                  registration={{} as any}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completion Status */}
      {isComplete && approvalApproved && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Distillation record is complete and approved.
            {approvalAt &&
              ` Approved on ${format(new Date(approvalAt), "PPp")}.`}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
