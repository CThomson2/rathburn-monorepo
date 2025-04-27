"use client";

import { useState } from "react";
import OrderModal from "./order-modal";

interface OrderModalTriggerProps {
  children: React.ReactNode;
  actionType: "place_order" | "log_details" | "print_labels";
}

export default function OrderModalTrigger({
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
