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
      className={cn(
        "group hover:bg-transparent dark:hover:bg-transparent overflow-hidden transition-all duration-300 ease-in-out",
        className
      )}
    >
      <Link
        href={`${databasePath}`}
        target="_blank"
        className="flex items-center justify-center group-hover:justify-between gap-2 w-full px-3 transition-all duration-300 ease-in-out"
      >
        <Database className="h-4 w-4 text-foreground dark:text-slate-200 transition-transform group-hover:scale-110" />
        <span className="w-0 opacity-0 group-hover:w-auto group-hover:opacity-100 text-foreground dark:text-slate-200 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden">
          DATABASE
        </span>
      </Link>
    </Button>
  );
}

export default DatabaseBtn;
