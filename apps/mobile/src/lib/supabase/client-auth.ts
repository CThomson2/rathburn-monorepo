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
      // Check for Supabase auth session
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
      
      // Check for mobile app passcode auth
      const storedUserId = localStorage.getItem("userId");
      const storedUserName = localStorage.getItem("userName");
      
      setUserId(storedUserId);
      setUserName(storedUserName);
      
      setLoading(false);
    };

    getSession();

    // Subscribe to auth state changes
    // This sets up a real-time listener for authentication state changes
    const { data: { subscription }} = supabase.auth.onAuthStateChange((_event, session) => {
      // When auth state changes:
      // 1. Update the user state with the new user or null if signed out
      setUser(session?.user ?? null);
      // 2. Set loading to false since we've received the auth state
      setLoading(false);
    });

    // Clean up function that runs when the component unmounts
    // This prevents memory leaks by removing the subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []); // No dependencies needed here

  const signInWithPasscode = useCallback(async (username: string, passcode: string) => {
    const response = await loginWithPasscode(username, passcode);
    
    if (response.success) {
      // The auth service already sets localStorage items
      setUserId(localStorage.getItem("userId"));
      setUserName(localStorage.getItem("userName"));
      navigate("/");
      return { success: true };
    } else {
      return { success: false, message: response.message };
    }
  }, [navigate]);

  const signOut = useCallback(async () => {
    const response = await logout();
    
    if (response.success) {
      setUserId(null);
      setUserName(null);
      navigate("/sign-in");
      return { success: true };
    } else {
      return { success: false, message: response.message };
    }
  }, [navigate]);

  const resetPasscode = useCallback(async (username: string) => {
    return await requestPasscodeReset(username);
  }, []);

  const confirmPasscodeReset = useCallback(async (token: string, newPasscode: string) => {
    return await resetPasscodeWithToken(token, newPasscode);
  }, []);

  const createPasscode = useCallback(async (username: string, passcode: string, authUserId: string) => {
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
