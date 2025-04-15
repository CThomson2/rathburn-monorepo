"use client";

import { ThemeToggle } from "@/components/core/ui/theme-toggle";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Database, Workflow, Grid3x3 } from "lucide-react";
import { Button } from "@/components/core/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface HeaderControlsProps {
  databasePath?: string;
  className?: string;
}

declare global {
  interface Window {
    toggleWorkflowCards?: () => void;
  }
}

export function HeaderControls({
  databasePath = "/database",
  className,
}: HeaderControlsProps) {
  const pathname = usePathname();
  const isMobileRoute = pathname.includes("/mobile");
  const [isWorkflowMenuOpen, setIsWorkflowMenuOpen] = useState(false);

  // Don't render on mobile routes
  if (isMobileRoute) {
    return null;
  }

  const handleWorkflowToggle = () => {
    if (window.toggleWorkflowCards) {
      window.toggleWorkflowCards();
      setIsWorkflowMenuOpen(!isWorkflowMenuOpen);
    }
  };

  return (
    <div
      className={cn(
        "fixed top-4 z-[100] left-1/2 -translate-x-1/2 flex items-center justify-center gap-2",
        className
      )}
    >
      <ThemeToggle />

      <Button
        variant="outline"
        size="icon"
        onClick={handleWorkflowToggle}
        className={`relative h-10 w-10 bg-background border-border shadow-sm hover:shadow-md transition-shadow ${
          isWorkflowMenuOpen ? "bg-blue-100 text-blue-700" : ""
        }`}
      >
        <Grid3x3 className="h-[1.2rem] w-[1.2rem] transition-transform hover:scale-110" />
        <span className="sr-only">Workflows</span>
      </Button>

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
