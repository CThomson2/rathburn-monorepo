"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type UserRole = "production" | "management" | "admin";

interface UserRoleData {
  id: string;
  email: string;
  role: UserRole;
}

/**
 * Get the user's role from Supabase
 * This function retrieves the user's role from a profiles or users table
 */
export async function getUserRole(): Promise<UserRole | null> {
  const supabase = await createClient();

  // Get the current user session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return null;
  }

  // Here you would fetch the user's role from your database
  // This is just an example, replace with your actual query
  const { data, error } = await supabase
    .from("profiles") // Assuming you have a profiles table with roles
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (error || !data) {
    console.error("Error fetching user role:", error);
    return null;
  }

  return data.role as UserRole;
}

/**
 * Redirect the user to their role-specific dashboard
 */
export async function redirectToDashboard() {
  const role = await getUserRole();

  if (!role) {
    // If no role is found, redirect to a default dashboard or error page
    return redirect("/dashboard");
  }

  // Redirect based on user role
  switch (role) {
    case "production":
      return redirect("/dashboard/production");
    case "management":
      return redirect("/dashboard/management");
    case "admin":
      return redirect("/dashboard/admin");
    default:
      return redirect("/dashboard");
  }
}

/**
 * Save dashboard customization settings
 */
export async function saveDashboardSettings(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return { success: false, message: "Not authenticated" };
  }

  // Extract settings from form data
  const settings = {
    theme: formData.get("theme"),
    layout: formData.get("layout"),
    widgets: formData.get("widgets"),
    favourites: formData.get("favourites"),
    // Add other settings as needed
  };

  // Save to database
  const { error } = await supabase.from("dashboard_settings").upsert({
    user_id: session.user.id,
    settings: settings,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Error saving dashboard settings:", error);
    return { success: false, message: "Failed to save settings" };
  }

  return { success: true, message: "Settings saved successfully" };
}
