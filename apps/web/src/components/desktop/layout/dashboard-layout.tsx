// @ts-nocheck
"use client";

import { ReactNode, useState } from "react";
import {
  Menu,
  X,
  Bell,
  User,
  Home,
  Package,
  Clipboard,
  Settings,
  Phone,
  LogOut,
  Database,
  BarChart,
  Layers,
  Box,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeaderControls } from "./header/header-controls";
import { signOutAction } from "@/app/actions";
import { Button } from "@/components/core/ui/button";

// TypeScript workaround for React 18 vs React 19 type compatibility issue
// @ts-ignore
const SafeLink = Link;

interface DashboardLayoutProps {
  children: ReactNode;
}

interface NavItem {
  name: string;
  // @ts-ignore - Type compatibility issue between types
  icon: React.ElementType;
  href: string;
}

declare module "lucide-react" {
  // This makes TypeScript treat Lucide icons as valid JSX elements
  export interface LucideProps {
    size?: number | string;
    className?: string;
  }
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { name: "Dashboard", icon: Home, href: "/" },
    { name: "Overview", icon: BarChart, href: "/overview" },
    { name: "Orders", icon: Clipboard, href: "/deliveries" },
    { name: "Drums", icon: Box, href: "/drums" },
    {
      name: "Inventory",
      icon: Package,
      href: "/inventory-dashboard",
    },
    {
      name: "Stock History",
      icon: BarChart,
      href: "/stock-history",
    },
    // { name: "Orders", icon: Clipboard, href: "/orders" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-30",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="text-xl font-bold text-[#bc261a] alfa-font">
            RATHBURN ONLINE
          </div>
          <button
            className="p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            {/* @ts-ignore - React/TypeScript compatibility issue */}
            <X size={20} />
          </button>
        </div>
        <nav className="mt-5 px-2">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));

              const Icon = item.icon;

              return (
                <SafeLink
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center px-3 py-3 text-sm font-medium rounded-md",
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  {/* @ts-ignore - React/TypeScript compatibility issue */}
                  <Icon
                    className={cn(
                      "mr-3 h-5 w-5",
                      isActive ? "text-blue-600" : "text-gray-500"
                    )}
                  />
                  {item.name}
                </SafeLink>
              );
            })}
          </div>
        </nav>
        <div className="absolute bottom-0 w-full border-t border-gray-200">
          <div className="px-4 py-4">
            {/* @ts-ignore - Form action type mismatch */}
            <form action={signOutAction}>
              <Button
                variant="outline"
                type="submit"
                className="group flex items-center w-full text-sm font-medium rounded-md text-red-600 hover:bg-red-50"
              >
                {/* @ts-ignore - React/TypeScript compatibility issue */}
                <LogOut className="mr-2 h-5 w-5 text-red-500" />
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={cn("lg:pl-64 flex flex-col min-h-screen")}>
        {/* Top header */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button
              className="p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              {/* @ts-ignore - React/TypeScript compatibility issue */}
              <Menu size={20} />
            </button>
            <div className="flex items-center space-x-4">
              <button
                className="p-1 rounded-full text-gray-500 hover:text-gray-600 hover:bg-gray-100"
                aria-label="Notifications"
              >
                {/* @ts-ignore - React/TypeScript compatibility issue */}
                <Bell size={20} />
              </button>
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                {/* @ts-ignore - React/TypeScript compatibility issue */}
                <User size={18} />
              </div>
            </div>
          </div>
        </header>

        {/* Floating header controls */}
        <HeaderControls />

        {/* Page content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
