import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/core/lib/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useSessionStore } from "@/core/stores/session-store";

type Profile = {
  userId: string;
  username: string | null;
  email: string | null;
  role: string | null;
  // isActive: boolean;
};

/**
 * Hook for managing client-side authentication state and actions for mobile app
 * 
 * This hook provides:
 * - Current user state
 * - Loading state
 * - Authentication functions (Microsoft, email)
 * - Real-time auth state updates
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { endSession, currentSessionId } = useSessionStore();

  // Get initial auth state and set up listeners
  useEffect(() => {
    // Get initial user state
    const getSession = async () => {
      try {
        console.log("[AUTH] Checking for Supabase auth session...");
        // Check for Supabase auth session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("[AUTH] Error getting Supabase session:", error);
        } else if (data.session) {
          console.log("[AUTH] Supabase session found");
          console.log("[AUTH] User ID:", data.session.user.id);
          console.log("[AUTH] Email:", data.session.user.email);
        } else {
          console.log("[AUTH] No active session");
        }
        
        setUser(data.session?.user ?? null);
        setSession(data.session);
        setLoading(false);
      } catch (err) {
        console.error("[AUTH] Unexpected error checking auth:", err);
        setLoading(false);
      }
    };

    getSession();

    // const getProfile = async (userId: string) => {
    //   const { data, error } = await supabase
    //     .from("profiles")
    //     .select("user_id, username, email, role")
    //     .eq("user_id", userId)
    //     .single();

    //   if (error) {
    //     console.error("[AUTH] Error getting profile:", error);
    //   } else {
    //     const profile = {
    //       userId: data.user_id,
    //       username: data.username,
    //       email: data.email,
    //       role: data.role,
    //     }
    //     setProfile(profile);
    //   }
    // };

    // if (user) {
    //   getProfile(user.id);
    // }

    // Subscribe to auth state changes
    const { data: { subscription }} = supabase.auth.onAuthStateChange((_event, session) => {
      // When auth state changes:
      console.log("[AUTH] Auth state changed:", { event: _event, hasSession: !!session });
      // Update the user and session state
      setUser(session?.user ?? null);
      setSession(session);
      setLoading(false);
      
      // Log detailed session information
      if (session) {
        console.log("[AUTH] New session details:", { 
          expires_at: session.expires_at,
          user_id: session.user?.id || 'unknown'
        });
      }
    });

    // Clean up function
    return () => {
      console.log("[AUTH] Cleaning up auth state listener");
      subscription.unsubscribe();
    };
  }, []);

  const signInWithMicrosoft = useCallback(async () => {
    console.log("[AUTH] Attempting to sign in with Microsoft");

    // Log environment information to help debug
    console.log("[AUTH] Current URL:", window.location.href);
    console.log("[AUTH] Hostname:", window.location.hostname);
    
    // Determine the redirect URL based on environment
    // Check if we're in a production environment and correctly identify mobile vs web app
    const isMobileHostname = window.location.hostname.includes("mobile");
    const isLocalhost = window.location.hostname.includes("localhost");
    
    // Build the appropriate redirect URL
    let redirectUrl;
    if (isLocalhost) {
      // Development environment
      redirectUrl = "http://localhost:4173/auth/callback";
    } else {
      // Production environment
      redirectUrl = isMobileHostname 
        ? "https://mobile.rathburn.app/auth/callback" 
        : "https://rathburn.app/auth/callback";
    }

    console.log("[AUTH] Using redirect URL:", redirectUrl);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "azure",
      options: {
        scopes: "offline_access email",
        redirectTo: redirectUrl,
        queryParams: {
          // Adding source app as a parameter to help with redirect handling
          app_source: isMobileHostname ? "mobile" : "web",
        },
      },
    });

    if (error) {
      console.error("[AUTH] Microsoft OAuth error:", error);
      throw error;
    }

    console.log("[AUTH] Redirecting to Microsoft OAuth URL:", data.url);
    window.location.href = data.url;
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    console.log("[AUTH] Attempting to sign in with email");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("[AUTH] Email sign in error:", error);
      throw error;
    }

    console.log("[AUTH] Email sign in successful:", data.user ? "User authenticated" : "No user returned");
    return data;
  }, []);

  const signOut = useCallback(async () => {
    try {
      console.log("[AUTH] Signing out...");
      
      // End active scanning session if one exists
      if (currentSessionId) {
        console.log("[AUTH] Attempting to end active scanning session before sign out...");
        await endSession();
        console.log("[AUTH] Active scanning session ended or attempt completed.");
      }
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("[AUTH] Error signing out:", error);
        throw error;
      }
      
      // Reset local state
      setUser(null);
      setSession(null);
      
      // Redirect to login page
      navigate("/sign-in");
      
      console.log("[AUTH] Sign out successful");
    } catch (err) {
      console.error("[AUTH] Unexpected error during sign out:", err);
      throw err;
    }
  }, [navigate, endSession, currentSessionId]);

  const isAuthenticated = !!session;

  return {
    user,
    session,
    loading,
    isAuthenticated,
    signInWithMicrosoft,
    signInWithEmail,
    signOut
  };
} 