import { Metadata } from "next";
import { Suspense } from "react";

// Import the client wrapper instead of using dynamic import directly
import DataExplorerClient from "./client";

export const metadata: Metadata = {
  title: "Data Explorer | Rathburn",
  description:
    "Explore and analyze data with a comprehensive spreadsheet-style interface and modular query builder.",
};

export default function Page() {
  return (
    <Suspense
      fallback={<div className="p-8 text-center">Loading Data Explorer...</div>}
    >
      {/* <DataExplorerClient /> */}
      <h1 className="text-2xl font-bold">Business Views</h1>
    </Suspense>
  );
}
