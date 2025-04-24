"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/core/ui/button";
import { Input } from "@/components/core/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/core/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/core/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/core/ui/pagination";
import {
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Download,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { FilterCondition, SortSpec } from "../types";
import {
  availableTables,
  buildQuery,
  AvailableTable,
} from "../constants/tables";
import { useColumns } from "../hooks/use-columns";
import { Database } from "@/types/models/supabase";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/core/ui/alert";

/**
 * SpreadsheetView is a React component that renders a data table with pagination,
 * searching, sorting, and table selection capabilities. It uses Supabase as the
 * backend to fetch data and dynamically retrieves column information based on the
 * selected table. The component provides a user interface for selecting tables,
 * searching data within the tables, sorting columns, and paginating through data
 * entries. It allows users to choose the number of rows displayed per page and
 * provides controls for navigating between pages.
 */
export default function SpreadsheetView() {
  try {
    const searchParams = useSearchParams();
    const [selectedTable, setSelectedTable] = useState<AvailableTable>(
      (searchParams.get("table") as AvailableTable) || "stock_drum"
    );
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [totalRows, setTotalRows] = useState<number>(0);
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
    const [error, setError] = useState<Error | null>(null);

    // Use our custom hook to get columns
    const { columns, isLoading: columnsLoading } = useColumns(selectedTable);

    // Create filter conditions for search query
    const getFilterConditions = (): FilterCondition[] => {
      if (!searchQuery.trim()) return [];

      // Create a filter condition for each column
      return columns
        .filter((col) => col.selected)
        .map((col, index) => ({
          id: `search-${index}`,
          column: col.name,
          operator: "ilike",
          value: searchQuery,
        }));
    };

    // Create sort specification
    const getSortSpecs = (): SortSpec[] => {
      if (!sortColumn) return [];
      return [
        {
          id: "primary-sort",
          column: sortColumn,
          direction: sortDirection,
        },
      ];
    };

    // Fetch data from the selected table
    useEffect(() => {
      const fetchData = async () => {
        try {
          setIsLoading(true);
          setError(null);

          // Get the selected column names
          const selectedColumns = columns
            .filter((col) => col.selected)
            .map((col) => col.name)
            .join(", ");

          if (!selectedColumns) {
            setData([]);
            setTotalRows(0);
            return;
          }

          const supabase = createClient();

          // Build the query using buildQuery utility
          const filters = getFilterConditions();
          const sorts = getSortSpecs();

          // Use the centralized buildQuery utility
          let query = buildQuery(selectedTable, {
            columns: columns
              .filter((col) => col.selected)
              .map((col) => col.name),
            filters: filters.length === 1 ? filters : undefined,
            sorts: sorts,
            pagination: {
              page: currentPage,
              pageSize: pageSize,
            },
            includeCount: true,
          });

          // Handle the special case for OR filtering with multiple columns
          if (filters.length > 1) {
            // We need to do this separately as it's a special case
            // For multiple columns, we need to build an OR filter
            const filterStr = filters
              .map((f) => `${f.column}.ilike.%${f.value}%`)
              .join(",");
            query = query.or(filterStr);
          }

          // Execute the query
          const { data, error, count } = await query;

          if (error) throw error;

          setData(data || []);
          setTotalRows(count || 0);
        } catch (err) {
          console.error("Error fetching data:", err);
          setError(err instanceof Error ? err : new Error(String(err)));
          setData([]);
          setTotalRows(0);
        } finally {
          setIsLoading(false);
        }
      };

      if (selectedTable && columns.length > 0 && !columnsLoading) {
        fetchData();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      selectedTable,
      currentPage,
      pageSize,
      sortColumn,
      sortDirection,
      searchQuery,
      columns,
      columnsLoading,
    ]);

    // Handle table selection change
    const handleTableChange = (tableName: AvailableTable) => {
      setSelectedTable(tableName);
      setCurrentPage(1);
      setSortColumn(null);
      setSortDirection("asc");
      setSearchQuery("");
    };

    // Handle column sort
    const handleSort = (column: string) => {
      if (sortColumn === column) {
        setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      } else {
        setSortColumn(column);
        setSortDirection("asc");
      }
    };

    // Handle search input change
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
      setCurrentPage(1); // Reset to first page when searching
    };

    // Calculate total pages
    const totalPages = Math.ceil(totalRows / pageSize);

    // Get visible column names
    const visibleColumns = columns
      .filter((col) => col.selected)
      .map((col) => col.name);

    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select value={selectedTable} onValueChange={handleTableChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select a table" />
              </SelectTrigger>
              <SelectContent>
                {availableTables.map((table) => (
                  <SelectItem key={table.name} value={table.name}>
                    {table.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-sm text-muted-foreground">
              {
                availableTables.find((t) => t.name === selectedTable)
                  ?.description
              }
            </div>
          </div>
          <div className="flex gap-2">
            <div className="relative w-full sm:w-[250px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-8"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                // Simple CSV download for MVP
                if (data.length === 0) return;

                // Create CSV content
                const headers = visibleColumns.join(",");
                const rows = data.map((row) =>
                  visibleColumns
                    .map((col) => JSON.stringify(row[col] || ""))
                    .join(",")
                );
                const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows.join("\n")}`;

                // Create download link
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `${selectedTable}-export.csv`);
                document.body.appendChild(link);

                // Trigger download and clean up
                link.click();
                document.body.removeChild(link);
              }}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="border rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {visibleColumns.map((column) => (
                    <TableHead key={column} className="whitespace-nowrap">
                      <div
                        className="flex items-center cursor-pointer"
                        onClick={() => handleSort(column)}
                      >
                        {column}
                        {sortColumn === column ? (
                          sortDirection === "asc" ? (
                            <ChevronUp className="ml-1 h-4 w-4" />
                          ) : (
                            <ChevronDown className="ml-1 h-4 w-4" />
                          )
                        ) : null}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading || columnsLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={visibleColumns.length || 1}
                      className="text-center py-8"
                    >
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                        Loading data...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell
                      colSpan={visibleColumns.length || 1}
                      className="text-center py-8 text-destructive"
                    >
                      Error: {error.message}
                    </TableCell>
                  </TableRow>
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={visibleColumns.length || 1}
                      className="text-center py-8"
                    >
                      No data available
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {visibleColumns.map((column) => (
                        <TableCell key={column} className="whitespace-nowrap">
                          {row[column]?.toString() || ""}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between px-4 py-2 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, totalRows)} of {totalRows}{" "}
              results
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>

              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                      }}
                      className={
                        currentPage <= 1 ? "pointer-events-none opacity-50" : ""
                      }
                    />
                  </PaginationItem>

                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageNumber = i + 1;
                    return (
                      <PaginationItem key={i}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(pageNumber);
                          }}
                          isActive={currentPage === pageNumber}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages)
                          setCurrentPage(currentPage + 1);
                      }}
                      className={
                        currentPage >= totalPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (err) {
    console.error("Error rendering SpreadsheetView:", err);
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error in Spreadsheet View</AlertTitle>
        <AlertDescription>
          The spreadsheet component encountered an error. This feature is still
          under development.
        </AlertDescription>
      </Alert>
    );
  }
}
