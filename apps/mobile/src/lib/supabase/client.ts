import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

/**
 * Creates and returns a Supabase client for browser usage
 */
export const createClient = () => {
  // Check if we're in development mode
  const isDev = import.meta.env.MODE === "development";

  // Configure client options to prevent CORS issues
  const options = {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      fetch: (url: RequestInfo | URL, options: RequestInit = {}) => {
        // Set specific options for fetch to avoid CORS issues
        options.credentials = 'omit';
        return fetch(url, options);
      }
    },
    ...(isDev ? {
      realtime: {
        params: {
              eventsPerSecond: 10,
            },
          },
        }
      : {}),
  };
  
  return createSupabaseClient<Database>(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_ANON_KEY!,
    options
  );
};

export const createAuthClient = () => {
  const isDev = import.meta.env.MODE === "development";
  
  // Configure client options to prevent CORS issues
  const options = {
    auth: {
      persistSession: true,  
      autoRefreshToken: true,
    },
    global: {
      fetch: (url: RequestInfo | URL, options: RequestInit = {}) => {
        // Set specific options for fetch to avoid CORS issues
        options.credentials = 'omit';
        return fetch(url, options);
      }
    },
    ...(isDev ? {
      realtime: {
        params: {
              eventsPerSecond: 10,
            },
          },
        }
      : {}),
  };
  return createSupabaseClient(
    import.meta.env.VITE_SUPABASE_URL_AUTH!,
    import.meta.env.VITE_SUPABASE_ANON_KEY_AUTH!,
    options
  );
}

/**
 * Type definition for a Supabase operation callback function
 */
export type SupabaseOperationCallback<T> = (
  db: ReturnType<typeof createClient>
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
