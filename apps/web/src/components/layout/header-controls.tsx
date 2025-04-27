"use client";

import { ThemeToggle } from "@/components/ui/theme-toggle";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWorkflow } from "@/context/workflow-context";

interface HeaderControlsProps {
  databasePath?: string;
  className?: string;
}

/**
 * A component that renders a theme toggle and a database button.
 *
 * The theme toggle is always rendered.
 *
 * The database button is only rendered if the current route is not a mobile route.
 * The database button navigates to the database path when clicked.
 *
 * @param databasePath - The path to navigate to when the database button is clicked.
 * @param className - The class name to apply to the component.
 */
export function HeaderControls({
  databasePath = "/database",
  className,
}: HeaderControlsProps) {
  const pathname = usePathname();
  const isMobileRoute = pathname.includes("/mobile");
  const { showWorkflowCards } = useWorkflow();

  // Don't render on mobile routes
  if (isMobileRoute) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <ThemeToggle />

      <Button
        variant="outline"
        size="icon"
        asChild
        className="relative h-9 w-9 bg-background dark:bg-gray-800 border-border dark:border-gray-700 transition-all duration-300 ease-in-out"
      >
        <Link href={databasePath} target="_blank">
          <Database className="h-[1.1rem] w-[1.1rem]" />
          <span className="sr-only">Database</span>
        </Link>
      </Button>
    </div>
  );
}

export default HeaderControls;
