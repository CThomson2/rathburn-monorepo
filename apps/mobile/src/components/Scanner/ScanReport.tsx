import React from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { JobStatus } from "@/components/inventory/JobCard";

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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="bg-white rounded-xl w-full max-w-md overflow-hidden"
      >
        <div className="p-4 bg-green-500 text-white flex justify-between items-center">
          <h2 className="text-lg font-bold">Scan Session Complete</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20"
          >
            <X size={20} />
          </button>
        </div>

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
                    <p className="text-sm text-gray-600">
                      {relatedJob.supplier}
                    </p>
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

          <Button
            onClick={onClose}
            className="w-full mt-2 bg-green-500 hover:bg-green-600"
          >
            Complete Session
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ScanReport;
