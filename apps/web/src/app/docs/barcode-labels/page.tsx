"use client";

import { useState } from "react";
import { FileSystemView } from "@/components/layout/file-system-view";
import { PDFPreview } from "@/components/ui/pdf-preview";
import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface Item {
  item_id: string;
  name: string;
  supplier_id: string;
}

interface Supplier {
  supplier_id: string;
  name: string;
}

interface Node {
  name: string;
  nodes?: Node[];
  type?: "file" | "folder";
  path?: string;
}

/**
 * A page that displays a file tree of barcode labels grouped by item and supplier,
 * and allows users to select a file to preview as a PDF.
 *
 * The PDF preview component is a simple wrapper around the `PDFPreview` component
 * that handles downloading the PDF when the download button is clicked.
 *
 * The file tree is generated using the `useQuery` hook to fetch all items and their
 * suppliers, and then grouping them by supplier.
 *
 * The tree is then converted to a flat array of nodes, with each node having a
 * `name` and a `type` (either "file" or "folder"), and a `path` property for files.
 *
 * The `onSelect` callback is called when a file is selected, and passes the path
 * of the selected file to the callback.
 *
 * The `handleDownload` callback is called when the download button is clicked, and
 * opens the selected PDF in a new tab.
 */
export default function BarcodeLabelsDocs() {
  const [selectedPDF, setSelectedPDF] = useState<string | null>(null);
  const supabase = createClient();

  // Fetch items and their suppliers
  const { data: fileSystemData } = useQuery({
    queryKey: ["barcode-labels-structure"],
    queryFn: async () => {
      // Get all items
      const { data: items } = await supabase
        .schema("inventory")
        .from("items")
        .select("item_id, name, supplier_id");

      // Get all suppliers
      const { data: suppliers } = await supabase
        .schema("inventory")
        .from("suppliers")
        .select("supplier_id, name");

      // Create a map of supplier IDs to names
      const supplierMap = new Map(
        (suppliers as Supplier[] | null)?.map((s: Supplier) => [
          s.supplier_id,
          s.name,
        ]) || []
      );

      // Group items by supplier
      const itemsBySupplier = (items as Item[] | null)?.reduce(
        (acc: Record<string, Map<string, string>>, item: Item) => {
          if (!acc[item.name]) {
            acc[item.name] = new Map();
          }
          if (item.supplier_id && supplierMap.has(item.supplier_id)) {
            acc[item.name].set(
              item.supplier_id,
              supplierMap.get(item.supplier_id)!
            );
          }
          return acc;
        },
        {} as Record<string, Map<string, string>>
      );

      // Convert to tree structure
      const nodes: Node[] = Object.entries(itemsBySupplier ?? {}).map(
        ([itemName, suppliers]) => {
          // Ensure suppliers is defined and is a Map
          if (!suppliers || !(suppliers instanceof Map)) {
            console.warn(`Invalid suppliers data for item ${itemName}`);
            return {
              name: itemName,
              type: "folder",
              nodes: [],
            };
          }

          // Now TypeScript knows suppliers is a Map
          const supplierMap = suppliers as Map<string, string>;

          return {
            name: itemName,
            type: "folder",
            nodes: Array.from(supplierMap.entries()).map(
              ([supplierId, supplierName]) => ({
                name: supplierName,
                type: "folder",
                nodes: [
                  {
                    name: `barcodes-${supplierId}.pdf`,
                    type: "file",
                    path: `/labels/barcodes-${supplierId}.pdf`,
                  },
                ],
              })
            ),
          };
        }
      );

      return nodes;
    },
  });

  const handleFileSelect = (path: string) => {
    console.log("Selected file:", path);
    setSelectedPDF(path);
  };

  const handleDownload = () => {
    if (selectedPDF) {
      window.open(selectedPDF, "_blank");
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Barcode Labels Archive</h1>

      <div className="grid grid-cols-12 gap-6">
        {/* File Tree */}
        <div className="col-span-4">
          <FileSystemView
            nodes={fileSystemData || []}
            onSelect={handleFileSelect}
          />
        </div>

        {/* PDF Preview */}
        <div className="col-span-8">
          {selectedPDF ? (
            <PDFPreview url={selectedPDF} onDownload={handleDownload} />
          ) : (
            <div className="h-[600px] flex items-center justify-center border rounded-lg bg-gray-50">
              <p className="text-gray-500">
                Select a barcode label PDF to preview
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
