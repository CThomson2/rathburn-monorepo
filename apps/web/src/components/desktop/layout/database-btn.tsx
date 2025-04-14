"use client";

import Link from "next/link";
import { Button } from "@/components/core/ui/button";
import { Database } from "lucide-react";
import { cn } from "@/lib/utils";

interface DatabaseBtnProps {
  databasePath?: string;
  className?: string;
}

/**
 * Component that adds a link to view the database in Supabase
 * Only shows in development mode
 */
export function DatabaseBtn({
  databasePath = "/database",
  className,
}: DatabaseBtnProps) {
  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      asChild
      className={cn("group gap-2 hover:bg-transparent", className)}
    >
      <Link href={`${databasePath}`} target="_blank">
        <Database className="h-4 w-4 transition-transform group-hover:scale-110" />
        <span className="relative">
          Database
          <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-foreground transition-all duration-300 group-hover:w-full" />
        </span>
      </Link>
    </Button>
  );
}

export default DatabaseBtn;
