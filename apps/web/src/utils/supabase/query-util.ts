import { createClient } from "@/lib/supabase/client";
import type { Database, Tables } from "@/types/models/database.types";
import { SupabaseClient } from "@supabase/supabase-js";

// Type that extracts valid table names from the public schema
type PublicTableNames =
  | keyof Database["public"]["Tables"]
  | keyof Database["public"]["Views"];

/**
 * CRUD Helper utility for Supabase operations
 * @template T - Table name, constrained to valid tables in the public schema
 */
export class SupabaseQuery<T extends PublicTableNames> {
  private client: SupabaseClient;
  private tableName: T;

  // Cache for primary key columns to avoid repeated schema queries
  private static pkCache: Record<string, string> = {};

  constructor(tableName: T) {
    this.client = createClient();
    this.tableName = tableName;
  }

  /**
   * Discover the primary key column name for a table
   * Caches results to avoid repeated queries to information_schema
   */
  private async getPrimaryKeyColumn(): Promise<string> {
    // Return from cache if available
    if (SupabaseQuery.pkCache[this.tableName]) {
      return SupabaseQuery.pkCache[this.tableName] as string;
    }

    try {
      const { data, error } = await this.client
        .from("information_schema.key_column_usage")
        .select("column_name")
        .eq("table_schema", "public")
        .eq("table_name", this.tableName)
        .eq("constraint_name", `${this.tableName}_pkey`)
        .single();

      if (error) {
        console.warn(
          `Could not determine primary key for ${this.tableName}, using "id" as default. Error: ${error.message}`
        );
        // Cache default value to avoid repeated failed lookups
        SupabaseQuery.pkCache[this.tableName] = "id";
        return "id";
      }

      if (!data?.column_name) {
        console.warn(
          `No primary key found for ${this.tableName}, using "id" as default`
        );
        SupabaseQuery.pkCache[this.tableName] = "id";
        return "id";
      }

      // Cache the discovered primary key name
      SupabaseQuery.pkCache[this.tableName] = data.column_name;
      return data.column_name;
    } catch (error) {
      console.error(
        `Error discovering primary key for ${this.tableName}:`,
        error
      );
      // Use "id" as fallback and cache it
      SupabaseQuery.pkCache[this.tableName] = "id";
      return "id";
    }
  }

  /**
   * Get all records from the table
   */
  async getAll() {
    const { data, error } = await this.client.from(this.tableName).select("*");

    if (error) throw error;
    return data as Tables<T>[];
  }

  /**
   * Get a single record by ID
   * @param id - ID of the record to retrieve
   */
  async getById(id: string | number) {
    try {
      // Get primary key column name (cached after first call)
      const pkColumn = await this.getPrimaryKeyColumn();

      // Fetch the record using the appropriate primary key
      const { data, error } = await this.client
        .from(this.tableName)
        .select("*")
        .eq(pkColumn, id)
        .single();

      if (error) throw error;
      return data as Tables<T>;
    } catch (error) {
      console.error(`Error fetching record from ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Create a new record
   * @param record - Data to insert
   */
  async create(record: Partial<Tables<T>>) {
    const { data, error } = await this.client
      .from(this.tableName)
      .insert(record)
      .select()
      .single();

    if (error) throw error;
    return data as Tables<T>;
  }

  /**
   * Update an existing record
   * @param id - ID of the record to update
   * @param updates - Fields to update
   */
  async update(id: string | number, updates: Partial<Tables<T>>) {
    try {
      // Get primary key column name (cached after first call)
      const pkColumn = await this.getPrimaryKeyColumn();

      const { data, error } = await this.client
        .from(this.tableName)
        .update(updates)
        .eq(pkColumn, id)
        .select()
        .single();

      if (error) throw error;
      return data as Tables<T>;
    } catch (error) {
      console.error(`Error updating record in ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Delete a record
   * @param id - ID of the record to delete
   */
  async delete(id: string | number) {
    try {
      // Get primary key column name (cached after first call)
      const pkColumn = await this.getPrimaryKeyColumn();

      const { error } = await this.client
        .from(this.tableName)
        .delete()
        .eq(pkColumn, id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error(`Error deleting record from ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Custom query builder
   * @returns The Supabase query builder for this table
   */
  query() {
    return this.client.from(this.tableName);
  }
}

/**
 * Create a CRUD helper for a specific table
 * @param tableName - Name of the table, must be a valid table in the public schema
 */
export function createCrudHelper<T extends PublicTableNames>(tableName: T) {
  return new SupabaseQuery<T>(tableName);
}
