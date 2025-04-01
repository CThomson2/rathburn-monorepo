"use client";

import { useState, useEffect, Fragment } from "react"; // should imports be unused?? Sidebar uses state management for togglng
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { useSidebar } from "@/hooks/use-sidebar";

interface SidebarProps {
  className?: string;
  isAuthLayout?: boolean;
}

interface NavLink {
  href: string;
  label: string;
  level: number;
  disabled?: boolean;
  highlight?: boolean;
  recentlyUpdated?: boolean;
}

// New component for navigation links with update indicator
function NavLinkItem({ link, isActive }: { link: NavLink; isActive: boolean }) {
  return (
    <Link
      href={link.href}
      className={cn(
        "flex items-center gap-2 py-2 px-3 rounded-md transition-colors",
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-accent",
        link.disabled && "opacity-50 pointer-events-none",
        link.highlight && "text-primary"
      )}
    >
      {link.recentlyUpdated && (
        <span
          className="h-2 w-2 rounded-full bg-green-500 animate-pulse"
          aria-hidden="true"
        />
      )}
      <span className={cn(link.recentlyUpdated && "font-bold")}>
        {link.label}
      </span>
    </Link>
  );
}

export function Sidebar({ className, isAuthLayout = false }: SidebarProps) {
  const pathname = usePathname();
  const { isOpen } = useSidebar();

  // Define navigation links based on page.tsx files with proper nesting
  const navLinks: NavLink[] = [
    {
      href: "/dashboard",
      label: "Dashboards",
      level: 0,
      recentlyUpdated: true,
    },
    // { href: "/overview", label: "Overview", level: 0 },
    {
      href: "/dashboard/admin",
      label: "Admin",
      level: 1,
    },
    { href: "/inventory/production", label: "Production", level: 1 },
    {
      href: "/inventory/management",
      label: "Manage",
      level: 1,
    },
    {
      href: "/inventory/orders/new",
      label: "New Order",
      level: 0,
    },
    {
      href: "inventory/drums",
      label: "Drum Stock",
      level: 0,
      recentlyUpdated: true,
    },
    // {
    //   href: "/data/production",
    //   label: "Production Data",
    //   level: 0,
    // },
    {
      href: "/mobile",
      label: "Mobile App",
      level: 0,
      recentlyUpdated: true,
    },
    // {
    //   href: "/docs",
    //   label: "Documentation",
    //   level: 0,
    //   recentlyUpdated: true,
    // },
    // {
    //   href: "/docs/database",
    //   label: "System Architecture",
    //   level: 1,
    //   recentlyUpdated: true,
    // },
    // {
    //   href: "/docs/training",
    //   label: "Training Materials",
    //   level: 1,
    //   recentlyUpdated: true,
    // },
    // {
    //   href: "/docs/software",
    //   label: "Software Documentation",
    //   level: 1,
    //   recentlyUpdated: true,
    // },
    // {
    //   href: "/docs/software/api",
    //   label: "API Route Documentation",
    //   level: 2,
    //   recentlyUpdated: false,
    // },
    // {
    //   href: "/docs/software/prisma-orm",
    //   label: "Prisma ORM Documentation",
    //   level: 2,
    //   recentlyUpdated: false,
    // },
    // { href: "/raw-materials", label: "Raw Materials", level: 0 },
  ];

  return (
    <div
      className={cn(
        "w-64 bg-background border-r h-screen fixed left-0 top-0 pt-16 transition-transform duration-300 z-50",
        !isOpen && "-translate-x-full",
        className
      )}
    >
      <div className="px-4 py-6">
        <h2 className="text-lg font-semibold mb-4">Navigation</h2>
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {navLinks
              .filter((link) => !isAuthLayout || link.level === 0)
              .map((link, index, filteredLinks) => {
                const isActive = pathname === link.href;
                const indent = link.level * 0.5;
                const isLevel0 = link.level === 0;
                const prevLink = index > 0 ? filteredLinks[index - 1] : null;
                const needsDivider = isLevel0;

                return (
                  <Fragment key={link.href}>
                    {needsDivider && index !== 0 && (
                      <li className="border-t border-gray-200 dark:border-gray-700 my-2"></li>
                    )}
                    <li style={{ paddingLeft: `${indent}rem` }}>
                      <NavLinkItem link={link} isActive={isActive} />
                      {link.level == 2 && <Plus className="w-4 h-4" />}
                    </li>
                  </Fragment>
                );
              })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
