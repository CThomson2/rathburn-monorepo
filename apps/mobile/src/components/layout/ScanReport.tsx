import React from "react";
import { X } from "lucide-react";
import { JobStatus } from "@/components/layout/JobCard";
import SimpleModal from "@/core/components/ui/simple-modal";

interface JobItem {
  id: string;
  title: string;
  supplier: string;
  status: JobStatus;
  progress: number;
  quantity: number;
  scannedQuantity: number;
  scheduledDate: string;
  priority: "low" | "medium" | "high";
}

interface ScanReportProps {
  contextLocation: string;
  scanCount: number;
  startTime: Date | null;
  endTime: Date;
  relatedJob: JobItem;
  onClose: () => void;
}

const ScanReport: React.FC<ScanReportProps> = ({
  contextLocation,
  scanCount,
  startTime,
  endTime,
  relatedJob,
  onClose,
}) => {
  const duration = startTime
    ? Math.floor((endTime.getTime() - startTime.getTime()) / 1000)
    : 0;
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;

  const getStatusColor = () => {
    switch (relatedJob.status) {
      case "preparation":
        return "bg-jobStatus-preparation";
      case "distillation":
        return "bg-jobStatus-distillation";
      case "qcPending":
        return "bg-jobStatus-qcPending";
      case "complete":
        return "bg-jobStatus-complete";
    }
  };

  // Calculate the width of the new progress based on scanned quantity
  const baseProgress = relatedJob.progress;
  const additionalProgress =
    (relatedJob.scannedQuantity / relatedJob.quantity) * 100;
  const totalProgress = Math.min(baseProgress + additionalProgress, 100);

  return (
    <SimpleModal isOpen={true} onClose={onClose} title="Scan Session Complete">
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Location</p>
            <p className="font-medium">{contextLocation}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Scans</p>
            <p className="font-medium">{scanCount}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Started</p>
            <p className="font-medium">
              {startTime
                ? startTime.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "--:--"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Duration</p>
            <p className="font-medium">{`${minutes}m ${seconds}s`}</p>
          </div>
        </div>

        {relatedJob.scannedQuantity > 0 && (
          <div className="mb-4">
            <h3 className="font-medium mb-2">Related Production Jobs</h3>
            <div className="border rounded-lg p-3 bg-gray-50">
              <div className="flex justify-between mb-1">
                <div>
                  <p className="font-medium">{relatedJob.title}</p>
                  <p className="text-sm text-gray-600">{relatedJob.supplier}</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Drums × {relatedJob.quantity}
                  </span>
                  <span className="text-xs text-green-600 mt-1">
                    +{relatedJob.scannedQuantity} scanned
                  </span>
                </div>
              </div>

              <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                {/* Base progress */}
                <div
                  className={`absolute h-full ${getStatusColor()}`}
                  style={{ width: `${baseProgress}%` }}
                ></div>

                {/* New progress */}
                {relatedJob.scannedQuantity > 0 && (
                  <div
                    className="absolute h-full bg-green-400"
                    style={{
                      width: `${additionalProgress}%`,
                      left: `${baseProgress}%`,
                    }}
                  ></div>
                )}
              </div>

              <div className="mt-2 text-xs text-right">
                {relatedJob.scannedQuantity}/{relatedJob.quantity} items
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </SimpleModal>
  );
};

export default ScanReport;
