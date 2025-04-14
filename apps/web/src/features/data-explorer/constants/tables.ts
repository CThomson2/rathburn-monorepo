import { createClient } from "@/lib/supabase/client";
import type {
  SupabaseClient,
  PostgrestQueryBuilder,
} from "@supabase/supabase-js";
import { FilterCondition, SortSpec, TableDataOptions } from "../types";
import type { Database } from "@/types/models/database.types";

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
 * Build a query with the given sort specifications
 */
export function buildSortQuery(
  query: PostgrestQueryBuilder<any>,
  sorts: SortSpec[]
) {
  return sorts.reduce((acc, sort) => {
    return acc.order(sort.column, { ascending: sort.ascending });
  }, query);
}

/**
 * Build a query with the given filter conditions
 */
export function buildFilterQuery(
  query: PostgrestQueryBuilder<any>,
  filters: FilterCondition[]
) {
  return filters.reduce((acc, filter) => {
    switch (filter.operator) {
      case "eq":
        return acc.eq(filter.column, filter.value);
      case "neq":
        return acc.neq(filter.column, filter.value);
      case "gt":
        return acc.gt(filter.column, filter.value);
      case "gte":
        return acc.gte(filter.column, filter.value);
      case "lt":
        return acc.lt(filter.column, filter.value);
      case "lte":
        return acc.lte(filter.column, filter.value);
      case "like":
        return acc.like(filter.column, filter.value);
      case "ilike":
        return acc.ilike(filter.column, filter.value);
      case "is":
        return acc.is(filter.column, filter.value);
      default:
        return acc;
    }
  }, query);
}

export function buildQuery<T extends AvailableTable>(
  table: T,
  options?: TableDataOptions
): PostgrestQueryBuilder<Database["public"]["Tables"][T]> {
  const supabase = createClient();
  let query = supabase.from(table);

  if (options?.filters) {
    options.filters.forEach((filter: FilterCondition) => {
      query = query.filter(filter.column, filter.operator, filter.value);
    });
  }

  if (options?.sort) {
    const { column, ascending } = options.sort as SortSpec;
    query = query.order(column, { ascending });
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  return query;
}
