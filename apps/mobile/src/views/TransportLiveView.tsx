"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TransportCard } from "@/components/layout/TransportCard";
import { ScanInput } from "@/features/scanner/components/scan-input";
import { ScanHistory } from "@/features/scanner/components/scan-history";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Maximize,
  History,
  CheckCircle,
  XCircle,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import scanService from "@/features/scanner/services/handle-scan";

// Mock data for demonstration
const MOCK_TRANSPORT_JOBS = [
  {
    id: 1,
    material: "Pentane",
    supplier: "Caldic",
    totalDrums: 5,
    scannedDrums: 0,
    created: "2025-03-31",
    scheduled: "2025-04-24",
    assignedWorkers: ["James Doherty"],
    stillAssignment: "Still B",
    location: "Old Site",
    drumIds: ["17583", "17584", "17585", "17586", "17587"],
    scannedIds: [],
  },
  {
    id: 2,
    material: "Acetic Acid",
    supplier: "Univar",
    totalDrums: 12,
    scannedDrums: 0,
    created: "2025-04-01",
    scheduled: "2025-04-26",
    assignedWorkers: ["Sarah Johnson"],
    stillAssignment: "Still A",
    location: "New Site",
    drumIds: [
      "16120",
      "16121",
      "16122",
      "16123",
      "16124",
      "16125",
      "16126",
      "16127",
      "16128",
      "16129",
      "16130",
      "16131",
    ],
    scannedIds: [],
  },
];

export default function GoodsInTransportPage() {
  const router = useRouter();
  const [transportJobs, setTransportJobs] = useState(MOCK_TRANSPORT_JOBS);
  const [currentJobIndex, setCurrentJobIndex] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [showScanConfirmation, setShowScanConfirmation] = useState(false);
  const [lastScannedDrum, setLastScannedDrum] = useState("");
  const [scanStatus, setScanStatus] = useState<"success" | "error" | null>(
    null
  );
  const [showBulkConfirmation, setShowBulkConfirmation] = useState(false);

  // Scan history - in production this would come from the database
  const [scanHistory, setScanHistory] = useState<
    {
      timestamp: string;
      drumId: string;
      status: "success" | "error" | "cancelled";
      message: string;
    }[]
  >([]);

  // Get current job for easier access
  const currentJob = transportJobs[currentJobIndex];

  // Function to handle barcode scans
  const handleBarcodeScan = async (barcode: string) => {
    if (!barcode) return;

    setLastScannedDrum(barcode);

    // Check if barcode is in the current job's drum IDs
    const isValidDrum = currentJob.drumIds.includes(barcode);
    const isAlreadyScanned = currentJob.scannedIds.includes(barcode);

    if (isValidDrum && !isAlreadyScanned) {
      // Success case - valid drum and not already scanned
      setScanStatus("success");

      // Update the job's scanned drums
      const updatedJobs = [...transportJobs];
      updatedJobs[currentJobIndex].scannedDrums += 1;
      updatedJobs[currentJobIndex].scannedIds.push(barcode);
      setTransportJobs(updatedJobs);

      // Add to scan history
      setScanHistory((prev) => [
        {
          timestamp: new Date().toISOString(),
          drumId: barcode,
          status: "success",
          message: `Successfully scanned drum ${barcode}`,
        },
        ...prev,
      ]);

      // In production, you would call the server action here
      try {
        const result = await scanService.processScan({
          barcode,
          jobId: currentJob.id,
          action: "transport_for_production",
        });

        // Show success notification with animation
        setTimeout(() => {
          setShowScanConfirmation(true);
          setTimeout(() => setShowScanConfirmation(false), 1500);
        }, 100);
      } catch (error) {
        toast.error("Error processing scan", {
          description: "Failed to save scan to database",
        });
      }
    } else if (isValidDrum && isAlreadyScanned) {
      // Already scanned
      setScanStatus("error");
      toast.error("Already Scanned", {
        description: `Drum ${barcode} has already been scanned`,
      });

      // Add to scan history
      setScanHistory((prev) => [
        {
          timestamp: new Date().toISOString(),
          drumId: barcode,
          status: "error",
          message: `Drum ${barcode} already scanned`,
        },
        ...prev,
      ]);
    } else {
      // Not a valid drum for this job
      setScanStatus("error");
      toast.error("Invalid Drum", {
        description: `Drum ${barcode} is not part of this job`,
      });

      // Add to scan history
      setScanHistory((prev) => [
        {
          timestamp: new Date().toISOString(),
          drumId: barcode,
          status: "error",
          message: `Invalid drum ID: ${barcode}`,
        },
        ...prev,
      ]);
    }
  };

  // Function to handle bulk registration
  const handleBulkRegistration = async () => {
    const unscannedDrums = currentJob.drumIds.filter(
      (id) => !currentJob.scannedIds.includes(id)
    );

    if (unscannedDrums.length === 0) {
      toast.info("All drums already scanned", {
        description: "There are no unscanned drums left in this job",
      });
      return;
    }

    // Update the job's scanned drums
    const updatedJobs = [...transportJobs];
    updatedJobs[currentJobIndex].scannedDrums =
      updatedJobs[currentJobIndex].totalDrums;
    updatedJobs[currentJobIndex].scannedIds = [
      ...updatedJobs[currentJobIndex].drumIds,
    ];
    setTransportJobs(updatedJobs);

    // Add to scan history
    const currentTime = new Date().toISOString();
    const newHistoryEntries = unscannedDrums.map((drumId) => ({
      timestamp: currentTime,
      drumId,
      status: "success" as const,
      message: `Bulk registered: ${drumId}`,
    }));

    setScanHistory((prev) => [...newHistoryEntries, ...prev]);

    // In production, you would call the server action here
    try {
      // const results = await Promise.all(
      //   unscannedDrums.map(drumId =>
      //     processBarcodeScan({
      //       barcode: drumId,
      //       jobId: currentJob.id,
      //       action: "bulk"
      //     })
      //   )
      // );

      toast.success("Bulk Registration Complete", {
        description: `Registered ${unscannedDrums.length} drums`,
      });
    } catch (error) {
      toast.error("Error processing bulk registration", {
        description: "Failed to save scans to database",
      });
    }

    setShowBulkConfirmation(false);
  };

  // Function to handle cancellation of a scan
  const handleCancelScan = async (drumId: string) => {
    // Check if user has permission (in production, check user role)
    const hasPermission = true; // Mock permission check

    if (!hasPermission) {
      toast.error("Permission Denied", {
        description: "You don't have permission to cancel scans",
      });
      return;
    }

    // Check if the drum is actually scanned
    if (!currentJob.scannedIds.includes(drumId)) {
      toast.error("Not Scanned", {
        description: `Drum ${drumId} is not currently scanned`,
      });
      return;
    }

    // Update the job's scanned drums
    const updatedJobs = [...transportJobs];
    updatedJobs[currentJobIndex].scannedDrums -= 1;
    updatedJobs[currentJobIndex].scannedIds = updatedJobs[
      currentJobIndex
    ].scannedIds.filter((id) => id !== drumId);
    setTransportJobs(updatedJobs);

    // Add to scan history
    setScanHistory((prev) => [
      {
        timestamp: new Date().toISOString(),
        drumId,
        status: "cancelled",
        message: `Cancelled scan: ${drumId}`,
      },
      ...prev,
    ]);

    // In production, you would call the server action here
    try {
      // const result = await processBarcodeScan({
      //   barcode: drumId,
      //   jobId: currentJob.id,
      //   action: "cancel"
      // });

      toast.success("Scan Cancelled", {
        description: `Cancelled scan for drum ${drumId}`,
      });
    } catch (error) {
      toast.error("Error cancelling scan", {
        description: "Failed to save cancellation to database",
      });
    }
  };

  return (
    <div className="space-y-4 py-4 relative">
      <h1 className="text-2xl font-bold tracking-tight">Goods in Transport</h1>

      {/* Transport job cards */}
      {transportJobs.map((job, index) => (
        <TransportCard
          key={job.id}
          job={job}
          active={index === currentJobIndex}
          onSelect={() => setCurrentJobIndex(index)}
          onCancelScan={handleCancelScan}
        />
      ))}

      {/* Hidden barcode input */}
      <ScanInput onScan={handleBarcodeScan} />

      {/* Floating action buttons */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2">
        <Button
          size="icon"
          className="rounded-full w-12 h-12 shadow-lg"
          onClick={() => setShowHistory(true)}
        >
          <History className="h-6 w-6" />
        </Button>

        <Button
          size="icon"
          className="rounded-full w-12 h-12 shadow-lg"
          onClick={() => setShowBulkConfirmation(true)}
        >
          <CheckCircle className="h-6 w-6" />
        </Button>

        <Button
          size="icon"
          className="rounded-full w-12 h-12 shadow-lg"
          onClick={() => router.push("/mobile/transport/settings")}
        >
          <Settings className="h-6 w-6" />
        </Button>
      </div>

      {/* Scan history dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Scan History</DialogTitle>
            <DialogDescription>
              Recent scanning activity for this session
            </DialogDescription>
          </DialogHeader>

          <ScanHistory history={scanHistory} onCancelScan={handleCancelScan} />
        </DialogContent>
      </Dialog>

      {/* Bulk registration confirmation dialog */}
      <Dialog
        open={showBulkConfirmation}
        onOpenChange={setShowBulkConfirmation}
      >
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Confirm Bulk Registration</DialogTitle>
            <DialogDescription className="text-destructive">
              Warning: This action will mark all unscanned drums as scanned
              without physically scanning them. This can jeopardize 100%
              accuracy of inventory tracking. All actions will be logged for
              auditing and traceability purposes.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowBulkConfirmation(false)}
              className="sm:w-full"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkRegistration}
              className="sm:w-full"
            >
              Confirm Registration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scan confirmation overlay */}
      {showScanConfirmation && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div
            className={cn(
              "bg-white dark:bg-slate-800 rounded-lg px-10 py-8 text-center transform transition-all",
              scanStatus === "success"
                ? "border-4 border-green-500"
                : "border-4 border-red-500"
            )}
          >
            <div className="text-3xl font-bold mb-2">
              {currentJob.material.toUpperCase()}-{lastScannedDrum}
            </div>
            <div
              className={cn(
                "text-xl font-semibold",
                scanStatus === "success" ? "text-green-500" : "text-red-500"
              )}
            >
              {scanStatus === "success" ? "SUCCESS" : "ERROR"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
