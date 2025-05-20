import { supabase } from "@/core/lib/supabase/client";

type Profile = {
  userId: string;
  username: string | null;
  email: string | null;
  role: string | null;
  // isActive: boolean;
};

export const getUserProfile = async (
  userId: string
): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, username, email, role")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("[AUTH] Error getting profile:", error);
  }

  return data
    ? {
        userId: data.user_id,
        username: data.username,
        email: data.email,
        role: data.role,
      }
    : null;
};
