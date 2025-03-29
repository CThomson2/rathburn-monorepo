import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createClient = async () => {
  const cookieStore = await cookies();

  console.log('URL:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
   console.log('ANON KEY:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

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
              const sanitizedOptions = options ? {
                ...options,
                sameSite: options.sameSite === true ? 'lax' : 
                          options.sameSite === false ? undefined : 
                          options.sameSite
              } : options;
              
              cookieStore.set(name, value, sanitizedOptions);
            });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
};
