import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/core/components/ui/dialog";
import { Separator } from "@/core/components/ui/separator";
import { Button } from "@/core/components/ui/button";
import { Progress } from "@/core/components/ui/progress";
import { Badge } from "@/core/components/ui/badge";
import { XIcon, CheckCircle, Award } from "lucide-react"; // Example icons

interface SessionReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sessionData: {
    duration: string;
    scanCount: number;
    scannedBarcodes: Array<{ id: string; raw_barcode: string }>; // Updated to match query
    xpStart: number; // e.g. 15
    xpEnd: number; // e.g. 30
    currentLevel: number;
    sessionName?: string; // Optional name for the session
  };
}

/**
 * A dialog component that displays a summary of a completed stocktake session.
 * It takes in the following props:
 * - isOpen: a boolean indicating whether the dialog is open or closed
 * - onClose: a function to call when the dialog is closed
 * - sessionData: an object containing the session data, including:
 *   - duration: the length of the session (e.g. "5m 32s")
 *   - scanCount: the number of scans in the session
 *   - scannedBarcodes: an array of objects, each containing the id and raw_barcode of a scanned item
 *   - xpStart: the starting XP for the session
 *   - xpEnd: the final XP for the session
 *   - currentLevel: the current level of the user
 *   - sessionName: an optional name for the session
 * The component displays the following information:
 * - Session name (if provided)
 * - Duration and scan count
 * - XP progress bar, with the starting and final XP values, and the current level
 * - A list of scanned items, with each item displayed as a badge
 * - A "Continue" button to close the dialog
 */
export function SessionReportDialog({
  isOpen,
  onClose,
  sessionData,
}: SessionReportDialogProps) {
  const [progressValue, setProgressValue] = useState(sessionData.xpStart);

  useEffect(() => {
    if (isOpen) {
      setProgressValue(sessionData.xpStart); // Reset on open
      const timer = setTimeout(() => {
        setProgressValue(sessionData.xpEnd);
      }, 300); // Start animation shortly after open
      return () => clearTimeout(timer);
    }
  }, [isOpen, sessionData.xpStart, sessionData.xpEnd]);

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700 text-white shadow-2xl rounded-lg p-0">
        <DialogHeader className="p-6 bg-slate-700 rounded-t-lg flex flex-row items-center justify-between">
          <DialogTitle className="text-2xl font-bold flex items-center">
            <Award className="mr-3 h-8 w-8 text-yellow-400" />
            Session Complete!
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <XIcon className="h-6 w-6" />
          </Button>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Session Name (Optional) */}
          {sessionData.sessionName && (
            <p className="text-center text-slate-300 text-lg">
              Session:{" "}
              <span className="font-semibold">{sessionData.sessionName}</span>
            </p>
          )}

          {/* Stats Section */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-sky-400">
                {sessionData.duration}
              </p>
              <p className="text-sm text-slate-400">Duration</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-sky-400">
                {sessionData.scanCount}
              </p>
              <p className="text-sm text-slate-400">Scans</p>
            </div>
          </div>

          {/* XP Progress Bar and Level */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm text-slate-300">
              <span>Level {sessionData.currentLevel}</span>
              <span>XP: {progressValue}% / 100%</span>
            </div>
            <Progress
              value={progressValue}
              className="w-full h-4 bg-slate-600 [&>div]:bg-green-500 transition-all duration-1000 ease-in-out"
            />
            <p className="text-xs text-center text-slate-400 mt-1">
              You gained {sessionData.xpEnd - sessionData.xpStart} XP this
              session!
            </p>
          </div>

          {/* Move the Continue button above the Scanned Items, as otherwise it is pushed off the bottom of the screen */}
          <Button
            onClick={onClose}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 text-lg"
          >
            <CheckCircle className="mr-2 h-5 w-5" />
            Continue
          </Button>

          <Separator className="my-4" />

          <DialogFooter className="p-6 bg-slate-750 rounded-b-lg">
            {/* Scanned Barcodes Grid */}
            {sessionData.scannedBarcodes &&
              sessionData.scannedBarcodes.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-slate-200">
                    Scanned Items:
                  </h3>
                  <div className="max-h-32 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 gap-2 p-2 bg-slate-750 rounded-md">
                    {sessionData.scannedBarcodes.map((scan, index) => (
                      <Badge
                        key={scan.id || index} // Use scan.id if available, otherwise index
                        variant="secondary"
                        className="truncate bg-slate-600 text-slate-200 hover:bg-slate-500"
                      >
                        {scan.raw_barcode}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            {sessionData.scannedBarcodes &&
              sessionData.scannedBarcodes.length === 0 && (
                <p className="text-center text-slate-400">
                  No items were scanned in this session.
                </p>
              )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Example Usage (for testing purposes, to be removed or adapted)
// export function SessionReportDialogPreview() {
//   const [isOpen, setIsOpen] = useState(true);
//   const exampleSessionData = {
//     duration: '5m 32s',
//     scanCount: 78,
//     scannedBarcodes: [
//       { id: '1', raw_barcode: 'BC12345678' }, { id: '2', raw_barcode: 'BC87654321' }, { id: '3', raw_barcode: 'SCANME9900' },
//       { id: '4', raw_barcode: 'TESTCODE01' }, { id: '5', raw_barcode: 'ANOTHERONE' }, { id: '6', raw_barcode: 'LASTSCAN06' },
//     ],
//     xpStart: 15,
//     xpEnd: 45,
//     currentLevel: 57,
//     sessionName: 'Warehouse Audit A-12',
//   };

//   return (
//     <>
//       <Button onClick={() => setIsOpen(true)}>Show Session Report</Button>
//       <SessionReportDialog
//         isOpen={isOpen}
//         onClose={() => setIsOpen(false)}
//         sessionData={exampleSessionData}
//       />
//     </>
//   );
// }
