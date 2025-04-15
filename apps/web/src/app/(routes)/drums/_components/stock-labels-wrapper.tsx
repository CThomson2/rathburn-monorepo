"use client";

import dynamic from "next/dynamic";

// Use dynamic import in this client component
const StockLabelsGenerator = dynamic(
  () => import("./stock-labels-generator"),
  {
    ssr: false,
    loading: () => <div>Loading label generator...</div>
  }
);

export default function StockLabelsWrapper() {
  return <StockLabelsGenerator />;
}