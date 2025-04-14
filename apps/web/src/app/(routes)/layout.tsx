import type { Metadata } from "next";
import DashboardLayout from "@/components/desktop/layout/dashboard-layout";

import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Rathburn",
  description: "Inventory Management System",
  icons: {
    icon: "/rc-logo-b.png",
  },
};

export default function RoutesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <DashboardLayout>{children}</DashboardLayout>
    </div>
  );
}
