"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Printer } from "lucide-react";
import { useRouter } from "next/navigation";
import { getPurchaseOrderLinesForLabels } from "@/app/actions/label-generation";
import { useState, useEffect } from "react";

interface OrderConfirmationProps {
  result: { success: boolean; orderId?: string; message?: string } | null;
  onClose: () => void;
}

/**
 * Displays the result of an order creation process.
 *
 * @param {Object} props - The properties for the component.
 * @param {Object|null} props.result - The result object containing success status, orderId, and message. If null, nothing is rendered.
 * @param {boolean} props.result.success - Indicates if the order was created successfully.
 * @param {string} [props.result.orderId] - The ID of the created order, present if the creation was successful.
 * @param {string} [props.result.message] - An optional message providing additional context, especially in case of failure.
 * @param {Function} props.onClose - Callback function triggered when the user decides to close the confirmation.
 *
 * @returns {JSX.Element|null} The rendered Order Confirmation component or null if no result is provided.
 */
export function OrderConfirmation({
  result,
  onClose,
}: OrderConfirmationProps): JSX.Element | null {
  const router = useRouter();
  const [labelData, setLabelData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch purchase order lines with pending labels
  useEffect(() => {
    const fetchLabelData = async () => {
      if (result?.success && result.orderId) {
        try {
          setIsLoading(true);
          const data = await getPurchaseOrderLinesForLabels(result.orderId);
          setLabelData(data);
        } catch (error) {
          console.error("Error fetching label data:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchLabelData();
  }, [result]);

  if (!result) {
    return null;
  }

  // Generate and open barcode labels in a new tab
  const generateBarcodeLabels = (polId: string) => {
    const url = `/api/barcodes/drum-labels/${polId}`;
    window.open(url, "_blank");
  };

  return (
    <div className="flex flex-col items-center justify-center py-8">
      {result.success ? (
        <>
          <div className="rounded-full bg-green-100 p-3 mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h3 className="text-xl font-medium text-green-700 mb-2">
            Order Created Successfully
          </h3>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-6 max-w-md">
            Your purchase order has been created and is now being processed.
            {result.orderId && (
              <span className="block mt-2 font-medium">
                Order ID: {result.orderId}
              </span>
            )}
          </p>

          {/* Label Generation Section */}
          {labelData.length > 0 && (
            <div className="w-full max-w-lg mt-4 mb-6">
              <h4 className="text-md font-medium mb-2">
                Generate Barcode Labels
              </h4>
              <div className="border rounded-md divide-y">
                {labelData.map((item) => (
                  <div
                    key={item.purchaseOrderLineId}
                    className="p-3 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">{item.materialName}</p>
                      <p className="text-sm text-gray-500">
                        {item.quantity} drums from {item.supplierName}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() =>
                        generateBarcodeLabels(item.purchaseOrderLineId)
                      }
                      className="flex items-center gap-1"
                    >
                      <Printer className="h-4 w-4" />
                      Print Labels
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isLoading && (
            <p className="text-sm text-gray-500 mb-4">Loading label data...</p>
          )}
        </>
      ) : (
        <>
          <div className="rounded-full bg-red-100 p-3 mb-4">
            <XCircle className="h-12 w-12 text-red-600" />
          </div>
          <h3 className="text-xl font-medium text-red-700 mb-2">
            Order Creation Failed
          </h3>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-6 max-w-md">
            {result.message ||
              "There was an error creating your order. Please try again."}
          </p>
        </>
      )}

      <div className="flex gap-4">
        <Button onClick={onClose}>
          {result.success ? "Close" : "Try Again"}
        </Button>
      </div>
    </div>
  );
}
