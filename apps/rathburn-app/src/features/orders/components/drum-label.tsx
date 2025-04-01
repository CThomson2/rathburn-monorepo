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

export const DrumLabel: React.FC<DrumLabelProps> = ({
  orderDetail,
  onError,
  onPrinted,
  supplierName,
  isPrinted,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  /**
   * Calls the backend route to fetch a generated PDF for this order.
   * We open the PDF in a new tab once we get the Blob.
   */
  const handleGeneratePDF = async () => {
    try {
      setIsGenerating(true);
      onPrinted(orderDetail.detail.detail_id);

      // Extract detail_id from the nested structure
      const detail_id = orderDetail.detail.detail_id;

      // Use fetch directly for binary data
      const response = await fetch(`/api/barcodes/stock-drums/${detail_id}`, {
        method: "GET",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      // Get the blob directly from the response
      const pdfBlob = await response.blob();

      // Create a URL for the blob
      const pdfUrl = URL.createObjectURL(pdfBlob);

      // Open the PDF in a new tab
      window.open(pdfUrl, "_blank");

      // Clean up the blob URL after some time
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 30000);

      // Collapse the component after successful print
      setIsExpanded(false);
    } catch (error) {
      console.error("Error generating barcode PDF:", error);
      onError(
        error instanceof Error
          ? error.message
          : "Failed to generate barcode PDF"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditOrder = () => {
    // TODO: Implement edit functionality
    console.log("Edit order:", detail_id);
  };

  const handleCancelOrder = () => {
    setShowCancelModal(true);
  };

  // Extract necessary fields from the nested structure
  const { detail, material, drum_quantity } = orderDetail;
  const { detail_id } = detail;

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
