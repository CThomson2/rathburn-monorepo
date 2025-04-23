import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
  visible: boolean;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, visible, onClose }) => {
  const [isVisible, setIsVisible] = useState(visible);

  useEffect(() => {
    setIsVisible(visible);

    if (visible) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  const getToastColor = () => {
    switch (type) {
      case "success":
        return "bg-green-100 border-green-500 text-green-700";
      case "error":
        return "bg-red-100 border-red-500 text-red-700";
      case "info":
      default:
        return "bg-blue-100 border-blue-500 text-blue-700";
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed top-4 left-4 right-4 z-50 rounded-lg border-l-4 p-4 shadow-md animate-fadeIn",
        getToastColor()
      )}
    >
      <div className="flex justify-between items-center">
        <p className="text-sm font-medium">{message}</p>
        <button
          onClick={() => {
            setIsVisible(false);
            onClose();
          }}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default Toast;
