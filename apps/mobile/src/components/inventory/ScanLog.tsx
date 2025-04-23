
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ScanLogProps {
  log: {
    id: string;
    barcode: string;
    timestamp: Date;
    messageType: "success" | "error" | "info";
  };
}

const ScanLog: React.FC<ScanLogProps> = ({ log }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 10000); // 10 second timeout

    return () => clearTimeout(timer);
  }, []);

  const getLogColor = () => {
    switch (log.messageType) {
      case "success":
        return "bg-green-100 border-green-500 text-green-700";
      case "error":
        return "bg-red-100 border-red-500 text-red-700";
      case "info":
      default:
        return "bg-blue-100 border-blue-500 text-blue-700";
    }
  };

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "rounded-lg border-l-4 p-3 shadow-sm",
        getLogColor()
      )}
    >
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm font-medium">{log.barcode}</p>
          <p className="text-xs">
            {log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>
        <div className="text-xs font-mono bg-white/20 px-2 py-1 rounded">
          #{log.id.substring(log.id.length - 4)}
        </div>
      </div>
    </motion.div>
  );
};

export default ScanLog;
