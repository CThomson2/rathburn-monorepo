"use client";

import { usePathname } from "next/navigation";

export function RouteAwareControls() {
  const pathname = usePathname();
  const isMobileRoute = pathname.includes("/mobile");

  if (isMobileRoute) {
    return null;
  }

  // This component no longer has any controls to render
  return null;
}
