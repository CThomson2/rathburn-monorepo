"use server";

import { createClient } from "@/lib/supabase/server";
import { Database } from "@/types/supabase";

type DrumStatus =
  | "en route"
  | "in stock"
  | "scheduled"
  | "pre-production"
  | "in production"
  | "processed"
  | "second process"
  | "disposed"
  | "lost"
  | "empty";

/**
 * Get inventory data from the database
 * This action queries stock_drums and stock_materials tables
 * @returns {Promise<{data: any, error: any}>}
 */
export async function getInventory() {
  const supabase = createClient();

  // const { data: drums, error: drumsError } = await supabase
  //     .from("stock_drums")
  //     .select("*")
  //     .order("created_at", { ascending: false });

  // const { data: materials, error: materialsError } = await supabase
}

export async function updateDrumStatus(
  drumId: string,
  newStatus: DrumStatus,
  stockId?: string
) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated", data: null };
  }

  // Verify permission to send notifications
  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const roles = userRoles?.map((r) => r.role) || [];
  const canSendNotifications =
    roles.includes("admin") || roles.includes("manager");

  if (!canSendNotifications) {
    throw new Error("Not authorized to send notifications");
  }

  // Insert notification
  const { data, error } = await supabase.from();

  if (error) {
    throw new Error(`Failed to send notification: ${error.message}`);
  }

  return data[0];
}
