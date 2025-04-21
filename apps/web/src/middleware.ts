import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { Session } from "@supabase/supabase-js";

// Define public routes that don't require authentication
const publicRoutes = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
];

// Define a type for the result of updateSession
type UpdateSessionResult = {
  response: NextResponse;
  session: Session | null;
};

  /**
   * This middleware handles session authentication and redirects.
   *
   * The following logic applies:
   * 1. If on an auth route and logged in, redirect to dashboard.
   * 2. If on a protected route and not logged in, redirect to sign-in.
   * 3. Otherwise, return the response.
   *
   * @param request - The Next.js request object.
   * @returns The response to return to the client.
   */
export async function middleware(request: NextRequest) {
  // Get the response and session from updateSession
  const result = (await updateSession(request)) as UpdateSessionResult;
  const { response, session } = result;

  const pathname = request.nextUrl.pathname;
  
  // Set the pathname in response headers for layouts to access
  response.headers.set("x-pathname", pathname);
  
  // Add debug header
  response.headers.set("x-debug-is-auth-route", 
    publicRoutes.some(route => pathname === route || pathname.startsWith(route)).toString());

  // Check if the current route is an auth route
  const isAuthRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route)
  );

  // If on auth route and logged in, redirect to dashboard
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If on protected route and not logged in, redirect to sign-in
  if (!isAuthRoute && !session) {
    const redirectUrl = new URL("/sign-in", request.url);
    redirectUrl.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

// Specify which routes should use the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
