import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

interface ScanSuccessIndicatorProps {
  barcode: string;
}

/**
 * A temporary UI component that shows a successful scan notification
 * Appears in the center of the screen with a green background
 * Displays the scanned barcode and a success checkmark
 *
 * This component is designed to be used with AnimatePresence for smooth
 * entrance and exit animations.
 */
export function ScanSuccessIndicator({ barcode }: ScanSuccessIndicatorProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="bg-green-100 border border-green-300 text-green-800 px-6 py-4 rounded-lg shadow-lg max-w-[90%]"
      >
        <div className="flex items-center gap-2">
          <CheckCircle className="text-green-600" size={24} />
          <div>
            <p className="font-semibold">Scan Successful</p>
            <p className="font-mono text-sm truncate" title={barcode}>
              {barcode}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
