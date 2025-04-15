"use client";

import { ThemeToggle } from "@/components/core/ui/theme-toggle";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Database, Target } from "lucide-react";
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

  // Sync the local state with window's workflow cards state
  useEffect(() => {
    // Use a simple window event listener approach
    const handleWindowClick = () => {
      // Check the global state after a small delay to ensure it's updated
      setTimeout(() => {
        // Access the current state through the window method
        const isOpen =
          document.querySelector('[data-workflow-menu="true"]') !== null;
        setIsWorkflowMenuOpen(isOpen);
      }, 0);
    };

    // Listen for clicks anywhere on the page
    window.addEventListener("click", handleWindowClick);

    // Set up a MutationObserver to detect when workflow cards are toggled
    const observer = new MutationObserver(() => {
      const isOpen =
        document.querySelector('[data-workflow-menu="true"]') !== null;
      setIsWorkflowMenuOpen(isOpen);
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("click", handleWindowClick);
      observer.disconnect();
    };
  }, []);

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

      {/* Action Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={handleWorkflowToggle}
        className={`relative h-12 w-12 rounded-full bg-background dark:bg-gray-800 border-border dark:border-gray-700 shadow-sm hover:shadow-md hover:scale-115 transition-all duration-300 ease-in-out ${
          isWorkflowMenuOpen
            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
            : ""
        }`}
      >
        <Target className="h-[1.5rem] w-[1.5rem] transition-transform duration-300 ease-in-out hover:scale-115 text-foreground dark:text-gray-300" />
        <span className="sr-only">Workflows</span>
      </Button>

      <Button
        variant="outline"
        size="icon"
        asChild
        className="relative h-10 overflow-hidden group bg-background dark:bg-gray-800 border-border dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 ease-in-out"
      >
        <Link
          href={databasePath}
          target="_blank"
          className="flex items-center justify-start px-2 gap-2"
        >
          <Database className="h-[1.2rem] w-[1.2rem] transition-transform group-hover:scale-110" />
          <span className="opacity-0 absolute left-10 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap font-medium">
            DATABASE
          </span>
          <span className="sr-only">Database</span>
        </Link>
      </Button>
    </div>
  );
}

export default HeaderControls;
