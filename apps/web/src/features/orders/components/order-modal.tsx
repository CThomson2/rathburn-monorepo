"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { OrdersView } from "@/features/orders/types";
import OrderPreview from "./order-preview";
import OrderForm from "./order-form";
import OrderConfirmation from "./order-confirmation";

export type OrderModalStep = "preview" | "create" | "confirmation";

interface OrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function OrderModal({ open, onOpenChange }: OrderModalProps) {
  const [step, setStep] = useState<OrderModalStep>("preview");
  const [orderResult, setOrderResult] = useState<{
    success: boolean;
    orderId?: string;
    message?: string;
  } | null>(null);

  const handleStepChange = useCallback((newStep: OrderModalStep) => {
    setStep(newStep);
  }, []);

  const handleOrderCreated = useCallback(
    (result: { success: boolean; orderId?: string; message?: string }) => {
      setOrderResult(result);
      if (result.success) {
        setStep("confirmation");
      }
    },
    []
  );

  // Reset the state when closing the modal
  const handleOpenChange = useCallback(
    (open: boolean) => {
      onOpenChange(open);
      if (!open) {
        setTimeout(() => {
          setStep("preview");
          setOrderResult(null);
        }, 300); // Delay the reset until after the dialog has closed
      }
    },
    [onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {step === "preview" && "Recent Orders"}
            {step === "create" && "Create New Order"}
            {step === "confirmation" && "Order Confirmation"}
          </DialogTitle>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex justify-center mb-6 mt-2">
          <div className="flex items-center gap-2">
            {["preview", "create", "confirmation"].map((s) => (
              <div
                key={s}
                className={cn(
                  "h-2 w-2 rounded-full transition-all duration-200",
                  step === s ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"
                )}
              />
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[300px]">
          {step === "preview" && (
            <OrderPreview onCreateOrder={() => setStep("create")} />
          )}
          {step === "create" && (
            <OrderForm onOrderCreated={handleOrderCreated} />
          )}
          {step === "confirmation" && (
            <OrderConfirmation
              result={orderResult}
              onClose={() => handleOpenChange(false)}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-4">
          {step !== "preview" && (
            <Button
              variant="outline"
              onClick={() => setStep(step === "create" ? "preview" : "create")}
              disabled={step === "confirmation"}
            >
              Back
            </Button>
          )}

          {step === "preview" && (
            <Button onClick={() => setStep("create")} className="ml-auto">
              Create New Order
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
