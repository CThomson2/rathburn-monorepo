import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/core/lib/supabase/client";
import { User, Session } from "@supabase/supabase-js";

/**
 * Hook for managing client-side authentication state and actions for mobile app
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
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const navigate = useNavigate();

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
        } else {
          console.log("[AUTH] Supabase session data:", data.session ? "Session found" : "No session");
          if (data.session) {
            console.log("[AUTH] Token length:", data.session.access_token?.length || 0);
            console.log("[AUTH] Token preview:", data.session.access_token 
              ? `${data.session.access_token.substring(0, 10)}...` 
              : 'none');
          }
        }
        
        setUser(data.session?.user ?? null);
        setSession(data.session);
        
        // Check for mobile app passcode auth
        const storedUserId = localStorage.getItem("userId");
        const storedUserName = localStorage.getItem("userName");
        
        console.log("[AUTH] Local storage auth:", { userId: storedUserId, userName: storedUserName });
        
        setUserId(storedUserId);
        setUserName(storedUserName);
        
        setLoading(false);
      } catch (err) {
        console.error("[AUTH] Unexpected error checking auth:", err);
        setLoading(false);
      }
    };

    getSession();

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
          token_length: session.access_token?.length || 0,
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

    // Determine the redirect URL based on environment
    const isProduction = window.location.hostname === "rathburn.mobile.app";
    const redirectUrl = isProduction
      ? "https://rathburn.mobile.app/auth/callback"
      : "http://localhost:4173/auth/callback";

    console.log("[AUTH] Using redirect URL:", redirectUrl);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "azure",
      options: {
        scopes: "offline_access email",
        redirectTo: redirectUrl,
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
    
    if (data.user) {
      // Store user data in localStorage
      localStorage.setItem("userId", data.user.id);
      localStorage.setItem("userName", data.user.email || "email-user");
      localStorage.setItem("userRole", "user");
      localStorage.setItem(
        "userDisplayName",
        data.user.user_metadata?.name || data.user.email || "User"
      );
      
      setUserId(data.user.id);
      setUserName(data.user.email || "email-user");
    }

    return data;
  }, []);

  const signOut = useCallback(async () => {
    try {
      console.log("[AUTH] Signing out...");
      
      // Clear localStorage auth data
      localStorage.removeItem("userId");
      localStorage.removeItem("userName");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userDisplayName");
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("[AUTH] Error signing out:", error);
        throw error;
      }
      
      // Reset local state
      setUser(null);
      setSession(null);
      setUserId(null);
      setUserName(null);
      
      // Redirect to login page
      navigate("/sign-in");
      
      console.log("[AUTH] Sign out successful");
    } catch (err) {
      console.error("[AUTH] Unexpected error during sign out:", err);
      throw err;
    }
  }, [navigate]);

  return {
    user,
    session,
    loading,
    userId,
    userName,
    signInWithMicrosoft,
    signInWithEmail,
    signOut
  };
} 