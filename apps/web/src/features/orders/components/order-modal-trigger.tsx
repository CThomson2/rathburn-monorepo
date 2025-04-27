"use client";

import { useState } from "react";
import { OrderModal } from "./order-modal";

interface OrderModalTriggerProps {
  children: React.ReactNode;
  actionType: "place_order" | "log_details" | "print_labels";
}

/**
 * A button that triggers an order modal when clicked.
 *
 * The `actionType` prop determines what action the modal should perform.
 * Currently, only "place_order" opens the modal.
 *
 * The `children` prop is the content of the button.
 *
 * @example
 * <OrderModalTrigger actionType="place_order">Place Order</OrderModalTrigger>
 *
 * @param {Object} props
 * @prop {React.ReactNode} children The content of the button.
 * @prop {"place_order" | "log_details" | "print_labels"} actionType The action to perform when the modal is opened.
 */
export function OrderModalTrigger({
  children,
  actionType,
}: OrderModalTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsOpen(true);
  };

  // Only "place_order" action type should open the modal for now
  if (actionType !== "place_order") {
    return <>{children}</>;
  }

  return (
    <>
      <div onClick={handleClick}>{children}</div>
      <OrderModal open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}
