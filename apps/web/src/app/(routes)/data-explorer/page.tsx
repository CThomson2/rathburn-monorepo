import { Metadata } from "next";
import DataExplorerPage from "@/features/data-explorer";

export const metadata: Metadata = {
  title: "Data Explorer | Rathburn",
  description:
    "Explore and analyze data with a comprehensive spreadsheet-style interface and modular query builder.",
};

export default async function Page() {
  return <DataExplorerPage />;
}
