"use client";

// Import necessary dependencies for table functionality
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { ColumnSort } from "@/components/table";
import { Actions } from "./actions";

// Formatters
import { format } from "date-fns";
import { getTxTypeVariant } from "@/utils/formatters/variants";

// UI Components
import { Badge } from "@/components/ui/badge";

// import { MoreHorizontal } from "lucide-react";
import type { Transaction } from "@/types/models";
import { ArrowUpCircle, ArrowDownCircle, CircleSlash } from "lucide-react";

// components/features/inventory/TransactionTable/columns.tsx

export const columns: ColumnDef<Transaction>[] = [
  {
    // Checkbox column for row selection
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value: boolean) =>
            table.toggleAllPageRowsSelected(!!value)
          }
          aria-label="Select all"
          className="border-border bg-white shadow-lg border data-[state=checked]:border-0"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value: boolean) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="border-border bg-white shadow-lg border data-[state=checked]:border-0"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  //   {
  //     accessorKey: "tx_id",
  //     header: ({ column }) => <ColumnSort column={column} title="ID" />,
  //     cell: ({ row }) => row.getValue("tx_id"),
  //     enableSorting: true,
  //   },
  {
    accessorKey: "tx_date",
    header: ({ column }) => <ColumnSort column={column} title="Date" />,
    cell: ({ row }) => format(new Date(row.getValue("tx_date")), "dd MMM yyyy"),
    enableSorting: true,
  },
  {
    accessorKey: "material",
    header: ({ column }) => <ColumnSort column={column} title="Material" />,

    cell: ({ row }) => {
      const direction = row.original.direction;
      const icon = (direction: string): JSX.Element | null => {
        switch (direction) {
          case "IN":
            return <ArrowUpCircle className="mr-1 h-4 w-4" stroke="#12B232" />;
          case "OUT":
            return (
              <ArrowDownCircle className="mr-1 h-4 w-4" stroke="#DC2626" />
            );
          default:
            return <CircleSlash className="mr-1 h-4 w-4" />;
        }
      };
      return (
        <span className="w-full flex items-center justify-between">
          {icon(direction)}
          {row.getValue("material")}
          <p></p>
        </span>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "tx_type",
    header: ({ column }) => <ColumnSort column={column} title="Type" />,
    cell: ({ row }) => (
      <Badge variant={getTxTypeVariant(row.getValue("tx_type"))}>
        {row.getValue<string>("tx_type")}
      </Badge>
    ),
    enableSorting: true,
  },
  // {
  //   accessorKey: "direction",
  //   header: ({ column }) => <ColumnSort column={column} title="Direction" />,
  //   cell: ({ row }) => {
  //     const direction = row.getValue<string>("direction");

  //     if (direction === "IN") {
  //       return (
  //         <div className="flex items-center">
  //           <ArrowDownCircle className="mr-1 h-4 w-4" stroke="#12B232" />
  //         </div>
  //       );
  //     } else if (direction === "OUT") {
  //       return (
  //         <div className="flex items-center">
  //           <ArrowUpCircle className="mr-1 h-4 w-4" stroke="#DC2626" />
  //         </div>
  //       );
  //     }

  //     return null;
  //   },
  //   enableSorting: true,
  // },
  {
    // Actions column for row operations:
    // Expand info | View product Modal
    // Add to cart | Go to Checkout | Favourite
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="min-w-0 overflow-hidden">
        <Actions transaction={row.original} />
      </div>
    ),
  },
  // Column for "Source" - either "Import", "New Drum", or "Repro Drum". Use a JOIN query to get the name of the source (depending on the tx_type))
  //   {
  //     accessorKey: "source",
  //     header: ({ column }) => <ColumnSort column={column} title="Source" />,
  //     cell: ({ row }) => row.getValue("source"),
  //     enableSorting: true,
  //   },
  //   {
  //     id: "actions",
  //     header: "",
  //     cell: (row: any) => (
  //       <DropdownMenu>
  //         <DropdownMenuTrigger asChild>
  //           <Button variant="ghost" className="h-8 w-8 p-0">
  //             <MoreHorizontal className="h-4 w-4" />
  //           </Button>
  //         </DropdownMenuTrigger>
  //         <DropdownMenuContent align="end">
  //           <DropdownMenuItem>View Details</DropdownMenuItem>
  //           <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
  //         </DropdownMenuContent>
  //       </DropdownMenu>
  //     ),
  //   },
];

/*
To implement filtering and sorting, you'll need:

1. For Filtering:
- Create a state for filters using useState or useReducer
- Implement filter functions for each column type
- Add filter components (e.g., dropdown, search input)
Example:
const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
table.setColumnFilters(columnFilters)

2. For Sorting:
- Create a state for sorting using useState
- Implement sort functions for different data types
- Use the built-in TanStack Table sorting functionality
Example:
const [sorting, setSorting] = useState<SortingState>([])
table.setSorting(sorting)

3. Utils needed:
- Filter utility functions for different data types (string, number, date)
- Sort utility functions for custom sorting logic
- Date formatting utilities for consistent date handling
*/
