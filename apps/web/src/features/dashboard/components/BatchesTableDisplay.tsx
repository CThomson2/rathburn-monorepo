import React, { useState } from "react";
import { BatchDataFromView } from "@/app/actions/batches";
import { DrumSerialsList } from "./DrumSerialsList";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button"; // For potential future actions
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BatchesTableDisplayProps {
  batches: BatchDataFromView[];
}

export function BatchesTableDisplay({ batches }: BatchesTableDisplayProps) {
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);

  const toggleExpand = (batchId: string) => {
    setExpandedBatchId(expandedBatchId === batchId ? null : batchId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"></TableHead> {/* For expand icon */}
            <TableHead>Batch ID / Code</TableHead>
            <TableHead>Material</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead className="text-right">Volume</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Drums (In Stock / Total)</TableHead>
            <TableHead className="text-right">Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {batches.map((batch) => (
            <React.Fragment key={batch.batch_id}>
              <TableRow
                onClick={() => toggleExpand(batch.batch_id)}
                className="cursor-pointer hover:bg-muted/50"
              >
                <TableCell className="px-2 py-2">
                  <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                    {expandedBatchId === batch.batch_id ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
                <TableCell className="font-medium">
                  {batch.batch_code || batch.batch_id.slice(0, 8)}
                </TableCell>
                <TableCell>
                  {batch.material_name || batch.item_name || "N/A"}
                </TableCell>
                <TableCell>{batch.supplier_name || "N/A"}</TableCell>
                <TableCell className="text-right">
                  {batch.total_volume || 0} L
                </TableCell>
                <TableCell>
                  {batch.batch_type && (
                    <Badge
                      variant={
                        batch.batch_type.toLowerCase() === "new"
                          ? "default"
                          : "secondary"
                      }
                      className={cn(
                        batch.batch_type.toLowerCase() === "new"
                          ? "bg-blue-500 text-white"
                          : "bg-orange-500 text-white",
                        "text-xs"
                      )}
                    >
                      {batch.batch_type}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {batch.drums_in_stock !== null && batch.drum_count !== null
                    ? `${batch.drums_in_stock} / ${batch.drum_count}`
                    : "N/A"}
                </TableCell>
                <TableCell className="text-right">
                  {formatDate(batch.created_at)}
                </TableCell>
              </TableRow>
              {expandedBatchId === batch.batch_id && (
                <TableRow className="bg-muted/20 hover:bg-muted/20">
                  <TableCell colSpan={8}>
                    {" "}
                    {/* ColSpan should match number of columns */}
                    <DrumSerialsList batchId={batch.batch_id} />
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
