"use client";

import React, { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  ExpandedState,
} from "@tanstack/react-table";

// Import icons
import {
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUp,
  ChevronsDown,
  ChevronFirst,
  ChevronLast,
} from "lucide-react";

// Import sub-table component
import DrumSubTable from "@/features/inventory/drum-stock/drum-sub-table";

// Define a generic DataTable component
const DataTable = <TData extends object>({
  columns,
  data,
}: {
  columns: ColumnDef<TData>[];
  data: TData[];
}) => {
  // State for table features
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Add expander column to beginning of columns array
  const allColumns = [
    {
      id: "expander",
      header: "",
      cell: ({ row }) => {
        // Check if this row has subRows to display
        const hasSubRows =
          row.original.hasOwnProperty("subRows") &&
          Array.isArray((row.original as any).subRows) &&
          (row.original as any).subRows.length > 0;

        if (!hasSubRows) return null;

        return (
          <button
            onClick={() => {
              row.toggleExpanded();
            }}
            className="p-0 h-6 w-6 flex items-center justify-center"
          >
            {row.getIsExpanded() ? (
              <ChevronDown className="h-5 w-5 text-primary" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </button>
        );
      },
    } as ColumnDef<TData>,
    ...columns,
  ];

  // Initialize the table
  const table = useReactTable({
    data,
    columns: allColumns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      expanded,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onExpandedChange: setExpanded,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  // Destructure necessary table functionality from the table instance
  const { pageIndex, pageSize } = table.getState().pagination;

  // Calculate page options
  const pageCount = table.getPageCount();
  const pageOptions = Array.from({ length: pageCount }, (_, i) => i);

  // Handlers for expanding and collapsing all rows
  const handleExpandAll = () => {
    const newExpanded: Record<string, boolean> = {};

    // Only expand the top-level rows that have subRows
    table.getRowModel().rows.forEach((row) => {
      const hasSubRows =
        row.original.hasOwnProperty("subRows") &&
        Array.isArray((row.original as any).subRows) &&
        (row.original as any).subRows.length > 0;

      if (hasSubRows) {
        newExpanded[row.id] = true;
      }
    });

    setExpanded(newExpanded);
  };

  const handleCollapseAll = () => {
    setExpanded({});
  };

  return (
    <section className="data-table-common rounded-sm border border-stroke bg-white dark:bg-boxdark py-4 shadow-default dark:border-strokedark">
      <div className="flex justify-between px-8 pb-4">
        <div className="flex gap-2">
          <button
            onClick={handleExpandAll}
            className="rounded border border-stroke bg-gray-50 dark:bg-boxdark-2 py-2 px-4 hover:border-primary hover:bg-gray-100 dark:border-strokedark dark:hover:border-primary dark:hover:bg-boxdark flex items-center gap-1"
          >
            <ChevronsDown className="h-4 w-4" />
            <span>Expand All</span>
          </button>
          <button
            onClick={handleCollapseAll}
            className="rounded border border-stroke bg-gray-50 dark:bg-boxdark-2 py-2 px-4 hover:border-primary hover:bg-gray-100 dark:border-strokedark dark:hover:border-primary dark:hover:bg-boxdark flex items-center gap-1"
          >
            <ChevronsUp className="h-4 w-4" />
            <span>Collapse All</span>
          </button>
        </div>

        <div className="flex items-center font-medium">
          <select
            title="Entries Per Page"
            value={pagination.pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value));
            }}
            className="relative z-20 appearance-none rounded border border-stroke bg-transparent py-2 px-8 outline-none transition focus:border-primary active:border-primary dark:border-strokedark"
          >
            {[10, 25, 50, 100].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </select>
          <span className="ml-2">Entries Per Page</span>
        </div>
      </div>

      <div className="px-4 md:px-6 pb-4">
        <input
          type="text"
          value={globalFilter || ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full rounded-md border border-stroke bg-transparent px-5 py-2.5 outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark-2 dark:focus:border-primary"
          placeholder="Search..."
        />
      </div>

      <div className="max-w-full overflow-x-auto">
        <table className="w-full">
          <thead className="border-separate px-4">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                className="border-t border-stroke dark:border-strokedark"
                key={headerGroup.id}
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    onClick={header.column.getToggleSortingHandler()}
                    className={`px-6 py-2 font-medium ${
                      header.column.getCanSort()
                        ? "cursor-pointer select-none"
                        : ""
                    }`}
                  >
                    <div className="flex items-center">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getCanSort() && (
                        <span className="ml-2">
                          {{
                            asc: "↑",
                            desc: "↓",
                          }[header.column.getIsSorted() as string] ?? "⇅"}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <React.Fragment key={row.id}>
                <tr
                  className={`border-t border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-boxdark-2 
                               ${
                                 row.getIsExpanded()
                                   ? "bg-gray-50 dark:bg-boxdark-2"
                                   : ""
                               }
                               ${row.depth === 0 ? "shadow-sm my-2" : ""}
                              `}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={`px-6 py-3 ${
                        row.getIsExpanded() ? "font-bold" : ""
                      }`}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>

                {/* If expanded and has subRows, render the subRows in an expanded row */}
                {row.getIsExpanded() && (row.original as any).subRows && (
                  <tr className="transition-all duration-150 animate-accordionDown">
                    <td
                      colSpan={allColumns.length}
                      className="px-0 py-0 border-none"
                    >
                      <div className="mx-4 my-2 transition-all duration-150 ease-in-out">
                        <DrumSubTable drums={(row.original as any).subRows} />
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}

            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td
                  colSpan={allColumns.length}
                  className="border-b border-stroke px-6 py-3 text-center dark:border-strokedark"
                >
                  No results found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center gap-2 p-4">
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded border border-stroke bg-gray-50 hover:border-primary hover:bg-gray-100 dark:border-strokedark dark:bg-boxdark-2 dark:hover:border-primary dark:hover:bg-boxdark"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronFirst className="h-4 w-4" />
        </button>

        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded border border-stroke bg-gray-50 hover:border-primary hover:bg-gray-100 dark:border-strokedark dark:bg-boxdark-2 dark:hover:border-primary dark:hover:bg-boxdark"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>

        {pageOptions.map((pageOption) => (
          <button
            title={`Page ${pageOption + 1}`}
            type="button"
            key={pageOption}
            onClick={() => table.setPageIndex(pageOption)}
            className={`flex h-8 w-8 items-center justify-center rounded border border-stroke bg-gray-50 ${
              pageOption === pageIndex
                ? "border-primary bg-primary text-white"
                : "hover:border-primary hover:bg-gray-100"
            } dark:border-strokedark dark:bg-boxdark-2 dark:hover:border-primary dark:hover:bg-boxdark`}
          >
            {pageOption + 1}
          </button>
        ))}

        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded border border-stroke bg-gray-50 hover:border-primary hover:bg-gray-100 dark:border-strokedark dark:bg-boxdark-2 dark:hover:border-primary dark:hover:bg-boxdark"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <ChevronsRight className="h-4 w-4" />
        </button>

        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded border border-stroke bg-gray-50 hover:border-primary hover:bg-gray-100 dark:border-strokedark dark:bg-boxdark-2 dark:hover:border-primary dark:hover:bg-boxdark"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
        >
          <ChevronLast className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
};

export default DataTable;
