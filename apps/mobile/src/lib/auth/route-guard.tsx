import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, NavigateFunction } from "react-router-dom";
import { supabase } from "@/lib/supabase/client-auth";

// Define public routes that don't require authentication
const publicRoutes = ["/sign-in"];

/**
 * Checks if the current route requires authentication and redirects accordingly
 */
export async function checkAuth(
  pathname: string,
  navigate: NavigateFunction
): Promise<boolean> {
  console.log(`Checking auth for path: ${pathname}`);

  try {
    // Get current session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Check if the current route is an auth route
    const isAuthRoute = publicRoutes.some(
      (route) => pathname === route || pathname.startsWith(route)
    );

    console.log(`Is auth route: ${isAuthRoute}, Has session: ${!!session}`);

    // If on auth route and logged in, redirect to home
    if (isAuthRoute && session) {
      console.log(
        "User is authenticated but on auth route, redirecting to home"
      );
      navigate("/");
      return true;
    }

    // If on protected route and not logged in, redirect to sign-in
    if (!isAuthRoute && !session) {
      console.log(
        "User is not authenticated and trying to access protected route, redirecting to sign-in"
      );
      navigate("/sign-in", {
        state: { redirectTo: pathname },
      });
      return true;
    }

    // No redirection needed
    return false;
  } catch (error) {
    console.error("Error checking authentication:", error);
    return false;
  }
}

/**
 * Higher-order component to protect routes that require authentication
 */
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function ProtectedRoute(props: P) {
    const navigate = useNavigate();
    const location = useLocation();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
      let isMounted = true;

      const checkAuthentication = async () => {
        const didRedirect = await checkAuth(location.pathname, navigate);
        if (isMounted && !didRedirect) {
          setIsChecking(false);
        }
      };

      checkAuthentication();

      return () => {
        isMounted = false;
      };
    }, [navigate, location.pathname]);

    // Return loading indicator or the protected component
    if (isChecking) {
      return null; // Replace with your actual loading component
    }

    return <Component {...props} />;
  };
}

export default {
  checkAuth,
  withAuth,
};
