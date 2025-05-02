"use client";

import { ReactNode, useState, useEffect } from "react";
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
  Atom,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOutAction } from "@/app/actions";
import { NavBar } from "@/components/ui/navbar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useNavigationLoading } from "@/hooks/use-navigation-loading";
import { toast } from "@/components/ui/use-toast";

// TypeScript workaround for React 18 vs React 19 type compatibility issue
// @ts-ignore
const SafeLink = Link;

interface DashboardLayoutProps {
  children: ReactNode;
}

interface NavItem {
  name: string;
  url: string;
  icon: LucideIcon;
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
  const router = useRouter();
  const isNavigating = useNavigationLoading();

  // Debug toast on mount
  useEffect(() => {
    // Wait a bit before showing the toast to ensure all providers are mounted
    const timer = setTimeout(() => {
      console.log("Creating debug toast from dashboard layout");
      toast({
        title: "Debug Toast",
        description: "This is a debug toast from dashboard layout",
        variant: "default",
        duration: 30000, // Show for 30 seconds
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const navItems: NavItem[] = [
    { name: "Dashboard", icon: Home, url: "/" },
    {
      name: "Production",
      icon: Atom,
      url: "/production",
    },
    {
      name: "Inventory",
      icon: Package,
      url: "/inventory",
    },
    {
      name: "Analytics",
      icon: BarChart,
      url: "/analytics",
    },
  ];

  // Custom navigation handler for sidebar items
  // const handleNavigation = (url: string) => {
  //   // Only trigger navigation if not already on that page
  //   if (pathname !== url && !(url !== "/" && pathname.startsWith(url))) {
  //     closeSidebar();
  //     router.push(url);
  //   } else {
  //     closeSidebar(); // Just close sidebar if already on that page
  //   }
  // };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <SidebarProvider className="h-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 h-full overflow-auto">
          {/* Top Floating NavBar */}
          <NavBar items={navItems} isLoading={isNavigating} />

          {/* Main content */}
          <div className="flex flex-col flex-1">
            {/* Top header */}
            <header className="bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-900/30 z-10">
              <div className="flex items-center justify-end h-12 py-8 px-4 sm:px-6 lg:px-8">
                {/* <button
                  className="p-1.5 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 lg:hidden mr-auto"
                  onClick={openSidebar}
                  aria-label="Open sidebar"
                > */}
                {/* @ts-ignore - React/TypeScript compatibility issue */}
                {/* <Menu size={18} />
                </button> */}

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

            {/* Page content */}
            <main className="flex-1 p-4 overflow-auto">
              {isNavigating ? (
                <div className="space-y-6">
                  {/* Skeleton loading state */}
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-md w-1/3 animate-pulse"></div>
                  <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-md w-full animate-pulse"></div>
                  <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-md w-full animate-pulse"></div>
                  <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-md w-full animate-pulse"></div>
                </div>
              ) : (
                children
              )}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default DashboardLayout;
