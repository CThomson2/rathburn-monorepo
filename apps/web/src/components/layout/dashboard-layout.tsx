"use client";

import { ReactNode } from "react";
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
// import { AppHeader } from "@/components/header/app-header"; // Commented out - file might not exist
import RealtimeScanLogSidebar from "@/components/sidebar/scan-log-sidebar";
import { Json, Database } from "@/types/supabase";
import React, { Suspense } from "react";

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

interface SessionScanData {
  id: string;
  session_id: string | null;
  scanned_at: string;
  created_at: string;
  raw_barcode: string;
  scan_status: "success" | "error" | "ignored";
  scan_action: "check_in" | "transport" | "process" | "context" | "cancel";
  error_message?: string | null;
  user_id?: string | null;
  user_email?: string | null;
  device_id?: string | null;
  pol_id?: string | null;
  pod_id?: string | null;
  item_name?: string | null;
  cancelled_scan_id?: string | null;
  metadata?: Json | null;
}

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

const navItems: NavItem[] = [
  { name: "Dashboard", icon: Home, url: "/" },
  { name: "Production", icon: Atom, url: "/production" },
  { name: "Inventory", icon: Package, url: "/inventory" },
  { name: "Analytics", icon: BarChart, url: "/analytics" },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background text-foreground">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Header section restored */}
          <header className="sticky top-0 z-10 flex h-[57px] items-center gap-1 border-b bg-background px-4">
            <h1 className="text-xl font-semibold">Dashboard</h1>{" "}
            {/* Example Title, can be dynamic */}
            <div className="ml-auto flex items-center space-x-4">
              <ThemeToggle />
              <form action={signOutAction}>
                <Button
                  variant="ghost"
                  size="icon"
                  type="submit"
                  aria-label="Sign Out"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </form>
            </div>
          </header>
          {/* NavBar restored below header, if that was the intended layout */}
          {/* If NavBar is fixed/floating, its own styling will dictate placement */}
          {/* <NavBar items={navItems} /> */}
          {/* The main NavBar is often part of a client component wrapper if it needs client-side interactivity for path changes */}

          <main className="flex-1 overflow-auto p-4 md:p-6">
            {/* Client-side NavBar can be here if it controls view content and needs usePathname */}
            <NavBar items={navItems} />
            <Suspense fallback={<div>Loading page content...</div>}>
              {children}
            </Suspense>
          </main>
        </div>
        <div className="w-120 hidden lg:block border-l border-border overflow-y-auto bg-sidebar">
          <RealtimeScanLogSidebar />
        </div>
      </div>
    </SidebarProvider>
  );
}
