"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Printer } from "lucide-react";
import { useRouter } from "next/navigation";
import { getPurchaseOrderLinesForLabels } from "@/app/actions/label-generation";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";

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

  console.log("[COMPONENT] OrderConfirmation initialized with result:", result);

  // Fetch purchase order lines with pending labels
  useEffect(() => {
    const fetchLabelData = async () => {
      console.log("[COMPONENT] Starting fetchLabelData");
      console.log("[COMPONENT] Result data:");
      console.log("[COMPONENT] orderId:", result?.orderId);
      console.log("[COMPONENT] success:", result?.success);
      console.log("[COMPONENT] message:", result?.message);

      if (result?.success && result.orderId) {
        try {
          setIsLoading(true);
          console.log(
            "[COMPONENT] Calling getPurchaseOrderLinesForLabels with orderId:",
            result.orderId
          );
          const data = await getPurchaseOrderLinesForLabels(result.orderId);
          console.log("[COMPONENT] Received label data:", data);
          setLabelData(data);
        } catch (error) {
          console.error("[ERROR] Error fetching label data:", error);
          toast.error("Failed to fetch label data");
        } finally {
          setIsLoading(false);
          console.log("[COMPONENT] Finished loading label data");
        }
      }
    };

    fetchLabelData();
  }, [result]);

  if (!result) {
    console.log("[COMPONENT] No result provided, returning null");
    return null;
  }

  /**
   * Generates barcode labels by calling the API endpoint and opens the resulting PDF in a new tab.
   * Handles potential API errors and pop-up blocker issues.
   *
   * @param {string} polId - The purchase order line ID.
   * @returns {Promise<void>} A promise that resolves when the operation is complete or an error occurs.
   */
  const generateBarcodeLabels = async (polId: string): Promise<void> => {
    // TODO: Consider adding a loading state specific to this button/action
    // e.g., const [isGenerating, setIsGenerating] = useState(false);
    try {
      console.log("[COMPONENT] Generating barcode labels for polId:", polId);

      // Corrected API endpoint to match the actual route file path
      // The previous path '/api/scanners/...' was incorrect.
      const response = await fetch(`/api/barcodes/drum-labels/${polId}`);

      if (!response.ok) {
        // Attempt to get more error details from the response body
        let errorDetails = response.statusText;
        try {
          const errorData = await response.json();
          errorDetails = errorData.error || errorDetails;
        } catch (e) {
          // Ignore if response body is not JSON or empty
        }
        console.error(
          `[COMPONENT] API error ${response.status}: ${errorDetails}`
        );
        throw new Error(`API error: ${errorDetails}`);
      }

      const data = await response.json();

      // Check if the API call was successful and returned the expected filePath
      if (!data.success || !data.filePath) {
        console.error(
          "[COMPONENT] API response indicates failure or missing filePath:",
          data
        );
        throw new Error(
          data.error || "Failed to generate PDF: Invalid API response"
        );
      }

      console.log(
        "[COMPONENT] PDF generated successfully. Opening path:",
        data.filePath
      );

      // Open the PDF file path in a new tab.
      // The browser will request this path (e.g., /labels/barcodes-123.pdf),
      // and the Next.js server will serve the static file from the `public` directory.
      // The browser then handles displaying or downloading the PDF.
      const pdfWindow = window.open(data.filePath, "_blank");

      // Check if the new window/tab was blocked by a pop-up blocker
      if (!pdfWindow) {
        console.warn(
          "[COMPONENT] Pop-up blocked. Could not open PDF in new tab."
        );
        toast.info(
          "Pop-up blocked. Please allow pop-ups for this site to view the PDF."
        );
        // Optionally, provide a direct link for the user to click manually
        // e.g., by setting state: setManualPdfLink(data.filePath)
      }
    } catch (error) {
      console.error("[COMPONENT] Failed to generate barcode labels:", error);
      // Display a user-friendly error message
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      toast.error(`Failed to generate barcode labels: ${errorMessage}`);
    } finally {
      // TODO: Reset the loading state if implemented
      // e.g., setIsGenerating(false);
    }
  };

  console.log(
    "[COMPONENT] Rendering OrderConfirmation with success:",
    result.success
  );

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
        <Button
          onClick={() => {
            console.log("[COMPONENT] Close button clicked");
            onClose();
          }}
        >
          {result.success ? "Close" : "Try Again"}
        </Button>
      </div>
    </div>
  );
}
