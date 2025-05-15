/**
 * This file provides model types for use across the application.
 * We're migrating from Prisma to Supabase, so we provide compatibility types
 * to make the transition smoother.
 */

import { Database, Tables } from "@/types/supabase";

// New Supabase-based types that should be used for new development
// These provide a cleaner way to access table types

type DBObject = "Table" | "View" | "Function";
/**
 * Type helper for checking if a table exists in the Database type
 */
type TableExists<T extends string> =
  T extends keyof Database["public"]["Tables"] ? T : never;

/**
 * Type helper for checking if a view exists in the Database type
 */
type ViewExists<T extends string> = T extends keyof Database["public"]["Views"]
  ? T
  : never;

/**
 * Type helper for checking if a function exists in the Database type
 */
type FunctionExists<T extends string> =
  T extends keyof Database["public"]["Functions"] ? T : never;

/**
 * Type helper for getting a table's row type from Supabase
 * Safely handles tables that might not exist yet during migration
 * @example
 * type User = TableType<'users'>
 */
export type TableType<T extends string> =
  T extends TableExists<T> ? Tables<T> : Record<string, any>; // Fallback type for tables that don't exist yet

/**
 * Type helper for getting a view's row type from Supabase
 * Safely handles views that might not exist yet during migration
 * @example
 * type User = ViewType<'users'>
 */
export type ViewType<T extends string> =
  T extends ViewExists<T>
    ? Database["public"]["Views"][T]["Row"]
    : Record<string, any>; // Fallback type for views that don't exist yet

/**
 * Type helper for getting a table's insert data type from Supabase
 * Safely handles tables that might not exist yet during migration
 * @example
 * type UserInsert = TableInsertType<'users'>
 */
export type TableInsertType<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

/**
 * Type helper for getting a table's update data type from Supabase
 * Safely handles tables that might not exist yet during migration
 * @example
 * type UserUpdate = TableUpdateType<'users'>
 */
export type TableUpdateType<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

/**
 * Type helper for getting multiple tables' row types from Supabase
 */
export type JoinedTableTypes<T extends string> = {
  [K in T]: TableType<K>;
};

// Common table types used throughout the application
// Using type assertions with fallbacks for tables that might not exist yet
export type Drum = TableType<"stock_drum">;
export type NewStock = TableType<"stock_new">;
export type ReproStock = TableType<"stock_repro">;
export type StockOrder = TableType<"stock_order">;
export type OrderDetail = TableType<"order_details">;
export type RawMaterial = TableType<"raw_materials">;
export type Product = TableType<"ref_product">;
export type ProductPrice = TableType<"product_prices">;
export type BottleSize = TableType<"bottle_sizes">;
export type Supplier = TableType<"ref_suppliers">;
export type Distillation = TableType<"distillation_schedule">;
export type DistillationRecord = TableType<"distillation_record">;
export type Still = TableType<"ref_stills">;
