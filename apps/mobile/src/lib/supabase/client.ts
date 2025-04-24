import { createBrowserClient } from "@supabase/ssr";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/models/database.types";

// Define custom types for our RPC functions
export type CustomTypes = Database & {
  public: {
    Functions: {
      create_user_with_passcode: {
        Args: { p_email: string; p_user_name: string; p_passcode: string };
        Returns: {
          user_id: string;
        };
      };
      create_mobile_app_passcode: {
        Args: { p_user_name: string; p_passcode: string; p_user_id: string };
        Returns: {
          user_id: string;
        };
      };
      validate_passcode: {
        Args: { p_user_name: string; p_passcode: string };
        Returns: {
          success: boolean;
          message?: string;
          locked_until?: number;
          attempts_remaining?: number;
          token?: string;
          user_id?: string;
        };
      };
      request_passcode_reset: {
        Args: { p_user_name: string };
        Returns: boolean;
      };
      reset_passcode_with_token: {
        Args: { p_token: string; p_new_passcode: string };
        Returns: boolean;
      };
    };
  };
};

/**
 * Creates and returns a Supabase client for browser usage
 */
export const createClient = () => {
  return createBrowserClient<CustomTypes>(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_ANON_KEY!
  );
};

/**
 * Type definition for a Supabase operation callback function
 */
export type SupabaseOperationCallback<T> = (
  db: SupabaseClient<CustomTypes>
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
  operation: SupabaseOperationCallback<T>
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
