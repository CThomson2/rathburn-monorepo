import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stock History Dashboard | RB Dashboard",
  description:
    "Interactive time series visualization of inventory stock history data",
};

export default function StockHistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">{children}</div>;
}
