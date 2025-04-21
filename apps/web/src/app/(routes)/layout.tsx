import type { Metadata } from "next";
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
  // We don't need to wrap with DashboardLayout here as that's handled in the root layout
  return <>{children}</>;
}
