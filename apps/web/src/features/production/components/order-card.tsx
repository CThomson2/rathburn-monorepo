import { useState, useRef } from "react";
import {
  CheckCircle,
  AlertTriangle,
  Loader,
  ChevronDown,
  ChevronUp,
  Edit,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OrderDetail } from "./order-detail";
import { ProgressIndicator } from "./progress-indicator";
import { Order, OrderStatus } from "../types";

import Link from "next/link";
import { motion } from "framer-motion";

type OrderCardProps = {
  order: Order;
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

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case "complete":
        return <CheckCircle className="text-status-complete" size={18} />;
      case "error":
        return <AlertTriangle className="text-status-error" size={18} />;
      default:
        return (
          <Loader className="text-status-preparing animate-spin" size={18} />
        );
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "preparing":
        return "bg-status-preparing";
      case "distillation":
        return "bg-status-distillation";
      case "qc":
        return "bg-status-qc";
      case "complete":
        return "bg-status-complete";
      case "error":
        return "bg-status-error";
      default:
        return "bg-gray-400";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
          if (e.key === "Enter") {
            setExpanded(!expanded);
          }
        }}
      >
        {/* Order Card Header */}
        <div
          className="p-6 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {order.id.slice(0, 8).toUpperCase()}
                </h3>
                <span
                  className={cn(
                    "ml-3 px-3 py-1 text-xs font-medium rounded-full",
                    getStatusColor(order.status),
                    order.status === "error" ? "text-white" : "text-white"
                  )}
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {order.itemName} • {order.supplier}
              </p>
            </div>
            <div className="flex items-center">
              <div className="text-right mr-4">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {order.quantity * 200} L
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(order.scheduledDate)}
                </p>
              </div>
              <button
                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
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
                {order.status === "complete" ? "Completed" : "In progress"}
              </span>
            </div>

            <button
              className="px-4 py-1.5 text-sm bg-brand-blue text-slate-800 dark:text-white hover:text-white rounded-lg hover:bg-blue-600 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                handleViewUpdate();
                // Action handler would go here
              }}
            >
              View & Update
            </button>
          </div>
        </div>

        {/* Expandable Detail Section */}
        {expanded && (
          <div className="border-t border-gray-100 dark:border-gray-700 animate-accordion-down">
            <OrderDetail order={order} />
          </div>
        )}
      </div>
    </motion.div>
  );
};
