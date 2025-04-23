import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

  /**
   * Server-side middleware function to handle authentication.
   *
   * Creates a server-side Supabase client with the correct cookies and headers.
   * Refreshes the user's session if it is expired.
   * Checks if the user is on a public route or not.
   * If not on a public route and there is no user, redirects to sign-in.
   * Returns the response and session for the main middleware.
   *
   * @param request - The NextRequest object.
   * @returns An object containing the response and session.
   */
export async function updateSession(request: NextRequest) {
  // Create a response object that we can modify
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired - required for Server Components

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: Get both user and session information
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Check if the path is a public route
  const isPublicRoute = [
    "/sign-in",
    "/sign-up",
    "/forgot-password",
    "/auth/callback",
  ].some(
    (route) =>
      request.nextUrl.pathname === route ||
      request.nextUrl.pathname.startsWith(route)
  );

  if (!user && !isPublicRoute) {
    // No user and not on a public route - redirect to sign-in
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }

  // Return both the response and session for the main middleware
  return { response, session };
}
