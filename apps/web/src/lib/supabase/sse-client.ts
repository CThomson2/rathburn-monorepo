import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/models/database.types";

/**
 * Creates a Supabase client specifically for server-side event (SSE) routes
 * This client uses the service role key for admin-level access needed for realtime subscriptions
 */
export const createSSEClient = () => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase environment variables for SSE client");
  }

  return createClient<Database>(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};

// Export a pre-initialized instance for convenience
export const supabase = createSSEClient();
