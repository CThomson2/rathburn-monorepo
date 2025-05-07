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
import { Button } from "../ui/button";
import { RealtimeFeedSidebar } from "../realtime/sidebar-feed";

// TypeScript workaround for React 18 vs React 19 type compatibility issue
// @ts-ignore
const SafeLink = Link;

interface StocktakeScanFeedDetail {
  id: string;
  stocktake_session_id: string;
  scanned_at: string;
  created_at: string;
  raw_barcode: string;
  barcode_type: "material" | "supplier" | "unknown" | "error";
  status: "success" | "error" | "ignored";
  error_message?: string | null;
  user_id: string;
  device_id?: string | null;
  material_id?: string | null;
  material_name?: string | null;
  supplier_id?: string | null;
  supplier_name?: string | null;
  associated_supplier_name_for_material?: string | null;
}

interface DashboardLayoutProps {
  children: ReactNode;
  apiUrl: string;
  apiKey: string;
  initialScans: StocktakeScanFeedDetail[];
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
 * DashboardLayout renders the main layout with left nav sidebar and right feed sidebar.
 */
const DashboardLayout = ({
  children,
  apiUrl,
  apiKey,
  initialScans,
}: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isNavigating = useNavigationLoading();

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

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Left Navigation Sidebar */}
      <SidebarProvider className="h-full">
        <AppSidebar />

        {/* Main Content Area (Center + Right Sidebar) */}
        <div className="flex flex-1 h-full overflow-hidden">
          {/* Center Content Column (Header + Main Children) */}
          <div className="flex flex-col flex-1 h-full overflow-auto">
            {/* Top Floating NavBar */}
            <NavBar items={navItems} isLoading={isNavigating} />

            {/* Main content section */}
            <div className="flex flex-col flex-1">
              {/* Top header */}
              <header className="bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-900/30 z-10">
                <div className="flex items-center justify-end h-12 py-8 px-4 sm:px-6 lg:px-8">
                  <div className="flex items-center space-x-3">
                    <ThemeToggle />
                    <form action={signOutAction}>
                      <Button variant="ghost" type="submit">
                        <LogOut size={16} />
                      </Button>
                    </form>
                  </div>
                </div>
              </header>

              {/* Page content passed as children */}
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

          {/* Right Realtime Feed Sidebar */}
          {/* <div className="hidden md:flex h-full">
            <RealtimeFeedSidebar
              apiUrl={apiUrl}
              apiKey={apiKey}
              initialScans={initialScans}
            />
          </div> */}
        </div>
      </SidebarProvider>
    </div>
  );
};

export default DashboardLayout;
