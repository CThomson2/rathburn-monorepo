import { createClient } from "@/lib/supabase/client";
import { useCallback, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { loginWithPasscode, logout, requestPasscodeReset, resetPasscodeWithToken, createMobilePasscode } from "@/services/auth";

// Create a single instance of the Supabase client
export const supabase = createClient();

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
    const { data: { subscription }} = supabase.auth.onAuthStateChange((_event, session) => {
      // When auth state changes:
      console.log("[AUTH] Auth state changed:", { event: _event, hasSession: !!session });
      // 1. Update the user state with the new user or null if signed out
      setUser(session?.user ?? null);
      // 2. Set loading to false since we've received the auth state
      setLoading(false);
    });

    // Clean up function that runs when the component unmounts
    // This prevents memory leaks by removing the subscription
    return () => {
      console.log("[AUTH] Cleaning up auth state listener");
      subscription.unsubscribe();
    };
  }, []);

  const signInWithPasscode = useCallback(async (username: string, passcode: string) => {
    console.log("[AUTH] Attempting to sign in with passcode for user:", username);
    const response = await loginWithPasscode(username, passcode);
    
    if (response.success) {
      console.log("[AUTH] Passcode login successful");
      // The auth service already sets localStorage items
      setUserId(localStorage.getItem("userId"));
      setUserName(localStorage.getItem("userName"));
      navigate("/");
      return { success: true };
    } else {
      console.error("[AUTH] Passcode login failed:", response.message);
      return { success: false, message: response.message };
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
    signOut,
    resetPasscode,
    confirmPasscodeReset,
    createPasscode
  };
}
