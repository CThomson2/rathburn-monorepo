import React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScannerOverlayProps {
  active: boolean;
  onClose: () => void;
}

const ScannerOverlay: React.FC<ScannerOverlayProps> = ({ active, onClose }) => {
  if (!active) return null;

  return (
    <div className="fixed inset-0 z-40 bg-black bg-opacity-70 flex items-center justify-center animate-fadeIn">
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white rounded-full"
          aria-label="Close scanner"
        >
          <X size={24} className="text-gray-800" />
        </button>

        {/* Scanner frame */}
        <div className="relative w-64 h-64">
          {/* Scanner corners */}
          <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-white"></div>
          <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-white"></div>
          <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-white"></div>
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-white"></div>

          {/* Scanner line - use CSS animation instead */}
          <div className="absolute left-0 right-0 h-1 bg-blue-500 z-10 animate-scannerLine"></div>
        </div>

        {/* Scan instruction text */}
        <p className="text-white mt-8 font-medium">
          Align barcode within the frame to scan
        </p>
      </div>
    </div>
  );
};

export default ScannerOverlay;
