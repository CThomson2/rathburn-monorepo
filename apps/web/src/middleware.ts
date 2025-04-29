import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { Session } from "@supabase/supabase-js";
import { config as appConfig } from '@/lib/api/config';

// Define public routes that don't require authentication
const publicRoutes = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
];

// Define API routes that use CORS
const apiRoutesWithCors = [
  "/api/scanner",
];

// Define allowed origins for CORS (consolidated from the API middleware and route file)
const allowedOrigins = [
  'http://localhost:4173', // Vite dev server
  'http://localhost:5173', // Vite dev server
  'http://localhost:8080', // Vite dev server
  'https://mobile.rathburn.app', // Production mobile app
  // Add any other origins as needed
];

// Define a type for the result of updateSession
type UpdateSessionResult = {
  response: NextResponse;
  session: Session | null;
};

/**
 * Apply CORS headers to the response
 * @param request - The incoming request
 * @param response - The response to modify
 * @returns Modified response with CORS headers
 */
function applyCorsHeaders(request: NextRequest, response: NextResponse): NextResponse {
  // Get origin from request
  const origin = request.headers.get('origin') || '';
  
  // Check if origin is allowed
  const isAllowedOrigin = allowedOrigins.includes(origin);
  
  // Set CORS headers
  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  } else {
    // Default to first allowed origin or null if none
    response.headers.set('Access-Control-Allow-Origin', allowedOrigins[0] || 'null');
  }
  
  // Set other CORS headers
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, User-Agent');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
  
  return response;
}

/**
 * This middleware handles session authentication, redirects, and CORS for API routes.
 *
 * The following logic applies:
 * 1. For API routes: Apply CORS headers and handle preflight requests
 * 2. For OPTIONS requests: Return 204 No Content with CORS headers
 * 3. If on an auth route and logged in, redirect to dashboard.
 * 4. If on a protected route and not logged in, redirect to sign-in.
 * 5. Otherwise, return the response with appropriate headers.
 *
 * @param request - The Next.js request object.
 * @returns The response to return to the client.
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Check if the request is for an API route that needs CORS
  const isApiRoute = apiRoutesWithCors.some(route => pathname.startsWith(route));
  
  // HANDLE API ROUTES
  if (isApiRoute) {
    console.log('[MIDDLEWARE] Handling API route:', pathname);
    
    // Handle preflight requests for API routes
    if (request.method === 'OPTIONS') {
      console.log('[MIDDLEWARE] Handling CORS preflight for:', pathname);
      const preflightResponse = new NextResponse(null, { status: 204 });
      return applyCorsHeaders(request, preflightResponse);
    }
    
    // For actual API requests, just add CORS headers and continue
    // Don't attempt to update the session or do any auth redirects
    const response = NextResponse.next();
    return applyCorsHeaders(request, response);
  }
  
  // HANDLE WEB APP ROUTES
  // Get the response and session from updateSession
  let result: UpdateSessionResult | null = null;
  
  try {
    result = await updateSession(request) as UpdateSessionResult;
    console.log('[MIDDLEWARE] Session updated for:', pathname);
  } catch (error) {
    console.error('[MIDDLEWARE] Error updating session:', error);
  }
  
  // Create a response from updateSession or a new one
  let response = result?.response || NextResponse.next({
    request: {
      headers: new Headers(request.headers),
    },
  });
  
  // Extract session data
  const session = result?.session || null;
  
  // Set the pathname in response headers for layouts to access
  response.headers.set("x-pathname", pathname);
  
  // Add security headers for all routes
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Check if the current route is an auth route
  const isAuthRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route)
  );
  
  // If on auth route and logged in, redirect to dashboard
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/inventory", request.url));
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
