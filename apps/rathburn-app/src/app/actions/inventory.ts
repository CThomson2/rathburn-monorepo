"use server";

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { type Database } from "@/types/supabase";

interface InventoryItem {
  id: string;
  // ... other fields
}

export async function getInventoryItems(db: Database) {
  const supabase = createServerComponentClient<Database>({ cookies });

  const { data, error } = await supabase
    .from("inventory_items")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Error fetching items: ${error.message}`);
  }

  return data;
}

export async function addInventoryItem(item: Partial<InventoryItem>) {
  const supabase = createServerComponentClient<Database>({ cookies });

  const { data, error } = await supabase
    .from("inventory_items")
    .insert([item])
    .select();

  if (error) {
    throw new Error(`Error adding item: ${error.message}`);
  }

  return data[0];
}

export async function updateInventoryItem(
  id: string,
  updates: Partial<InventoryItem>
) {
  const supabase = createServerComponentClient<Database>({ cookies });

  const { data, error } = await supabase
    .from("inventory_items")
    .update(updates)
    .eq("id", id)
    .select();

  if (error) {
    throw new Error(`Error updating item: ${error.message}`);
  }

  return data[0];
}
