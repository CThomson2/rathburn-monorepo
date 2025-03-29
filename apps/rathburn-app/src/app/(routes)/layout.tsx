import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { Sidebar } from "@/components/layout/sidebar/Sidebar";
import { SidebarProvider } from "@/utils/use-sidebar";

import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Rathburn",
  description: "Inventory Management System",
  icons: {
    icon: "/public/rc-logo-b.png",
  },
};

export default function RoutesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      {/* Add Sidebar to all routes in this group */}
      <div className="flex min-h-screen bg-gray-50 dark:bg-boxdark">
        <Sidebar />
        <div className="flex-1 pt-16">{children}</div>
      </div>
    </SidebarProvider>
  );
}
