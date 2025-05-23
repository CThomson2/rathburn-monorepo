import { useState, useRef } from "react";
import {
  CheckCircle,
  AlertTriangle,
  Loader,
  ChevronDown,
  ChevronUp,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OrderDetail } from "./order-detail";
import { ProgressIndicator } from "./progress-indicator";
import {
  ProductionJobViewData,
  JobDisplayStatus,
  getStatusText,
} from "@/features/production/types";

import { motion } from "framer-motion";
import { TestTube2 } from "lucide-react";

type OrderCardProps = {
  order: ProductionJobViewData;
  handleViewUpdate: () => void;
  index: number;
};

export const OrderCard = ({
  order,
  handleViewUpdate,
  index,
}: OrderCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const getStatusIcon = (status: JobDisplayStatus) => {
    switch (status) {
      case "complete":
        return <CheckCircle className="text-status-complete" size={18} />;
      case "error":
        return <AlertTriangle className="text-status-error" size={18} />;
      case "drafted":
        return (
          <Pencil className="text-status-drafted animate-pulse" size={18} />
        );
      case "scheduled":
      case "confirmed":
        return (
          <CheckCircle
            className="text-status-drafted animate-pulse"
            size={18}
          />
        );
      case "in_progress":
      case "paused":
        return (
          <AlertTriangle
            className="text-status-in_progress animate-pulse"
            size={18}
          />
        );
      case "qc":
        return (
          <TestTube2
            className="text-status-in_progress animate-spin"
            size={18}
          />
        );
      default:
        const _exhaustiveCheck: never = status;
        return <Loader className="text-gray-500 animate-spin" size={18} />;
    }
  };

  const getStatusBadgeColorClass = (status: JobDisplayStatus): string => {
    switch (status) {
      case "drafted":
        return "bg-status-drafted";
      case "scheduled":
        return "bg-status-scheduled";
      case "confirmed":
        return "bg-status-confirmed";
      case "in_progress":
        return "bg-status-in_progress";
      case "paused":
        return "bg-status-paused";
      case "qc":
        return "bg-status-qc";
      case "complete":
        return "bg-status-complete";
      case "error":
        return "bg-status-error";
      default:
        const _exhaustiveCheck: never = status;
        return "bg-gray-400";
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "Invalid Date";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.1,
        ease: "easeOut",
      }}
    >
      <div
        ref={cardRef}
        className={cn(
          "block hover:shadow-lg bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all duration-300",
          expanded ? "mb-8" : "mb-4"
        )}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded(!expanded);
          }
        }}
      >
        {/* Order Card Header */}
        <div
          className="p-6 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
          role="button"
          aria-expanded={expanded ? "true" : "false"}
          aria-controls={`order-details-${order.id}`}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {order.jobName || order.id.slice(0, 8).toUpperCase()}
                </h3>
                <span
                  className={cn(
                    "ml-3 px-3 py-1 text-xs font-medium rounded-full text-white",
                    getStatusBadgeColorClass(order.status)
                  )}
                >
                  {getStatusText(order.status)}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {order.itemName} • {order.supplier}
              </p>
            </div>
            <div className="flex items-center">
              <div className="text-right mr-4">
                <p className="text-md text-gray-900 font-bold dark:text-white">
                  {typeof order.quantity === "number"
                    ? order.quantity * 200
                    : "N/A"}{" "}
                  L
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(order.scheduledDate)}
                </p>
              </div>
              <button
                type="button"
                title={expanded ? "Collapse details" : "Expand details"}
                aria-label={expanded ? "Collapse details" : "Expand details"}
                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(!expanded);
                }}
              >
                {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>
          </div>

          {/* Progress Indicator */}
          <ProgressIndicator status={order.status} progress={order.progress} />

          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center">
              {getStatusIcon(order.status)}
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                {getStatusText(order.status)}
              </span>
            </div>

            <button
              type="button"
              className="px-4 py-1.5 text-sm bg-brand-blue text-primary hover:text-white hover:font-bold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                handleViewUpdate();
              }}
            >
              View & Update
            </button>
          </div>
        </div>

        {/* Expandable Detail Section */}
        {expanded && (
          <div
            id={`order-details-${order.id}`}
            className="border-t border-gray-100 dark:border-gray-700 animate-accordion-down"
          >
            <OrderDetail order={order} />
          </div>
        )}
      </div>
    </motion.div>
  );
};
