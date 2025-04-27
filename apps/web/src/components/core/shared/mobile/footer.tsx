"use client";

import Link from "next/link";
import { Home, Scan, Package, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

/**
 * Mobile navigation footer with quick access icons
 */
export function MobileFooter() {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Home",
      href: "/mobile",
      icon: Home,
    },
    {
      label: "Scan",
      href: "/mobile/scan",
      icon: Scan,
    },
    {
      label: "Inventory",
      href: "/mobile/inventory",
      icon: Package,
    },
    {
      label: "Profile",
      href: "/mobile/profile",
      icon: User,
    },
  ];

  return (
    <footer className="sticky bottom-0 z-50 w-full border-t bg-background">
      <nav className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5 mb-1" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </footer>
  );
}
