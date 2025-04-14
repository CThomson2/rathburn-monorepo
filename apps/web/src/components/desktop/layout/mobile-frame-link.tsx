"use client";

import Link from "next/link";
import { Button } from "@/components/core/ui/button";
import { Smartphone, Tablet } from "lucide-react";

interface MobileFrameLinkProps {
  mobilePath?: string;
  className?: string;
}

/**
 * Component that adds links to view mobile pages in a device frame
 * Only shows in development mode
 */
export function MobileFrameLink({
  mobilePath = "/mobile",
  className,
}: MobileFrameLinkProps) {
  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button variant="outline" size="sm" asChild>
        <Link href={`${mobilePath}?frame=true`} target="_blank">
          <Smartphone className="h-4 w-4 mr-1" />
          Mobile View
        </Link>
      </Button>
    </div>
  );
}
