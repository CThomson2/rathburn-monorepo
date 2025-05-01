import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient as createBrowserClient } from "@supabase/supabase-js";

// This function creates a Supabase client that works in both server components
// and during static build/generation
export const createClient = () => {
  // Check if we're in a browser-like environment without cookies
  // This is needed for static site generation and standalone builds
  let isBuildTime = false;

  try {
    // This will throw an error during build/static generation
    cookies();
  } catch (error) {
    // We're likely in a build context, use the browser client instead
    isBuildTime = true;
    console.log("Using browser client for build-time operation");
  }

  if (isBuildTime) {
    // Use the browser client during build time
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      console.error("Missing Supabase environment variables during build time");
    }
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  // In server context, use the full server client
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Fix the type issue with sameSite by ensuring it's a valid value
              const sanitizedOptions = options
                ? {
                    ...options,
                    sameSite:
                      options.sameSite === true
                        ? "lax"
                        : options.sameSite === false
                          ? undefined
                          : options.sameSite,
                  }
                : options;

              cookieStore.set(name, value, sanitizedOptions);
            });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
};

// Temporary second client for new database instance (while I have not yet migrated data from original instance)
export const createNewClient = () => {
  // Check if we're in a browser-like environment without cookies
  // This is needed for static site generation and standalone builds
  let isBuildTime = false;

  try {
    // This will throw an error during build/static generation
    cookies();
  } catch (error) {
    // We're likely in a build context, use the browser client instead
    isBuildTime = true;
    console.log("Using browser client for build-time operation");
  }

  if (isBuildTime) {
    // Use the browser client during build time
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL_NEW ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_NEW
    ) {
      console.error("Missing Supabase environment variables during build time");
    }
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL_NEW!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_NEW!
    );
  }

  // In server context, use the full server client
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL_NEW!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_NEW!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Fix the type issue with sameSite by ensuring it's a valid value
              const sanitizedOptions = options
                ? {
                    ...options,
                    sameSite:
                      options.sameSite === true
                        ? "lax"
                        : options.sameSite === false
                          ? undefined
                          : options.sameSite,
                  }
                : options;

              cookieStore.set(name, value, sanitizedOptions);
            });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
};

/**
 * Creates a Supabase client with SERVICE_ROLE key for admin-level operations.
 * This bypasses RLS policies and should ONLY be used in server-side contexts
 * where security is properly managed.
 */
export const createServiceClient = () => {
  // For service role, we don't need cookie handling since we're not dealing with user sessions
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL_NEW || !process.env.SUPABASE_SERVICE_ROLE_KEY_NEW) {
    console.error("Missing Supabase environment variables for service client");
    throw new Error("Missing required environment variables for Supabase service client");
  }

  // Log the first few characters of the key to help debug (avoid logging the full key)
  const keyPrefix = process.env.SUPABASE_SERVICE_ROLE_KEY_NEW.substring(0, 5) + '...';
  console.log(`Creating service client with URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL_NEW} and key prefix: ${keyPrefix}`);

  // Create the service client
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL_NEW!,
    process.env.SUPABASE_SERVICE_ROLE_KEY_NEW!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          // Explicitly set the role to be service_role
          // 'X-Client-Info': 'service_role'
        }
      }
    }
  );
};
