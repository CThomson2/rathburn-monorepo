import React from "react";
import { X } from "lucide-react";
import { motion } from "framer-motion";

interface MaterialDetailProps {
  material: {
    id: string;
    name: string;
    casNumber: string;
    color: string;
    scans: number;
  };
  onClose: () => void;
}

const MaterialDetail: React.FC<MaterialDetailProps> = ({
  material,
  onClose,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold">{material.name}</h2>
            <p className="text-sm text-gray-500">CAS: {material.casNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-gray-500">
              Your Scans
            </span>
            <span className="text-lg font-bold">{material.scans}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${Math.min(material.scans * 10, 100)}%` }}
            ></div>
          </div>
          <p className="mt-2 text-xs text-gray-500 text-right">
            {material.scans < 10
              ? `${10 - material.scans} more scans until next level`
              : "Max level reached!"}
          </p>
        </div>

        <button className="mt-6 w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
          View in Pokédex
        </button>
      </motion.div>
    </motion.div>
  );
};

export default MaterialDetail;
