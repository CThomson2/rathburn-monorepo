import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Database } from "@rathburn/types";

// Singleton instance of the Supabase client
let supabaseInstance: ReturnType<typeof createSupabaseClient<Database>> | null = null;

/**
 * Creates and returns a Supabase client singleton for browser usage
 * This ensures only one instance of the client is created across the application
 */
export const createClient = () => {
  // Return existing instance if it exists
  if (supabaseInstance !== null) {
    return supabaseInstance;
  }

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
    } : {}),
  };
  
  // Create a new instance and store it
  supabaseInstance = createSupabaseClient<Database>(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_ANON_KEY!,
    options
  );
  
  return supabaseInstance;
};

/**
 * Type definition for a Supabase operation callback function
 */
type SupabaseOperationCallback<T> = (
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

/**
 * Get the singleton instance of the Supabase client
 * This is the preferred way to access the client
 */
export const supabase = createClient();

// Default export for backward compatibility
export default createClient;