
import React, { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export type JobStatus = "preparation" | "distillation" | "qcPending" | "complete";

interface JobCardProps {
  title: string;
  supplier: string;
  status: JobStatus;
  progress: number;
  quantity: number;
  scheduledDate?: string;
  priority?: "low" | "medium" | "high";
}

const JobCard: React.FC<JobCardProps> = ({
  title,
  supplier,
  status,
  progress,
  quantity,
  scheduledDate,
  priority,
}) => {
  const [expanded, setExpanded] = useState(false);

  const getStatusColor = () => {
    switch (status) {
      case "preparation":
        return "bg-jobStatus-preparation bg-opacity-20 border-jobStatus-preparation";
      case "distillation":
        return "bg-jobStatus-distillation bg-opacity-20 border-jobStatus-distillation";
      case "qcPending":
        return "bg-jobStatus-qcPending bg-opacity-20 border-jobStatus-qcPending";
      case "complete":
        return "bg-jobStatus-complete bg-opacity-20 border-jobStatus-complete";
    }
  };

  const getProgressColor = () => {
    switch (status) {
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

  const getPriorityLabel = () => {
    switch (priority) {
      case "high":
        return "High Priority";
      case "medium":
        return "Medium Priority";
      case "low":
        return "Low Priority";
      default:
        return "No Priority Set";
    }
  };

  const getPriorityColor = () => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        "rounded-2xl shadow-md mb-4 border-l-4 overflow-hidden transition-all duration-200",
        getStatusColor()
      )}
      whileTap={{ scale: 0.98 }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-lg">{title}</h3>
            <p className="text-sm text-gray-600">{supplier}</p>
          </div>
          <div className="flex flex-col items-end">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              Drums × {quantity}
            </span>
            {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>

        <div className="mt-4 w-full bg-gray-200 rounded-full h-1.5">
          <div
            className={cn("h-1.5 rounded-full", getProgressColor())}
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-gray-200"
          >
            <div className="grid grid-cols-2 gap-2">
              {scheduledDate && (
                <div>
                  <p className="text-xs text-gray-500">Scheduled Date</p>
                  <p className="text-sm font-medium">{scheduledDate}</p>
                </div>
              )}
              {priority && (
                <div>
                  <p className="text-xs text-gray-500">Priority</p>
                  <span
                    className={cn(
                      "inline-block px-2 py-1 rounded-full text-xs font-medium",
                      getPriorityColor()
                    )}
                  >
                    {getPriorityLabel()}
                  </span>
                </div>
              )}
            </div>
            <button className="mt-3 w-full text-center text-sm font-medium text-blue-600 hover:text-blue-800 focus:outline-none">
              View Details →
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default JobCard;
