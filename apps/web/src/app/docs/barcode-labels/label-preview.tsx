"use client";

import React, { useState } from "react";
import { FileDown, Loader2, ChevronDown, ChevronUp } from "lucide-react";

interface OrderDetailResponse {
  detail: {
    detail_id: number;
    order_id: number;
    material_id: number;
    material_name: string;
    drum_quantity: number;
    status: string;
  };
  material: string;
  drum_quantity: number;
  drums: any[];
}

interface DrumLabelProps {
  orderDetail: OrderDetailResponse;
  onError: (error: string) => void;
  onPrinted: (detail_id: number) => void;
  supplierName: string;
  isPrinted: boolean;
}

/**
 * DrumLabel component displays a generated PDF label for a given order detail.
 *
 * Handles generating the PDF, displaying the label, and handling cancelation of the order.
 *
 * @param {OrderDetailResponse} orderDetail - The order detail data
 * @param {(error: string) => void} onError - The error callback when generating PDF fails
 * @param {(detail_id: number) => void} onPrinted - The callback when PDF generation is successful
 * @param {string} supplierName - The supplier name for the order
 * @param {boolean} isPrinted - Whether the labels have been printed or not
 */
export const DrumLabel: React.FC<DrumLabelProps> = ({
  orderDetail,
  onError,
  onPrinted,
  supplierName,
  isPrinted,
}) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="space-y-4">
      {/* Success Banner with Order ID and Toggle Button */}
      <div
        className="bg-emerald-900/50 p-4 rounded-lg flex justify-between items-center cursor-pointer hover:bg-emerald-900/60 transition-colors"
        onClick={() => isPrinted && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 ${
                isPrinted ? "text-emerald-500" : "text-white"
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
              <span>
                {isPrinted
                  ? "Labels Generated Successfully"
                  : "Order Created Successfully"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">Order ID</span>
            <span className="text-lg font-semibold text-white">
              {detail_id}
            </span>
          </div>
        </div>
        {isPrinted && (
          <button className="text-slate-400 hover:text-white transition-colors">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        )}
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <>
          {/* Order Details Section */}
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-8">
              <div className="space-y-1">
                <p className="text-slate-400 text-sm">Supplier</p>
                <p className="text-xl font-semibold text-white">
                  {supplierName}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-400 text-sm">Material</p>
                <p className="text-xl font-semibold text-white">{material}</p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-400 text-sm">Drum Quantity</p>
                <p className="text-xl font-semibold text-white">
                  {drum_quantity}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons Section */}
          <div className="grid grid-cols-3 gap-4">
            {/* Generate PDF Button */}
            <button
              onClick={handleGeneratePDF}
              disabled={isGenerating}
              className="group flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg transition-all duration-200 hover:translate-y-[-2px] active:translate-y-0 shadow-lg hover:shadow-blue-500/25"
            >
              {isGenerating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <FileDown className="w-5 h-5 transition-transform group-hover:scale-110" />
              )}
              <span className="font-medium">
                {isGenerating ? "Generating..." : "Download Labels"}
              </span>
            </button>

            {/* Edit Order Button */}
            <button
              onClick={handleEditOrder}
              className="group flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2.5 rounded-lg transition-all duration-200 hover:translate-y-[-2px] active:translate-y-0 shadow-lg hover:shadow-amber-500/25"
            >
              <span className="font-medium">Edit Order</span>
            </button>

            {/* Cancel Order Button */}
            <button
              onClick={handleCancelOrder}
              className="group flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2.5 rounded-lg transition-all duration-200 hover:translate-y-[-2px] active:translate-y-0 shadow-lg hover:shadow-red-500/25"
            >
              <span className="font-medium">Cancel Order</span>
            </button>
          </div>
        </>
      )}

      {/* Cancel Confirmation Modal would go here */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          {/* Modal content */}
        </div>
      )}
    </div>
  );
};
