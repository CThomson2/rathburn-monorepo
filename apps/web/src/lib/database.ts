/**
 * Unified database access layer
 *
 * This file provides a consistent API for database operations using Supabase.
 * All database access should use these helpers for consistency.
 */

import { withSupabaseClient } from "./supabase/client";
import { Database, Tables } from "@/types/models/supabase"";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  TableType,
  TableInsertType,
  TableUpdateType,
} from "@/types/models/base";

/**
 * Type for database operation functions with Supabase
 */
export type SupabaseOperation<T> = (
  client: SupabaseClient<Database>
) => Promise<T>;

/**
 * Execute a database operation
 *
 * @example
 * const users = await executeDbOperation(
 *   async (client) => {
 *     const { data } = await client.from('users').select('*');
 *     return data;
 *   }
 * );
 */
export async function executeDbOperation<T>(
  operation: SupabaseOperation<T>
): Promise<T> {
  return withSupabaseClient(operation);
}

/**
 * Type-safe helper for selecting data from a table
 *
 * @example
 * const users = await selectFromTable('users');
 * const activeUsers = await selectFromTable('users', {
 *   filters: { is_active: true },
 *   limit: 10
 * });
 */
export async function selectFromTable<
  T extends
    | keyof Database["public"]["Tables"]
    | keyof Database["public"]["Views"],
>(
  table: T,
  options: {
    columns?: string;
    filters?: Record<string, any>;
    limit?: number;
    offset?: number;
    orderBy?: { column: string; ascending?: boolean };
  } = {}
): Promise<
  (T extends keyof Database["public"]["Tables"] ? Tables<T> : Tables<T>)[]
> {
  return executeDbOperation(async (client) => {
    // Use type casting to avoid TypeScript errors
    const typedClient = client as any;
    let query = typedClient.from(table);

    if (options.columns) {
      query = query.select(options.columns);
    } else {
      query = query.select();
    }

    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(
        options.offset,
        options.offset + (options.limit || 10) - 1
      );
    }

    if (options.orderBy) {
      query = query.order(options.orderBy.column, {
        ascending: options.orderBy.ascending ?? true,
      });
    }

    const { data, error } = await query;

    if (error) {
      console.error("Database query error:", error);
      throw new Error(error.message);
    }

    return data;
  });
}

/**
 * Type-safe helper for inserting data into a table
 *
 * @example
 * const newUser = await insertIntoTable('users', {
 *   name: 'John Doe',
 *   email: 'john@example.com'
 * });
 */
export async function insertIntoTable<
  T extends keyof Database["public"]["Tables"],
>(
  table: T,
  data: TableInsertType<T> | TableInsertType<T>[],
  options: {
    returning?: boolean;
  } = { returning: true }
): Promise<Tables<T> | Tables<T>[] | null> {
  return executeDbOperation(async (client) => {
    // Use type casting to avoid TypeScript errors
    const typedClient = client as any;
    const query = typedClient.from(table).insert(data);

    if (options.returning) {
      const { data: result, error } = await query.select();

      if (error) {
        throw error;
      }

      // Type assertion here is necessary because Supabase doesn't preserve the exact types
      return (Array.isArray(data) ? result : result[0]) as
        | Tables<T>
        | Tables<T>[];
    } else {
      const { error } = await query;

      if (error) {
        throw error;
      }

      return null;
    }
  });
}

/**
 * Type-safe helper for updating data in a table
 *
 * @example
 * const updatedUser = await updateTable('users',
 *   { is_active: false },
 *   { id: 123 }
 * );
 */
export async function updateTable<T extends keyof Database["public"]["Tables"]>(
  table: T,
  data: TableUpdateType<T>,
  filters: Record<string, any>,
  options: {
    returning?: boolean;
  } = { returning: true }
): Promise<Tables<T>[] | null> {
  return executeDbOperation(async (client) => {
    // Use type casting to avoid TypeScript errors
    const typedClient = client as any;
    let query = typedClient.from(table).update(data);

    // Apply filters
    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value);
    }

    if (options.returning) {
      const { data: result, error } = await query.select();

      if (error) {
        throw error;
      }

      return (result || []) as Tables<T>[];
    } else {
      const { error } = await query;

      if (error) {
        throw error;
      }

      return null;
    }
  });
}

/**
 * Type-safe helper for deleting data from a table
 *
 * @example
 * await deleteFromTable('users', { id: 123 });
 */
export async function deleteFromTable<
  T extends keyof Database["public"]["Tables"],
>(
  table: T,
  filters: Record<string, any>,
  options: {
    returning?: boolean;
  } = { returning: false }
): Promise<Tables<T>[] | null> {
  return executeDbOperation(async (client) => {
    // Use type casting to avoid TypeScript errors
    const typedClient = client as any;
    let query = typedClient.from(table).delete();

    // Apply filters
    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value);
    }

    if (options.returning) {
      const { data: result, error } = await query.select();

      if (error) {
        throw error;
      }

      return (result || []) as Tables<T>[];
    } else {
      const { error } = await query;

      if (error) {
        throw error;
      }

      return null;
    }
  });
}

/**
 * Count records in a table with optional filters
 *
 * @example
 * const totalUsers = await countTable('users');
 * const activeUsers = await countTable('users', { is_active: true });
 */
export async function countTable<T extends keyof Database["public"]["Tables"]>(
  table: T,
  filters?: Record<string, any>
): Promise<number> {
  return executeDbOperation(async (client) => {
    // Use type casting to avoid TypeScript errors
    const typedClient = client as any;
    let query = typedClient
      .from(table)
      .select("*", { count: "exact", head: true });

    // Apply filters if provided
    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        query = query.eq(key, value);
      }
    }

    const { count, error } = await query;

    if (error) {
      throw error;
    }

    return count || 0;
  });
}

/**
 * Execute a raw SQL query with Supabase
 *
 * @example
 * const materials = await executeRawQuery(
 *   'SELECT * FROM "public"."raw_materials" WHERE chemical_group = $1',
 *   ['solvents']
 * );
 */
export async function executeRawQuery<T = any>(
  query: string,
  params?: any[]
): Promise<T[]> {
  return executeDbOperation(async (client) => {
    // Use type casting to avoid TypeScript errors
    const typedClient = client as any;

    // We need to define our own RPC function for this in Supabase
    const { data, error } = await typedClient.rpc("execute_sql", {
      query_text: query,
      query_params: params || [],
    });

    if (error) {
      throw error;
    }

    // Use explicit type assertion
    return (data || []) as unknown as T[];
  });
}

/**
 * Get a paginated response with total count
 *
 * @example
 * const { data, total } = await getPaginatedData('users', {
 *   page: 1,
 *   pageSize: 20,
 *   filters: { is_active: true },
 *   sortBy: 'created_at',
 *   sortOrder: 'desc'
 * });
 */
export async function getPaginatedData<
  T extends keyof Database["public"]["Tables"],
>(
  table: T,
  options: {
    page?: number;
    pageSize?: number;
    filters?: Record<string, any>;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    columns?: string;
  } = {}
): Promise<{
  data: Tables<T>[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}> {
  const {
    page = 1,
    pageSize = 20,
    filters,
    sortBy,
    sortOrder = "desc",
    columns,
  } = options;

  // Calculate the offset based on page and pageSize
  const offset = (page - 1) * pageSize;

  return executeDbOperation(async (client) => {
    // Use type casting to avoid TypeScript errors
    const typedClient = client as any;

    // First, get the total count
    let countQuery = typedClient
      .from(table)
      .select("*", { count: "exact", head: true });

    // Apply filters to count query
    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        countQuery = countQuery.eq(key, value);
      }
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      throw countError;
    }

    // Then get the data with pagination
    let dataQuery = typedClient.from(table).select(columns || "*");

    // Apply filters
    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        dataQuery = dataQuery.eq(key, value);
      }
    }

    // Apply sorting
    if (sortBy) {
      dataQuery = dataQuery.order(sortBy, { ascending: sortOrder === "asc" });
    }

    // Apply pagination
    dataQuery = dataQuery.range(offset, offset + pageSize - 1);

    const { data, error: dataError } = await dataQuery;

    if (dataError) {
      throw dataError;
    }

    const total = count || 0;
    const pageCount = Math.ceil(total / pageSize);

    return {
      data: (data || []) as Tables<T>[],
      total,
      page,
      pageSize,
      pageCount,
    };
  });
}

/**
 * Get a single record by its ID
 *
 * @example
 * const user = await getById('users', 123);
 */
export async function getById<T extends keyof Database["public"]["Tables"]>(
  table: T,
  id: number | string,
  options: {
    idField?: string;
    columns?: string;
  } = {}
): Promise<Tables<T> | null> {
  const { idField = "id", columns } = options;

  return executeDbOperation(async (client) => {
    // Use type casting to avoid TypeScript errors
    const typedClient = client as any;
    const { data, error } = await typedClient
      .from(table)
      .select(columns || "*")
      .eq(idField, id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data as Tables<T> | null;
  });
}
