import { createClient } from "@/core/lib/supabase/client";
import { Session } from "@supabase/supabase-js";
import { NavigateFunction, Location } from "react-router-dom";

// Define public routes that don't require authentication
export const publicRoutes = ["/sign-in", "/auth/callback", "/sign-out"];

// Define the result type for checkAuth
interface AuthCheckResult {
  authenticated: boolean;
  redirectTo: string | null;
  session: Session | null;
}

/**
 * Checks authentication state and determines appropriate redirects
 * 
 * Handles both:
 * - Redirecting unauthenticated users away from protected routes
 * - Redirecting authenticated users away from auth pages
 * 
 * @param pathname Current path
 * @returns Authentication check result with redirect information
 */
export async function checkAuth(pathname: string): Promise<AuthCheckResult> {
  console.log(`[MIDDLEWARE] Checking auth for path: ${pathname}`);

  // Check if the current route is an auth route (public route)
  const isAuthRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  );
  
  // Special path for sign-out - always let user go to sign-in from here
  if (pathname === "/sign-out") {
    console.log('[MIDDLEWARE] Sign-out path detected - redirecting to sign-in');
    return { authenticated: false, redirectTo: "/sign-in", session: null };
  }
  
  try {
    // Get Supabase session
    const supabase = createClient();
    const { data, error } = await supabase.auth.getSession();
    
    // Log any session retrieval errors
    if (error) {
      console.error("[MIDDLEWARE] Session retrieval error:", error.message);
    }
    
    const session = data.session;
    
    // Check localStorage as a fallback (for custom mobile auth)
    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName");
    const hasLocalAuth = Boolean(userId && userName);
    
    // Determine authentication status
    const isAuthenticated = Boolean(session) || hasLocalAuth;
    
    console.log(`[MIDDLEWARE] Auth state: ${isAuthenticated ? 'Authenticated' : 'Not authenticated'}, IsAuthRoute: ${isAuthRoute}`);
    
    // Case 1: Authenticated user trying to access auth page, redirect to home
    if (isAuthenticated && isAuthRoute) {
      console.log('[MIDDLEWARE] Authenticated user trying to access auth page - redirecting to home');
      return { authenticated: true, redirectTo: "/", session };
    }
    
    // Case 2: Unauthenticated user trying to access protected page, redirect to login
    if (!isAuthenticated && !isAuthRoute) {
      console.log('[MIDDLEWARE] Unauthenticated user trying to access protected page - redirecting to login');
      return { authenticated: false, redirectTo: "/sign-in", session: null };
    }
    
    // Default case: No redirect needed
    return { authenticated: isAuthenticated, redirectTo: null, session };
    
  } catch (error) {
    console.error("[MIDDLEWARE] Auth check error:", error);
    
    // Safety check: If this is already sign-in page, don't create a redirect loop
    if (pathname === "/sign-in") {
      return { authenticated: false, redirectTo: null, session: null };
    }
    
    // On error, assume user is not authenticated and redirect to login
    return { authenticated: false, redirectTo: "/sign-in", session: null };
  }
}

/**
 * Execute middleware logic for the current route
 * Call this whenever a route change is detected
 */
export function executeMiddleware(
  pathname: string,
  navigate: NavigateFunction,
  location: Location
): Promise<void> {
  // For critical auth pages, bypass full middleware check
  if (pathname === "/sign-in" || pathname === "/sign-out") {
    // If user is trying to sign out or sign in, let them do so without impediment
    console.log(`[MIDDLEWARE] Fast-path for auth route: ${pathname}`);
    return Promise.resolve();
  }
  
  return checkAuth(pathname).then(({ redirectTo }) => {
    if (redirectTo) {
      // Save the current location to redirect back after authentication if needed
      const state = pathname !== "/sign-in" 
        ? { from: location } 
        : undefined;
      
      console.log(`[MIDDLEWARE] Redirecting to ${redirectTo}`, state);
      navigate(redirectTo, { replace: true, state });
    }
  }).catch(err => {
    console.error("[MIDDLEWARE] Error in middleware execution:", err);
    // On error, redirect to login as a safety measure
    navigate("/sign-in", { replace: true });
  });
} 