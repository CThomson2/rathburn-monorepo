"use client";

import { ThemeToggle } from "@/components/core/ui/theme-toggle";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Database } from "lucide-react";
import { Button } from "@/components/core/ui/button";
import { cn } from "@/lib/utils";

interface HeaderControlsProps {
  databasePath?: string;
  className?: string;
}

export function HeaderControls({
  databasePath = "/database",
  className,
}: HeaderControlsProps) {
  const pathname = usePathname();
  const isMobileRoute = pathname.includes("/mobile");

  // Don't render on mobile routes
  if (isMobileRoute) {
    return null;
  }

  // Only show database button in development
  // const showDatabaseBtn = process.env.NODE_ENV === "development";

  return (
    <div
      className={cn(
        "fixed top-4 z-[100] left-1/2 -translate-x-1/2 flex items-center justify-center gap-2",
        className
      )}
    >
      <ThemeToggle />

      {/* {showDatabaseBtn && (*/}
      <Button
        variant="outline"
        size="icon"
        asChild
        className="relative h-10 w-10 bg-background border-border shadow-sm hover:shadow-md transition-shadow"
      >
        <Link href={databasePath} target="_blank">
          <Database className="h-[1.2rem] w-[1.2rem] transition-transform hover:scale-110" />
          <span className="sr-only">Database</span>
        </Link>
      </Button>
    </div>
  );
}

export default HeaderControls;
