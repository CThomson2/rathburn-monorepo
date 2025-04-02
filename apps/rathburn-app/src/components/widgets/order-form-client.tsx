"use client";

import { useState } from "react";
import OrderFormWidget from "./order-form-widget";

// This is a client component wrapper for the OrderFormWidget
// It handles the form submission logic on the client side
export default function OrderFormClient() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Here you would typically send the data to your API
      console.log("Submitting order:", formData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // For now, we'll just log the data
      console.log("Order submitted successfully");
    } catch (error) {
      console.error("Error submitting order:", error);
      setSubmitError("Failed to submit order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return <OrderFormWidget onSubmit={handleSubmit} />;
}
