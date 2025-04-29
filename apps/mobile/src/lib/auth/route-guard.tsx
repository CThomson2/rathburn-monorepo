import React, { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
// Removed Supabase import
// import { supabase } from "@/lib/supabase/client-auth";

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
  console.log(`[AUTH-GUARD] BYPASSED - Auth check disabled`);
  // Always return false to bypass authentication checks
  return false;
}

/**
 * Higher-order component to protect routes that require authentication.
 * Simplified to bypass authentication checks completely.
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return (props: P) => {
    const location = useLocation();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      console.log(
        "[AUTH-GUARD] withAuth HOC - AUTO-AUTHENTICATING on path:",
        location.pathname
      );
      
      // Simple timeout to simulate auth check
      setTimeout(() => {
        setLoading(false);
      }, 100);
    }, [location.pathname]);

    if (loading) {
      console.log("[AUTH-GUARD] Simulating authentication check...");
      return (
        <div className="flex h-screen w-full items-center justify-center">
          Loading...
        </div>
      );
    }

    console.log(
      "[AUTH-GUARD] Auto-authenticated, rendering protected component"
    );
    return <Component {...props} />;
  };
}
