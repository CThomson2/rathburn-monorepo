import { ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format-date";
import { Batch } from "@/types/models/batches";
import { Skeleton } from "@/components/ui/skeleton";

interface BatchesTableProps {
  batches: Batch[];
  isLoading: boolean;
}

export function BatchesTable({ batches, isLoading }: BatchesTableProps) {
  if (isLoading) {
    return <BatchesTableSkeleton />;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">
              <Button variant="ghost" className="p-0 font-semibold">
                Batch ID
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" className="p-0 font-semibold">
                Material
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" className="p-0 font-semibold">
                Supplier
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="text-right">
              <Button variant="ghost" className="p-0 font-semibold">
                Total Volume
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="w-[150px]">
              <Button variant="ghost" className="p-0 font-semibold">
                Type
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="w-[180px]">
              <Button variant="ghost" className="p-0 font-semibold">
                Created
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {batches.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No batches found.
              </TableCell>
            </TableRow>
          ) : (
            batches.map((batch) => (
              <TableRow
                key={batch.batch_id}
                className="cursor-pointer hover:bg-muted/50"
              >
                <TableCell className="font-medium">
                  {batch.batch_code || batch.batch_id.substring(0, 8)}
                </TableCell>
                <TableCell>
                  <div>
                    <div>{batch.item_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {batch.material_name}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{batch.supplier_name || "N/A"}</TableCell>
                <TableCell className="text-right">
                  {batch.qty_drums}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      batch.batch_type === "new" ? "default" : "secondary"
                    }
                  >
                    {batch.batch_type === "new" ? "New" : "Repro"}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(batch.created_at)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function BatchesTableSkeleton() {
  return (
    <div className="rounded-md border">
      <div className="p-4">
        <div className="grid grid-cols-6 gap-4">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
        </div>
      </div>
      <div className="divide-y">
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="p-4">
              <div className="grid grid-cols-6 gap-4">
                {Array(6)
                  .fill(0)
                  .map((_, j) => (
                    <Skeleton key={j} className="h-5 w-full" />
                  ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
