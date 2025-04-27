"use client";

import DrumStatusListener from "./DrumStatusListener";
import OrderUpdatesListener from "./OrderUpdatesListener";

/**
 * LiveUpdatesPanel combines real-time monitoring components
 *
 * This component brings together different real-time listeners to provide
 * a comprehensive dashboard for monitoring drum and order updates in real-time.
 */
export default function LiveUpdatesPanel() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Live Updates</h2>
      <p className="text-muted-foreground">
        Monitor real-time drum status changes and order updates as they happen.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <DrumStatusListener />
        <OrderUpdatesListener />
      </div>
    </div>
  );
}
