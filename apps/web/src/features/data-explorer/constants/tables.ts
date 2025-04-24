import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { FilterCondition, SortSpec, TableDataOptions } from "../types";
import type { Database } from "@/types/models/supabase"";

type TableNames = keyof (Database["public"]["Tables"] &
  Database["public"]["Views"]);

export const availableTables = [
  { name: "stock_drum" as const, description: "Current drum inventory" },
  { name: "ref_materials" as const, description: "Material reference data" },
  { name: "ref_suppliers" as const, description: "Supplier reference data" },
  { name: "stock_order" as const, description: "Stock order records" },
  { name: "order_detail" as const, description: "Order detail records" },
  { name: "log_drum_scan" as const, description: "Drum scan log records" },
] as const;

export type AvailableTable = (typeof availableTables)[number]["name"];

/**
 * Builds a Supabase query with the given filter and sort options
 *
 * @param table - The table name to query
 * @param options - Query options including filters, sorts, and pagination
 * @returns A configured Supabase query builder
 */
export function buildQuery(table: string, options?: TableDataOptions) {
  const supabase = createClient();

  // Start with a basic query - using type assertion to bypass strict typing
  const query = (supabase as any)
    .from(table)
    .select(
      options?.columns && options.columns.length > 0
        ? options.columns.join(",")
        : "*"
    );

  // Apply filters
  if (options?.filters && options.filters.length > 0) {
    options.filters.forEach((filter) => {
      const { column, operator, value } = filter;

      // Use a switch to handle different operator types
      switch (operator) {
        case "eq":
          query.eq(column, value);
          break;
        case "neq":
          query.neq(column, value);
          break;
        case "gt":
          query.gt(column, value);
          break;
        case "gte":
          query.gte(column, value);
          break;
        case "lt":
          query.lt(column, value);
          break;
        case "lte":
          query.lte(column, value);
          break;
        case "like":
          query.like(column, `%${value}%`);
          break;
        case "ilike":
          query.ilike(column, `%${value}%`);
          break;
        case "is":
          query.is(column, value === "null" ? null : value);
          break;
        case "in":
          try {
            const values = JSON.parse(value);
            if (Array.isArray(values)) {
              query.in(column, values);
            }
          } catch (e) {
            console.error("Error parsing 'in' values:", e);
          }
          break;
      }
    });
  }

  // Apply sorting
  if (options?.sorts && options.sorts.length > 0) {
    options.sorts.forEach((sort) => {
      query.order(sort.column, { ascending: sort.direction === "asc" });
    });
  }

  // Apply pagination
  if (options?.pagination) {
    const { page = 1, pageSize = 20 } = options.pagination;
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;
    query.range(start, end);
  }

  return query;
}
