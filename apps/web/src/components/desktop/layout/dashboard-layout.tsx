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
  File,
  Layers,
  Box,
  DatabaseIcon,
  DatabaseBackup,
  DatabaseZap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { NavBar } from "@/components/ui/tubelight-navbar";
import { WorkflowProvider } from "@/context/workflow-context";
import { WorkflowMenu } from "@/components/core/patterns/workflow/workflow-menu";
import { FloatingNav } from "@/components/desktop/layout/auth/floating-nav";
import { ThemeToggle } from "@/components/ui/theme-toggle";
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
  url: string;
  level: number;
}

declare module "lucide-react" {
  // This makes TypeScript treat Lucide icons as valid JSX elements
  export interface LucideProps {
    size?: number | string;
    className?: string;
  }
}

/**
 * DashboardLayout renders the main layout of the dashboard with a responsive sidebar.
 *
 * @param {DashboardLayoutProps} props - The properties for the layout.
 * @param {ReactNode} props.children - The content to be displayed within the main section of the layout.
 *
 * This component manages the sidebar's open/close state and provides navigation links.
 * It adapts to mobile view by providing a collapsible sidebar.
 */
const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { name: "Dashboard", icon: Home, url: "/", level: 1 },
    { name: "Orders", icon: Clipboard, url: "/orders", level: 2 },
    {
      name: "Inventory",
      icon: Package,
      url: "/inventory",
      level: 2,
    },
    {
      name: "Production",
      icon: Home,
      url: "/production",
      level: 5,
    },
  ];

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const openSidebar = () => {
    setSidebarOpen(true);
  };

  return (
    <WorkflowProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75 dark:bg-gray-800 dark:bg-opacity-80 z-20 lg:hidden"
            onClick={closeSidebar}
          />
        )}

        {/* Sidebar */}
        <div
          className={cn(
            "fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 shadow-lg dark:shadow-gray-900/30 transform transition-transform duration-300 ease-in-out z-30",
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >
          <div className="flex items-center justify-between h-12 px-4 border-b border-gray-200 dark:border-gray-700">
            <div className="text-lg font-bold text-[#bc261a] dark:text-red-500 alfa-font">
              RATHBURN ONLINE
            </div>
            <button
              className="p-1.5 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 lg:hidden"
              onClick={closeSidebar}
              aria-label="Close sidebar"
            >
              {/* @ts-ignore - React/TypeScript compatibility issue */}
              <X size={18} />
            </button>
          </div>
          <nav className="mt-3 px-2">
            <div className="space-y-1">
              {navItems.map((item, index) => {
                const isActive =
                  pathname === item.url ||
                  (item.url !== "/" && pathname.startsWith(item.url));

                const Icon = item.icon;
                const previousItem = index > 0 ? navItems[index - 1] : null;
                const shouldAddDivider =
                  previousItem && previousItem.level !== item.level;

                return (
                  <div key={item.name}>
                    {shouldAddDivider && (
                      <div className="h-px bg-gray-200 dark:bg-gray-700 my-2" />
                    )}
                    <SafeLink
                      href={item.url}
                      className={cn(
                        "group flex items-center px-3 py-2 text-sm font-medium rounded-md",
                        isActive
                          ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                          : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50"
                      )}
                    >
                      {/* @ts-ignore - React/TypeScript compatibility issue */}
                      <Icon
                        className={cn(
                          "mr-3 h-5 w-5",
                          isActive
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-500 dark:text-gray-400"
                        )}
                      />
                      {item.name}
                    </SafeLink>
                  </div>
                );
              })}
            </div>
          </nav>
          {/* Bottom of sidebar */}
          <div className="absolute bottom-0 w-full border-t border-gray-200 dark:border-gray-700">
            <div className="px-4 py-4 space-y-3">
              {/* Database button */}
              <Button
                variant="outline"
                className="flex items-center justify-start w-full gap-2 text-foreground dark:text-gray-300"
                asChild
              >
                <Link
                  href={`${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL}`}
                  target="_blank"
                >
                  <Database className="h-4 w-4" />
                  <span>Database</span>
                </Link>
              </Button>

              {/* Sign out button */}
              <form action={signOutAction}>
                <Button
                  variant="outline"
                  type="submit"
                  className="group flex items-center w-full text-sm font-medium rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  {/* @ts-ignore - React/TypeScript compatibility issue */}
                  <LogOut className="mr-2 h-5 w-5 text-red-500 dark:text-red-400" />
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* Top Floating NavBar */}
        <NavBar items={navItems} />
        {/* Main content */}
        <div className={cn("lg:pl-64 flex flex-col min-h-screen")}>
          {/* Top header */}
          <header className="bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-900/30 z-10">
            <div className="flex items-center justify-end h-12 py-8 px-4 sm:px-6 lg:px-8">
              <button
                className="p-1.5 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 lg:hidden mr-auto"
                onClick={openSidebar}
                aria-label="Open sidebar"
              >
                {/* @ts-ignore - React/TypeScript compatibility issue */}
                <Menu size={18} />
              </button>

              <div className="flex items-center space-x-3">
                <ThemeToggle />
                <button
                  className="inline-flex items-center p-1 rounded-full text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700"
                  aria-label="Notifications"
                >
                  {/* @ts-ignore - React/TypeScript compatibility issue */}
                  <Bell size={18} />
                </button>
                <div className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-blue-600 dark:bg-blue-700 text-white">
                  {/* @ts-ignore - React/TypeScript compatibility issue */}
                  <User size={16} />
                </div>
              </div>
            </div>
          </header>

          {/* Workflow Menu - available on all pages */}
          <WorkflowMenu />

          {/* Page content */}
          <main className="flex-1 pt-2">{children}</main>
        </div>
      </div>
    </WorkflowProvider>
  );
};

export default DashboardLayout;
