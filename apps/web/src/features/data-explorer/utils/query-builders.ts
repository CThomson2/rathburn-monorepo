import type { Database } from "@/types/models/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { FilterCondition, SortSpec } from "../types";
import { availableTables } from "../constants/tables";

type TableName = (typeof availableTables)[number]["name"];

export function buildFilterQuery(query: any, conditions: FilterCondition[]) {
  return conditions.reduce((acc, condition) => {
    const { column, operator, value } = condition;
    switch (operator) {
      case "eq":
        return acc.eq(column, value);
      case "neq":
        return acc.neq(column, value);
      case "gt":
        return acc.gt(column, value);
      case "gte":
        return acc.gte(column, value);
      case "lt":
        return acc.lt(column, value);
      case "lte":
        return acc.lte(column, value);
      case "like":
        return acc.like(column, `%${value}%`);
      case "ilike":
        return acc.ilike(column, `%${value}%`);
      default:
        return acc;
    }
  }, query);
}

export function buildSortQuery(query: any, specs: SortSpec[]) {
  return specs.reduce((acc, spec) => {
    const { column, direction } = spec;
    return acc.order(column, { ascending: direction === "asc" });
  }, query);
}
