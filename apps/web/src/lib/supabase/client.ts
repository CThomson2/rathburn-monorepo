import { createBrowserClient } from "@supabase/ssr";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/models/supabase";

type SchemaName = "auth_ext" | "config" | "logs" | "production" | "public" | "inventory";

/**
 * Creates and returns a Supabase client for browser usage
 */
export const createClient = () => {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

export const createNewClient = () => {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL_NEW!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_NEW!
  );
}
// export function createNewClient<T extends SchemaName = "public">(schemaName: T = "public" as T) {
//   return createBrowserClient<Database, T>(
//     process.env.NEXT_PUBLIC_SUPABASE_URL_NEW!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_NEW!
//   );
// }

/**
 * Type definition for a Supabase operation callback function
 */
export type SupabaseOperationCallback<T> = (
  db: SupabaseClient<Database>
) => Promise<T>;

/**
 * Executes a Supabase operation with proper connection handling.
 * This provides a consistent pattern for Supabase client usage.
 *
 * @example
 * const result = await withSupabaseClient(async (supabase) => {
 *   return await supabase.from("drums").select("*");
 * });
 */
export const withSupabaseClient = async <T>(
  operation: SupabaseOperationCallback<T>,
): Promise<T> => {
  const db = createNewClient();
  try {
    // Execute the provided operation with the SupabaseClient instance
    return await operation(db);
  } catch (error) {
    console.error("Supabase operation failed:", error);
    throw error;
  }
};

export const withViewSupabaseClient = async <T>(
  operation: SupabaseOperationCallback<T>,
): Promise<T> => {
  const db = createClient();
  try {
    // Execute the provided operation with the SupabaseClient instance
    return await operation(db);
  } catch (error) {
    console.error("Supabase operation failed:", error);
    throw error;
  }
};
