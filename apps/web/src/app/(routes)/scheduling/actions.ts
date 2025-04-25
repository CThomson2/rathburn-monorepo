import { createNewClient } from "@/lib/supabase/server";

export async function getAvailableDrums() {
  const supabase = createNewClient();
  const { data, error } = await supabase
    .from("drums")
    .select("*")
    .eq("status", "in_stock")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching available drums:", error);
    return [];
  }

  return data || [];
}

export async function getUpcomingDistillations() {
  const supabase = createNewClient();
  const { data, error } = await supabase
    .from("distillation_schedule")
    .select("*")
    .eq("status", "scheduled")
    .order("distillation_date", { ascending: true });

  if (error) {
    console.error("Error fetching distillation schedule:", error);
    return [];
  }

  return data || [];
}

export async function getPendingAssignments() {
  const supabase = createNewClient();
  const { data, error, count } = await supabase
    .from("distillation_pending_assignment")
    .select(
      `
        *,
        drum:drums(*)
      `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error fetching pending assignments:", error);
    return { assignments: [], total: 0 };
  }

  return { assignments: data || [], total: count || 0 };
}
