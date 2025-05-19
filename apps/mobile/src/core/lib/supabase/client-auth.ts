import { supabase } from "@/core/lib/supabase/client";
import { useCallback, useEffect, useState } from "react";
import { User, AuthChangeEvent, Session } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { loginWithPasscode, logout, requestPasscodeReset, resetPasscodeWithToken, createMobilePasscode } from "@/core/services/auth";

/**
 * Debug helper to log session information
 */
export async function logSessionInfo(prefix = "[AUTH-DEBUG]") {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error(`${prefix} Error retrieving session:`, error);
      return null;
    }
    
    const session = data.session;
    if (!session) {
      console.warn(`${prefix} No active session found`);
      return null;
    }
    
    console.log(`${prefix} Session found:`, {
      expires_at: session.expires_at,
      token_length: session.access_token?.length || 0,
      token_preview: session.access_token ? `${session.access_token.substring(0, 10)}...` : 'none',
      user_id: session.user?.id || 'unknown'
    });
    
    return session;
  } catch (err) {
    console.error(`${prefix} Unexpected error checking session:`, err);
    return null;
  }
}

/**
 * Hook for managing client-side authentication state and actions for mobile app
 * This hook provides:
 * - Current user state
 * - Loading state
 * - Passcode-based authentication functions
 * - Real-time auth state updates
 * 
 * TODO: move to /hooks/ in shared turborepo package
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const navigate = useNavigate();

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
    // This sets up a real-time listener for authentication state changes
    console.log("[AUTH] Setting up auth state change listener...");
    const { data: { subscription }} = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        // When auth state changes:
        console.log("[AUTH] Auth state changed:", { event, hasSession: !!session });
        // 1. Update the user state with the new user or null if signed out
        setUser(session?.user ?? null);
        // 2. Set loading to false since we've received the auth state
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

    // Clean up function that runs when the component unmounts
    // This prevents memory leaks by removing the subscription
    return () => {
      console.log("[AUTH] Cleaning up auth state listener");
      subscription.unsubscribe();
    };
  }, []);

  const signInWithMicrosoft = useCallback(async () => {
    console.log("[AUTH] Attempting to sign in with Microsoft");

    // Determine the redirect URL based on environment
    const isProduction = window.location.hostname === "rathburn.mobile.app";
    const isMobileApp = window.location.hostname.includes("mobile");
    
    // Default callback URL will handle the auth flow
    const callbackUrl = "https://ppnulxweiiczciuxcypn.supabase.co/auth/v1/callback";
    
    // But we need to tell Supabase where to redirect after successful auth
    // We'll add a "redirectTo" query parameter to the URL
    const redirectUrl = isProduction
      ? isMobileApp 
          ? "https://mobile.rathburn.app" 
          : "https://rathburn.app"
      : "http://localhost:4173/auth/callback";

    console.log("[AUTH] Using redirect URL:", redirectUrl);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "azure",
      options: {
        scopes: "offline_access email",
        redirectTo: redirectUrl,
        queryParams: {
          // Adding source app as a parameter to help with redirect handling
          app_source: isMobileApp ? "mobile" : "web",
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

  const signInWithPasscode = useCallback(async (username: string, passcode: string) => {
    console.log("[AUTH] Attempting to sign in with passcode for user:", username);
    const response = await loginWithPasscode(username, passcode);
    
    if (response.success) {
      console.log("[AUTH] Passcode login successful");
      
      // The auth service already sets localStorage items
      const userId = localStorage.getItem("userId");
      const userName = localStorage.getItem("userName");
      
      // Also store in sessionStorage as a backup
      if (userId && userName) {
        try {
          sessionStorage.setItem("userId", userId);
          sessionStorage.setItem("userName", userName);
          console.log("[AUTH] Stored auth data in sessionStorage as backup");
        } catch (err) {
          console.warn("[AUTH] Failed to store in sessionStorage:", err);
        }
      }
      
      setUserId(userId);
      setUserName(userName);
      
      // Try to get session info after a short delay
      setTimeout(async () => {
        try {
          const session = await logSessionInfo("[AUTH-LOGIN]");
          
          if (!session) {
            console.warn("[AUTH-LOGIN] No session found after successful login");
            // Try to initiate a Supabase session if we have the auth user ID
            if (response.auth_user_id) {
              console.log("[AUTH-LOGIN] Attempting to set up Supabase session with auth_user_id");
              // This is just a placeholder - in a real implementation, 
              // you would use Supabase to create a session
            }
          }
        } catch (err) {
          console.error("[AUTH-LOGIN] Error checking session after login:", err);
        }
      }, 1000);
      
      navigate("/");
      return { success: true };
    } else {
      console.error("[AUTH] Passcode login failed:", response.message);
      
      // Add more detailed error information to help debugging
      if (response.attempts_remaining !== undefined) {
        console.warn(`[AUTH] ${response.attempts_remaining} attempts remaining`);
      }
      
      if (response.locked_until) {
        const lockTime = new Date(response.locked_until * 1000);
        console.warn(`[AUTH] Account locked until ${lockTime.toLocaleString()}`);
      }
      
      return { 
        success: false, 
        message: response.message,
        attempts_remaining: response.attempts_remaining,
        locked_until: response.locked_until
      };
    }
  }, [navigate]);

  const signOut = useCallback(async () => {
    console.log("[AUTH] Signing out user");
    const response = await logout();
    
    if (response.success) {
      console.log("[AUTH] Sign out successful");
      setUserId(null);
      setUserName(null);
      navigate("/sign-in");
      return { success: true };
    } else {
      console.error("[AUTH] Sign out failed:", response.message);
      return { success: false, message: response.message };
    }
  }, [navigate]);

  const resetPasscode = useCallback(async (username: string) => {
    console.log("[AUTH] Requesting passcode reset for:", username);
    return await requestPasscodeReset(username);
  }, []);

  const confirmPasscodeReset = useCallback(async (token: string, newPasscode: string) => {
    console.log("[AUTH] Confirming passcode reset with token");
    return await resetPasscodeWithToken(token, newPasscode);
  }, []);

  const createPasscode = useCallback(async (username: string, passcode: string, authUserId: string) => {
    console.log("[AUTH] Creating new passcode for user:", username);
    return await createMobilePasscode(username, passcode, authUserId);
  }, []);

  const isAuthenticated = Boolean(userId) || Boolean(user);

  return {
    user,
    userId,
    userName,
    loading,
    isAuthenticated,
    signInWithPasscode,
    signInWithEmail,
    signInWithMicrosoft,
    signOut,
    resetPasscode,
    confirmPasscodeReset,
    createPasscode
  };
}

// Export the Supabase client for direct access
export { supabase };
