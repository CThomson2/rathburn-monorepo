import { createClient } from "@/lib/supabase/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database, Tables } from "@/types/models/database.types";

/**
 * Response type for CRUD operations
 */
export interface Response<T> {
  data: T | null;
  error: string | null;
}

/**
 * Type for filtering conditions
 */
export type FilterCondition = {
  column: string;
  operator:
    | "eq"
    | "neq"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "like"
    | "ilike"
    | "is"
    | "in"
    | "cs"
    | "cd";
  value: any;
};

/**
 * Join configuration type
 */
export type JoinConfig = {
  table: string;
  columns?: string[];
  foreignTable?: string;
};

/**
 * Options for select queries
 */
export type SelectOptions = {
  columns?: string[];
  filters?: FilterCondition[];
  joins?: Record<string, JoinConfig | string[]>;
  orderBy?: { column: string; ascending?: boolean }[];
  limit?: number;
  offset?: number;
  single?: boolean;
};

/**
 * A class for handling Supabase CRUD operations with type safety
 */
export class SupabaseCRUD<T extends Record<string, any>> {
  private client: SupabaseClient;

  /**
   * Creates a new instance of SupabaseCRUD
   * @param table The table name
   * @param pkColumn The primary key column (defaults to 'id')
   */
  constructor(
    private table: string,
    private pkColumn: string = "id"
  ) {
    this.table = table;
    this.pkColumn = pkColumn;
    this.client = createClient();
  }

  /**
   * Fetches all records from the table
   */
  async fetchAll(): Promise<Response<T[]>> {
    try {
      const { data, error } = await this.client.from(this.table).select("*");

      if (error) throw error;

      return {
        data: data as T[],
        error: null,
      };
    } catch (err: any) {
      console.error(`Error fetching all records from ${this.table}:`, err);
      return {
        data: null,
        error: err.message,
      };
    }
  }

  /**
   * Performs a select query with various options
   * @param options Query options including columns, filters, joins, etc.
   */
  async select(options: SelectOptions = {}): Promise<Response<T[] | T>> {
    try {
      const {
        columns = ["*"],
        filters = [],
        joins = {},
        orderBy = [],
        limit,
        offset,
        single = false,
      } = options;

      // Build the columns string with any joins
      let columnsString = columns.join(", ");

      // Add joins if specified
      if (Object.keys(joins).length > 0) {
        const joinStrings = Object.entries(joins).map(
          ([foreignTable, config]) => {
            if (Array.isArray(config)) {
              // Simple join with just columns
              return `${foreignTable}(${config.join(", ")})`;
            } else {
              // Complex join with nested configuration
              const nestedTable = config.foreignTable || foreignTable;
              const nestedColumns = config.columns?.join(", ") || "*";
              return `${nestedTable}(${nestedColumns})`;
            }
          }
        );

        if (columnsString === "*") {
          columnsString = `*, ${joinStrings.join(", ")}`;
        } else {
          columnsString = `${columnsString}, ${joinStrings.join(", ")}`;
        }
      }

      // Start building the query
      let query = this.client.from(this.table).select(columnsString);

      // Apply filters
      filters.forEach((filter) => {
        const { column, operator, value } = filter;
        switch (operator) {
          case "eq":
            query = query.eq(column, value);
            break;
          case "neq":
            query = query.neq(column, value);
            break;
          case "gt":
            query = query.gt(column, value);
            break;
          case "gte":
            query = query.gte(column, value);
            break;
          case "lt":
            query = query.lt(column, value);
            break;
          case "lte":
            query = query.lte(column, value);
            break;
          case "like":
            query = query.like(column, value);
            break;
          case "ilike":
            query = query.ilike(column, value);
            break;
          case "is":
            query = query.is(column, value);
            break;
          case "in":
            query = query.in(column, value);
            break;
          case "cs":
            query = query.contains(column, value);
            break;
          case "cd":
            query = query.containedBy(column, value);
            break;
        }
      });

      // Apply ordering
      orderBy.forEach(({ column, ascending = true }) => {
        query = query.order(column, { ascending });
      });

      // Apply pagination
      if (limit !== undefined) {
        query = query.limit(limit);
      }

      if (offset !== undefined) {
        query = query.range(offset, offset + (limit || 10) - 1);
      }

      // Execute query
      const { data, error } = single ? await query.single() : await query;

      if (error) throw error;

      return {
        data: single ? (data as unknown as T) : (data as unknown as T[]),
        error: null,
      };
    } catch (err: any) {
      console.error(`Error selecting from ${this.table}:`, err);
      return {
        data: null,
        error: err.message,
      };
    }
  }

  /**
   * Fetches a single record by its primary key
   * @param id The primary key value
   */
  async fetchById(id: number | string): Promise<Response<T>> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .select("*")
        .eq(this.pkColumn, id)
        .single();

      if (error) throw error;

      return {
        data: data as T,
        error: null,
      };
    } catch (err: any) {
      console.error(`Error fetching record ${id} from ${this.table}:`, err);
      return {
        data: null,
        error: err.message,
      };
    }
  }

  /**
   * Counts records based on filters
   * @param filters Optional filters to apply
   */
  async count(filters: FilterCondition[] = []): Promise<Response<number>> {
    try {
      let query = this.client
        .from(this.table)
        .select("*", { count: "exact", head: true });

      // Apply filters
      filters.forEach((filter) => {
        const { column, operator, value } = filter;
        switch (operator) {
          case "eq":
            query = query.eq(column, value);
            break;
          case "neq":
            query = query.neq(column, value);
            break;
          case "gt":
            query = query.gt(column, value);
            break;
          case "gte":
            query = query.gte(column, value);
            break;
          case "lt":
            query = query.lt(column, value);
            break;
          case "lte":
            query = query.lte(column, value);
            break;
          case "like":
            query = query.like(column, value);
            break;
          case "ilike":
            query = query.ilike(column, value);
            break;
          case "is":
            query = query.is(column, value);
            break;
          case "in":
            query = query.in(column, value);
            break;
          case "cs":
            query = query.contains(column, value);
            break;
          case "cd":
            query = query.containedBy(column, value);
            break;
        }
      });

      const { count, error } = await query;

      if (error) throw error;

      return {
        data: count || 0,
        error: null,
      };
    } catch (err: any) {
      console.error(`Error counting records in ${this.table}:`, err);
      return {
        data: null,
        error: err.message,
      };
    }
  }

  /**
   * Performs a custom RPC function call
   * @param functionName The function name to call
   * @param params Parameters to pass
   */
  async rpc<R = any>(
    functionName: string,
    params: Record<string, any> = {}
  ): Promise<Response<R>> {
    try {
      const { data, error } = await this.client.rpc(functionName, params);

      if (error) throw error;

      return {
        data: data as R,
        error: null,
      };
    } catch (err: any) {
      console.error(`Error calling RPC function ${functionName}:`, err);
      return {
        data: null,
        error: err.message,
      };
    }
  }

  /**
   * Creates a new record
   * @param record The record to create
   */
  async create(record: Partial<T>): Promise<Response<T>> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .insert(record)
        .select()
        .single();

      if (error) throw error;

      return {
        data: data as T,
        error: null,
      };
    } catch (err: any) {
      console.error(`Error creating record in ${this.table}:`, err);
      return {
        data: null,
        error: err.message,
      };
    }
  }

  /**
   * Updates a record by its primary key
   * @param id The primary key value
   * @param record The record updates
   */
  async update(id: number | string, record: Partial<T>): Promise<Response<T>> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .update(record)
        .eq(this.pkColumn, id)
        .select()
        .single();

      if (error) throw error;

      return {
        data: data as T,
        error: null,
      };
    } catch (err: any) {
      console.error(`Error updating record ${id} in ${this.table}:`, err);
      return {
        data: null,
        error: err.message,
      };
    }
  }

  /**
   * Updates multiple records based on filters
   * @param record The record updates
   * @param filters Filters to determine which records to update
   */
  async updateMany(
    record: Partial<T>,
    filters: FilterCondition[] = []
  ): Promise<Response<T[]>> {
    try {
      let query = this.client.from(this.table).update(record);

      // Apply filters
      filters.forEach((filter) => {
        const { column, operator, value } = filter;
        switch (operator) {
          case "eq":
            query = query.eq(column, value);
            break;
          case "neq":
            query = query.neq(column, value);
            break;
          case "gt":
            query = query.gt(column, value);
            break;
          case "gte":
            query = query.gte(column, value);
            break;
          case "lt":
            query = query.lt(column, value);
            break;
          case "lte":
            query = query.lte(column, value);
            break;
          case "like":
            query = query.like(column, value);
            break;
          case "ilike":
            query = query.ilike(column, value);
            break;
          case "is":
            query = query.is(column, value);
            break;
          case "in":
            query = query.in(column, value);
            break;
          case "cs":
            query = query.contains(column, value);
            break;
          case "cd":
            query = query.containedBy(column, value);
            break;
        }
      });

      const { data, error } = await query.select();

      if (error) throw error;

      return {
        data: data as T[],
        error: null,
      };
    } catch (err: any) {
      console.error(`Error updating multiple records in ${this.table}:`, err);
      return {
        data: null,
        error: err.message,
      };
    }
  }

  /**
   * Upserts a record (insert if not exists, update if exists)
   * @param record The record to upsert
   */
  async upsert(record: Partial<T>): Promise<Response<T>> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .upsert(record)
        .select()
        .single();

      if (error) throw error;

      return {
        data: data as T,
        error: null,
      };
    } catch (err: any) {
      console.error(`Error upserting record in ${this.table}:`, err);
      return {
        data: null,
        error: err.message,
      };
    }
  }

  /**
   * Deletes a record by its primary key
   * @param id The primary key value
   */
  async delete(id: number | string): Promise<Response<null>> {
    try {
      const { error } = await this.client
        .from(this.table)
        .delete()
        .eq(this.pkColumn, id);

      if (error) throw error;

      return {
        data: null,
        error: null,
      };
    } catch (err: any) {
      console.error(`Error deleting record ${id} from ${this.table}:`, err);
      return {
        data: null,
        error: err.message,
      };
    }
  }

  /**
   * Deletes multiple records based on filters
   * @param filters Filters to determine which records to delete
   */
  async deleteMany(filters: FilterCondition[] = []): Promise<Response<null>> {
    try {
      let query = this.client.from(this.table).delete();

      // Apply filters (must have at least one filter for safety)
      if (filters.length === 0) {
        throw new Error(
          "At least one filter is required for deleteMany operation"
        );
      }

      filters.forEach((filter) => {
        const { column, operator, value } = filter;
        switch (operator) {
          case "eq":
            query = query.eq(column, value);
            break;
          case "neq":
            query = query.neq(column, value);
            break;
          case "gt":
            query = query.gt(column, value);
            break;
          case "gte":
            query = query.gte(column, value);
            break;
          case "lt":
            query = query.lt(column, value);
            break;
          case "lte":
            query = query.lte(column, value);
            break;
          case "like":
            query = query.like(column, value);
            break;
          case "ilike":
            query = query.ilike(column, value);
            break;
          case "is":
            query = query.is(column, value);
            break;
          case "in":
            query = query.in(column, value);
            break;
          case "cs":
            query = query.contains(column, value);
            break;
          case "cd":
            query = query.containedBy(column, value);
            break;
        }
      });

      const { error } = await query;

      if (error) throw error;

      return {
        data: null,
        error: null,
      };
    } catch (err: any) {
      console.error(`Error deleting multiple records from ${this.table}:`, err);
      return {
        data: null,
        error: err.message,
      };
    }
  }
}

/**
 * Creates a type-safe CRUD instance for a specific table
 * @param table The table name
 * @param pkColumn The primary key column (defaults to 'id')
 */
export function createCRUD<
  TableName extends keyof Database["public"]["Tables"],
>(table: TableName, pkColumn: string = "id"): SupabaseCRUD<Tables<TableName>> {
  return new SupabaseCRUD<Tables<TableName>>(table as string, pkColumn);
}
