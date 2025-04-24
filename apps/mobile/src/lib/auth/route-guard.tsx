import React, { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase/client-auth";

// Paths that don't require authentication
const publicPaths = ["/sign-in"];

/**
 * Check if the user is authenticated
 * This function checks:
 * 1. If the current path is public (doesn't require auth)
 * 2. If there are valid localStorage credentials
 *
 * @returns {boolean | string} false if no redirect needed, or the redirect path
 */
export async function checkAuth(pathname: string): Promise<boolean | string> {
  console.log(`[AUTH-GUARD] Checking auth for path: ${pathname}`);

  // If it's a public path, no need to check auth
  if (publicPaths.includes(pathname)) {
    console.log(`[AUTH-GUARD] ${pathname} is a public path, no auth needed`);
    return false;
  }

  try {
    // Log localStorage values first
    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName");
    console.log("[AUTH-GUARD] localStorage values:", { userId, userName });

    // Check if there is valid local authentication
    const isLocalAuth = Boolean(userId && userName);

    // Check if there's a valid Supabase session
    const { data } = await supabase.auth.getSession();
    const isAuthRoute = publicPaths.includes(pathname);
    const hasSession = Boolean(data.session);

    console.log(`Is auth route: ${isAuthRoute}, Has session: ${hasSession}`);

    if (hasSession || isLocalAuth) {
      console.log("[AUTH-GUARD] User is authenticated");
      return false; // No redirect needed
    }

    console.log(
      "[AUTH-GUARD] No valid authentication found, redirecting to /sign-in"
    );
    return "/sign-in"; // Redirect to login page
  } catch (error) {
    console.error("[AUTH-GUARD] Error checking authentication:", error);
    return "/sign-in"; // Redirect to login page on error
  }
}

/**
 * Higher-order component to protect routes that require authentication.
 * Redirects to login if not authenticated.
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return (props: P) => {
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [redirectTo, setRedirectTo] = useState<string | null>(null);

    useEffect(() => {
      console.log(
        "[AUTH-GUARD] withAuth HOC checking auth on path:",
        location.pathname
      );

      const checkAuthentication = async () => {
        try {
          console.log(
            "[AUTH-GUARD] Starting auth check for",
            location.pathname
          );
          const result = await checkAuth(location.pathname);

          if (typeof result === "string") {
            console.log(
              `[AUTH-GUARD] Auth check result: redirect to ${result}`
            );
            setRedirectTo(result);
          } else {
            console.log(
              "[AUTH-GUARD] Auth check result: authenticated, no redirect needed"
            );
          }
        } catch (error) {
          console.error("[AUTH-GUARD] Error in authentication check:", error);
          setRedirectTo("/sign-in");
        } finally {
          console.log(
            "[AUTH-GUARD] Auth check complete, setting loading to false"
          );
          setLoading(false);
        }
      };

      checkAuthentication();
    }, [location.pathname]);

    if (loading) {
      console.log("[AUTH-GUARD] Still checking authentication...");
      // You could use a loading spinner here
      return (
        <div className="flex h-screen w-full items-center justify-center">
          Loading...
        </div>
      );
    }

    if (redirectTo) {
      console.log(
        `[AUTH-GUARD] Redirecting to ${redirectTo}, current path: ${location.pathname}`
      );
      console.log("[AUTH-GUARD] Current localStorage state:", {
        userId: localStorage.getItem("userId"),
        userName: localStorage.getItem("userName"),
      });

      // Pass the current location to the redirect so we can return after login
      return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }

    console.log(
      "[AUTH-GUARD] User is authenticated, rendering protected component"
    );
    return <Component {...props} />;
  };
}
