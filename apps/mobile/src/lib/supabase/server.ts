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
      !import.meta.env.VITE_SUPABASE_URL ||
      !import.meta.env.VITE_SUPABASE_ANON_KEY
    ) {
      console.error("Missing Supabase environment variables during build time");
    }
    return createBrowserClient(
      import.meta.env.VITE_SUPABASE_URL!,
      import.meta.env.VITE_SUPABASE_ANON_KEY!
    );
  }

  // In server context, use the full server client
  const cookieStore = cookies();

  return createServerClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_ANON_KEY!,
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
      !import.meta.env.VITE_SUPABASE_URL_NEW ||
      !import.meta.env.VITE_SUPABASE_ANON_KEY_NEW
    ) {
      console.error("Missing Supabase environment variables during build time");
    }
    return createBrowserClient(
      import.meta.env.VITE_SUPABASE_URL_NEW!,
      import.meta.env.VITE_SUPABASE_ANON_KEY_NEW!
    );
  }

  // In server context, use the full server client
  const cookieStore = cookies();

  return createServerClient(
    import.meta.env.VITESUPABASE_URL_NEW!,
    import.meta.env.VITESUPABASE_ANON_KEY_NEW!,
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
