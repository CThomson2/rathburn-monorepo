"use client";

import { useState } from "react";
import { OrderModal } from "../../features/orders/components/order-modal";
import { ProductionModal } from "../../features/production/components/production-modal";
import { SidebarItemAction } from "@/types/sidebar";

interface OrderModalTriggerProps {
  children: React.ReactNode;
  actionType: SidebarItemAction;
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
export function ModalTrigger({ children, actionType }: OrderModalTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsOpen(true);
  };

  // Only "place_order" action type should open the modal for now
  switch (actionType) {
    case "place_order":
      return (
        <>
          <div onClick={handleClick}>{children}</div>
          <OrderModal open={isOpen} onOpenChange={setIsOpen} />
        </>
      );
    case "schedule_distillation":
      return (
        <>
          <div onClick={handleClick}>{children}</div>
          <ProductionModal open={isOpen} onOpenChange={setIsOpen} />
        </>
      );
    case "log_details":
    // return <>{children}</>;
    case "print_labels":
    // return <>{children}</>;
    case "manage_production":
    // return <>{children}</>;
    case "transport_stock":
    // return <>{children}</>;
    default:
      return <>{children}</>;
  }
}
