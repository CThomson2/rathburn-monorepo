"use client";

import { useState } from "react";
import AlertsWidget, { Alert } from "./alerts-widget";

// This is a client component wrapper for the AlertsWidget
// It handles the interactive elements on the client side
export default function AlertsClient({ alerts }: { alerts: Alert[] }) {
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  const handleOrderClick = (alert: Alert) => {
    setSelectedAlert(alert);
    console.log("Order clicked for:", alert.name);
    // Here you would typically open a modal or navigate to an order form
  };

  // Pass the alerts to the AlertsWidget
  return <AlertsWidget alerts={alerts} onOrderClick={handleOrderClick} />;
}
