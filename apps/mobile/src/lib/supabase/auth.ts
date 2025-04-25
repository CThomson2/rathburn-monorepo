// /src/lib/supabase/auth.ts
import { createClient, User, Session, SupabaseClient } from '@supabase/supabase-js';

// Get Supabase URL and Anon Key from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Define the type for the auth result
interface AuthResult {
  session: Session | null;
  user: User | null;
  error: Error | null;
}

// Create a Supabase client singleton
let supabaseClient: SupabaseClient | null = null;

/**
 * Get the Supabase client instance
 * 
 * @returns The Supabase client
 */
export function getSupabase() {
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        storage: localStorage, // Use localStorage for session persistence
      },
    });
  }
  
  return supabaseClient;
}

/**
 * Get the current authentication state
 * 
 * @returns A promise that resolves to the auth result
 */
export async function getSupabaseAuth(): Promise<AuthResult> {
  try {
    const supabase = getSupabase();
    
    // Get the current session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      return { session: null, user: null, error };
    }
    
    // Get the current user if we have a session
    if (session) {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        return { session, user: null, error: userError };
      }
      
      return { session, user, error: null };
    }
    
    return { session: null, user: null, error: null };
    
  } catch (error) {
    return {
      session: null,
      user: null,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Sign in with email and password
 * 
 * @param email The user's email
 * @param password The user's password
 * @returns A promise that resolves to the auth result
 */
export async function signIn(email: string, password: string): Promise<AuthResult> {
  try {
    const supabase = getSupabase();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      return { session: null, user: null, error };
    }
    
    return {
      session: data.session,
      user: data.user,
      error: null,
    };
    
  } catch (error) {
    return {
      session: null,
      user: null,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Sign out the current user
 * 
 * @returns A promise that resolves to a boolean indicating success
 */
export async function signOut(): Promise<boolean> {
  try {
    const supabase = getSupabase();
    
    const { error } = await supabase.auth.signOut();
    
    return !error;
    
  } catch (error) {
    console.error('Error signing out:', error);
    return false;
  }
}

/**
 * Refresh the session token
 * 
 * @returns A promise that resolves to the auth result
 */
export async function refreshSession(): Promise<AuthResult> {
  try {
    const supabase = getSupabase();
    
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      return { session: null, user: null, error };
    }
    
    return {
      session: data.session,
      user: data.user,
      error: null,
    };
    
  } catch (error) {
    return {
      session: null,
      user: null,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Set up an auth state change listener
 * 
 * @param callback Function to call when auth state changes
 * @returns A function to remove the listener
 */
export function onAuthStateChange(callback: (session: Session | null) => void): () => void {
  const supabase = getSupabase();
  
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event: string, session: Session | null) => {
      callback(session);
    }
  );
  
  // Return a function to unsubscribe
  return () => {
    subscription.unsubscribe();
  };
}