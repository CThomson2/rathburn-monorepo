import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";

// Create a single instance of the Supabase client
export const supabase = createClient();

/**
 * Hook for managing client-side authentication state and actions
 * This hook provides:
 * - Current user state
 * - Loading state
 * - Sign in/up/out functions
 * - Real-time auth state updates
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Get initial user state
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Subscribe to auth state changes
    // This sets up a real-time listener for authentication state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // When auth state changes:
      // 1. Update the user state with the new user or null if signed out
      setUser(session?.user ?? null);
      // 2. Set loading to false since we've received the auth state
      setLoading(false);
      // 3. Refresh the router to update UI based on new auth state
      router.refresh();
    });

    // Clean up function that runs when the component unmounts
    // This prevents memory leaks by removing the subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [router]); // Only re-run this effect if router changes

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    router.push("/sign-in");
  }, [router]);

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };
}
