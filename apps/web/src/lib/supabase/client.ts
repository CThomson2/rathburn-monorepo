"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/models/supabase";

export function createClient() {
  return createClientComponentClient<Database>();
}

export async function withSupabaseClient<T>(
  callback: (supabase: ReturnType<typeof createClient>) => Promise<T>,
  useNewClient = false
): Promise<T> {
  // This is just a placeholder for future implementation
  // In a real implementation, this would manage client creation and disposal
  const supabase = createClient();
  return callback(supabase);
}
