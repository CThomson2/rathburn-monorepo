import { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Define public routes that don't require authentication
const publicRoutes = ["/sign-in", "/sign-up", "/forgot-password"];

export async function middleware(request: NextRequest) {
  const { response, session } = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  // Check if the current route is an auth route
  const isAuthRoute = publicRoutes.includes(pathname);

  // If on auth route and logged in, redirect to dashboard
  if (isAuthRoute && session) {
    return Response.redirect(new URL("/dashboard", request.url));
  }

  // If on protected route and not logged in, redirect to sign-in
  if (!isAuthRoute && !session) {
    const redirectUrl = new URL("/sign-in", request.url);
    redirectUrl.searchParams.set("redirectedFrom", pathname);
    return Response.redirect(redirectUrl);
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
