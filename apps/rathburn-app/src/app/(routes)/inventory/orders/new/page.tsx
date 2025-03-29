/**
 * Order Creation Page Component
 *
 * Handles the creation of new inventory orders through a form interface.
 * Once an order is created successfully, displays a barcode label for printing.
 *
 * Flow:
 * 1. Shows order creation form initially
 * 2. On successful submission, hides form and shows barcode
 * 3. Handles API communication with /api/orders endpoint
 */

"use client";

import { useState } from "react";
import { StockOrderFormValues } from "@/types/models";
import { CreateForm, DrumLabel } from "@/features/orders/components";
import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2 } from "lucide-react";

interface OrderResponse {
  order_id: number;
  supplier_id: number;
  po_number: string;
  date_ordered: string;
}

// Update interface to match what DrumLabel expects
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

/**
 * OrderCreationPage component for handling the creation of new inventory orders.
 *
 * This component manages the state for order creation, including form submission,
 * error handling, and displaying the created order details with a barcode label.
 *
 * @returns {JSX.Element} The rendered OrderCreationPage component
 */
function OrderCreationPage(): JSX.Element {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [orderDetails, setOrderDetails] = useState<OrderDetailResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPrinted, setIsPrinted] = useState<number[]>([]);
  const [suppliers, setSuppliers] = useState<Record<number, string>>({});

  /**
   * Handles the creation of a new order by submitting form data to the API.
   *
   * @param {StockOrderFormValues} formValues - The form values containing order details
   * @returns {Promise<void>}
   */
  const handleCreateOrder = async (
    formValues: StockOrderFormValues
  ): Promise<void> => {
    try {
      setError(null);
      setIsGenerating(true);

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formValues),
      });

      const data = await res.json();
      console.log("API Response:", data); // Debug: log the API response

      if (!res.ok) {
        throw new Error(data.error || "Failed to create order");
      }

      if (data.success) {
        setOrders((prevOrders) => [data.order, ...prevOrders]);

        // Store the supplier name by supplier_id for later retrieval
        if (data.supplier) {
          setSuppliers((prev) => ({
            ...prev,
            [data.supplier.supplier_id]: data.supplier.supplier_name,
          }));
        }

        // The API returns data.orderDetails which already has the structure we need
        const newOrderDetails = data.orderDetails || [];
        console.log("Order details:", newOrderDetails); // Debug: log the order details

        setOrderDetails((prevDetails) => [...newOrderDetails, ...prevDetails]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Order creation failed:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Sets the error state with the provided error message.
   *
   * @param {string} error - The error message to be set
   */
  const handleError = (error: string) => {
    setError(error);
  };

  /**
   * Handles the printing of a barcode label.
   * Updates the printed state for the specific detail_id.
   *
   * @param {number} detail_id - The ID of the detail that was printed
   */
  const handlePrinted = (detail_id: number) => {
    setIsPrinted((prev) => [...prev, detail_id]);
  };

  return (
    <div className="min-h-screen flex">
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
          ERROR: {error}
        </div>
      )}

      <div className="flex flex-1">
        {/* Left section - Order Form */}
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="w-full max-w-[500px]">
            <CreateForm onOrderCreated={handleCreateOrder} />
          </div>
        </div>

        {/* Right section - Always visible with bg-slate-700 */}
        <div className="flex-1 bg-slate-700 min-w-[500px] mr-4">
          <div className="h-full flex flex-col">
            <h2 className="text-2xl font-bold p-6 text-white border-b border-slate-600">
              Barcode Labels
            </h2>

            <div className="flex-1 p-6 overflow-auto">
              <div className="space-y-6">
                {isGenerating && (
                  <div className="bg-slate-800 rounded-lg shadow-xl p-8">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                      <p className="text-slate-400">
                        Generating Barcode Labels...
                      </p>
                    </div>
                  </div>
                )}

                {orders.map((order, index) => (
                  <div
                    key={order.order_id}
                    className={cn(
                      "transition-all duration-500",
                      "opacity-0 translate-x-4",
                      "animate-[enter_0.5s_ease-out_forwards]"
                    )}
                    style={{
                      animationDelay: `${index * 100}ms`,
                    }}
                  >
                    <div className="bg-slate-800 rounded-lg shadow-xl overflow-hidden">
                      {/* Order Details and Actions */}
                      <div className="p-8 space-y-6">
                        {orderDetails
                          .filter(
                            (detail) =>
                              detail.detail.order_id === order.order_id
                          )
                          .map((detail) => (
                            <DrumLabel
                              key={detail.detail.detail_id}
                              orderDetail={detail}
                              onError={handleError}
                              onPrinted={handlePrinted}
                              supplierName={suppliers[order.supplier_id] || ""}
                              isPrinted={isPrinted.includes(
                                detail.detail.detail_id
                              )}
                            />
                          ))}
                      </div>
                    </div>
                  </div>
                ))}

                {!isGenerating && orders.length === 0 && (
                  <div className="text-center text-slate-400 py-12">
                    No orders created yet. Use the form to create a new order.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderCreationPage;
