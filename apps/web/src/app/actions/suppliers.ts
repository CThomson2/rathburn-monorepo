"use server";

import { executeServerDbOperation } from "@/lib/database";
import { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

/**
 * Fetches all suppliers for dropdown selection
 * Returns a simplified list of suppliers with id and name
 */
export async function fetchSuppliers(): Promise<
  Array<{ id: string; name: string }>
> {
  return await executeServerDbOperation(async (supabase: SupabaseClient) => {
    const { data, error } = await supabase
      .schema("inventory")
      .from("suppliers")
      .select("supplier_id, name")
      .order("name");

    if (error) {
      console.error("Error fetching suppliers:", error);
      return [];
    }

    return data.map((supplier) => ({
      id: supplier.supplier_id.toString(),
      name: supplier.name,
    }));
  });
}

/**
 * Searches suppliers with a prefix filter
 * Much faster than a full text search for autocomplete purposes
 */
export async function searchSuppliers(
  prefix: string
): Promise<Array<{ id: string; name: string }>> {
  // If empty prefix, return first 10 suppliers alphabetically
  if (!prefix.trim()) {
    return await executeServerDbOperation(async (supabase: SupabaseClient) => {
      const { data, error } = await supabase
        .schema("inventory")
        .from("suppliers")
        .select("supplier_id, name")
        .order("name")
        .limit(10);

      if (error) {
        console.error("Error fetching suppliers:", error);
        return [];
      }

      return data.map((supplier) => ({
        id: supplier.supplier_id.toString(),
        name: supplier.name,
      }));
    });
  }

  // Otherwise search with prefix
  return await executeServerDbOperation(async (supabase: SupabaseClient) => {
    const { data, error } = await supabase
      .schema("inventory")
      .from("suppliers")
      .select("supplier_id, name")
      .ilike("name", `${prefix}%`)
      .order("name")
      .limit(10);

    if (error) {
      console.error("Error searching suppliers:", error);
      return [];
    }

    return data.map((supplier) => ({
      id: supplier.supplier_id.toString(),
      name: supplier.name,
    }));
  });
}

/**
 * Searches items (supplier-specific materials) for a specific supplier with a prefix filter
 * Returns a filtered list of items with id and name
 */
export async function searchItemsBySupplier(
  supplierId: string,
  prefix: string
): Promise<Array<{ id: string; name: string; materialId: string }>> {
  if (!supplierId) {
    return [];
  }

  // If empty prefix, return first 10 items for this supplier
  if (!prefix.trim()) {
    return await executeServerDbOperation(async (supabase: SupabaseClient) => {
      const { data, error } = await supabase
        .schema("inventory")
        .from("items")
        .select("item_id, name, material_id")
        .eq("supplier_id", supplierId)
        .order("name")
        .limit(10);

      if (error) {
        console.error("Error fetching items by supplier:", error);
        return [];
      }

      return data.map((item) => ({
        id: item.item_id,
        name: item.name,
        materialId: item.material_id,
      }));
    });
  }

  // Otherwise search with prefix
  return await executeServerDbOperation(async (supabase: SupabaseClient) => {
    const { data, error } = await supabase
      .schema("inventory")
      .from("items")
      .select("item_id, name, material_id")
      .eq("supplier_id", supplierId)
      .ilike("name", `${prefix}%`)
      .order("name")
      .limit(10);

    if (error) {
      console.error("Error searching items by supplier:", error);
      return [];
    }

    return data.map((item) => ({
      id: item.item_id,
      name: item.name,
      materialId: item.material_id,
    }));
  });
}

/**
 * Fetches items (supplier-specific materials) for a specific supplier
 * Returns a list of items with id and name
 */
export async function fetchItemsBySupplier(
  supplierId: string
): Promise<Array<{ id: string; name: string; materialId: string }>> {
  if (!supplierId) {
    return [];
  }

  return await executeServerDbOperation(async (supabase: SupabaseClient) => {
    const { data, error } = await supabase
      .schema("inventory")
      .from("items")
      .select("item_id, name, material_id")
      .eq("supplier_id", supplierId)
      .order("name");

    if (error) {
      console.error("Error fetching items by supplier:", error);
      return [];
    }

    return data.map((item) => ({
      id: item.item_id,
      name: item.name,
      materialId: item.material_id,
    }));
  });
}
