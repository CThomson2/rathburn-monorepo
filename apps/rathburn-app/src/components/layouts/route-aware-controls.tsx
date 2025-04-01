"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Menu } from "lucide-react";
import { MobileFrameLink } from "../mobile/mobile-frame-link";

export function RouteAwareControls() {
  const pathname = usePathname();
  const isMobileRoute = pathname.includes("/mobile");

  if (isMobileRoute) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 z-[5001] flex items-center gap-2">
      <ThemeToggle />
      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-md text-gray-400 hover:text-gray-300 bg-gray-800/80 backdrop-blur"
        data-toggle-sidebar
      >
        <span className="sr-only">Toggle sidebar</span>
        <Menu className="h-6 w-6" />
      </button>

      <MobileFrameLink className="ml-2" />
    </div>
  );
}
