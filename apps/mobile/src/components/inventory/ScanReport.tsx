import React from "react";
import { X, CheckCircle, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JobStatus } from "./JobCard";

interface ScanReportProps {
  contextLocation: string;
  scanCount: number;
  startTime: Date | null;
  endTime: Date;
  relatedJob?: {
    id: string;
    title: string;
    supplier: string;
    status: JobStatus;
    progress: number;
    quantity: number;
    scannedQuantity: number;
    scheduledDate: string;
    priority: "low" | "medium" | "high";
  };
  onClose: () => void;
}

/**
 * ScanReport is a React functional component that displays a summary
 * of a scan session. It shows details such as the location, total scans,
 * session duration, and XP earned. If there is a related production job,
 * it will also display details about the job, including the progress
 * and scanned quantity.
 *
 * Props:
 * - contextLocation: The location where the scan occurred.
 * - scanCount: The total number of scans performed.
 * - startTime: The start time of the scan session.
 * - endTime: The end time of the scan session.
 * - relatedJob: An optional object containing details of the related job,
 *   including title, supplier, status, progress, quantity, scanned quantity,
 *   scheduled date, and priority.
 * - onClose: A function that is called when the report is closed.
 */

const ScanReport: React.FC<ScanReportProps> = ({
  contextLocation,
  scanCount,
  startTime,
  endTime,
  relatedJob,
  onClose,
}) => {
  const calculateDuration = () => {
    if (!startTime) return "Unknown";

    const diff = endTime.getTime() - startTime.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    return `${minutes}m ${seconds}s`;
  };

  // Calculate XP earned (2 points per scan, +10 bonus for completing job)
  const calculateXP = () => {
    let xp = scanCount * 2;
    if (relatedJob && relatedJob.scannedQuantity >= relatedJob.quantity) {
      xp += 10; // Bonus for completing job
    }
    return xp;
  };

  const getJobProgressText = () => {
    if (!relatedJob) return "No related job";
    return `${relatedJob.scannedQuantity}/${relatedJob.quantity} drums scanned`;
  };

  const getJobCompletion = () => {
    if (!relatedJob) return 0;
    return Math.min(
      100,
      (relatedJob.scannedQuantity / relatedJob.quantity) * 100
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-lg transition-all duration-300">
        {/* Header */}
        <div className="bg-green-500 p-5 flex justify-between items-start">
          <div className="text-white">
            <h2 className="text-2xl font-bold">Scan Session Complete</h2>
            <p className="opacity-90">Session summary</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
            aria-label="Close report"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-gray-500 text-sm">Location</p>
              <div className="flex items-center mt-1">
                <MapPin className="h-4 w-4 mr-1 text-gray-500" />
                <span className="font-medium">{contextLocation}</span>
              </div>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Scans</p>
              <p className="font-medium text-lg">{scanCount}</p>
            </div>

            <div>
              <p className="text-gray-500 text-sm">Started</p>
              <div className="flex items-center mt-1">
                <Clock className="h-4 w-4 mr-1 text-gray-500" />
                <span className="font-medium">
                  {startTime
                    ? startTime.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "--:--"}
                </span>
              </div>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Duration</p>
              <p className="font-medium">{calculateDuration()}</p>
            </div>
          </div>

          {/* Related Production Job */}
          {relatedJob && (
            <div className="mb-6">
              <h3 className="font-medium mb-2">Related Production Jobs</h3>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium">{relatedJob.title}</h4>
                    <p className="text-sm text-gray-600">
                      {relatedJob.supplier}
                    </p>
                  </div>
                  <div className="bg-white px-2 py-1 rounded text-sm border border-gray-200">
                    Drums × {relatedJob.quantity}
                  </div>
                </div>

                <div className="relative mt-2">
                  <div className="bg-gray-200 h-2 rounded-full w-full">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${getJobCompletion()}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-green-700">
                      +{relatedJob.scannedQuantity} scanned
                    </span>
                    <span className="text-xs text-gray-500">
                      {getJobProgressText()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* XP Earned */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-800 font-medium">XP Earned</p>
                <p className="text-3xl font-bold text-blue-900">
                  {calculateXP()}
                </p>
              </div>
              <div className="bg-blue-500 text-white h-12 w-12 rounded-full flex items-center justify-center">
                <CheckCircle size={24} />
              </div>
            </div>
          </div>

          {/* Complete button */}
          <Button
            className="w-full bg-green-500 hover:bg-green-600 text-white"
            onClick={onClose}
          >
            Complete Session
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ScanReport;
