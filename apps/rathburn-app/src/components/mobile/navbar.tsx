"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

/**
 * Mobile navigation component with responsive menu
 */
export function MobileNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4">
        <div className="flex flex-1 items-center justify-between">
          <Link href="/mobile" className="font-semibold">
            Inventory Scanner
          </Link>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="pr-0">
              <div className="px-7">
                <Link
                  href="/mobile"
                  className="flex items-center py-4 text-sm font-medium"
                  onClick={() => setOpen(false)}
                >
                  Home
                </Link>
                <Link
                  href="/mobile/scan"
                  className="flex items-center py-4 text-sm font-medium"
                  onClick={() => setOpen(false)}
                >
                  Scan Items
                </Link>
                <Link
                  href="/mobile/inventory"
                  className="flex items-center py-4 text-sm font-medium"
                  onClick={() => setOpen(false)}
                >
                  Inventory
                </Link>
                <Link
                  href="/mobile/profile"
                  className="flex items-center py-4 text-sm font-medium"
                  onClick={() => setOpen(false)}
                >
                  Profile
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
