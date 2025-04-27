"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";

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
  if (!result) {
    return null;
  }

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
