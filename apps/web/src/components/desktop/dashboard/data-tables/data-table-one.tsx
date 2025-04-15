"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/core/ui/table";

interface DataTableProps {
  columns: any[];
  data: any[];
}

/**
 * A simple data table component that renders columns and data
 */
export default function DataTable({ columns, data }: DataTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.id || column.accessorKey}>
                {column.header || column.title}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                No results.
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map((column) => (
                  <TableCell
                    key={`${rowIndex}-${column.id || column.accessorKey}`}
                  >
                    {column.cell
                      ? column.cell({ row })
                      : row[column.accessorKey || column.id]}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
