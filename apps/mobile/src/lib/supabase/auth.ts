import { createClient } from "@/lib/supabase/client";

/**
 * Get the Supabase JWT token for the current session
 * This can be used to authenticate API requests to the backend
 * 
 * @returns {Promise<string>} The JWT token or empty string if not authenticated
 */
export async function getSupabaseToken(): Promise<string> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.getSession();
    
    if (error || !data.session) {
      console.error("Error getting Supabase token:", error);
      return "";
    }
    
    return data.session.access_token;
  } catch (error) {
    console.error("Unexpected error getting Supabase token:", error);
    return "";
  }
}

/**
 * Get the current user session
 * 
 * @returns {Promise<{ user: any | null, session: any | null, error: any | null }>}
 */
export async function getCurrentSession() {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      return { user: null, session: null, error };
    }
    
    return { 
      user: data.session?.user || null, 
      session: data.session, 
      error: null 
    };
  } catch (error) {
    console.error("Error getting current session:", error);
    return { user: null, session: null, error };
  }
}

/**
 * Get user details from Supabase Auth
 * 
 * @returns {Promise<{ user: any | null, error: any | null }>}
 */
export async function getUserDetails() {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      return { user: null, error };
    }
    
    return { user: data.user, error: null };
  } catch (error) {
    console.error("Error getting user details:", error);
    return { user: null, error };
  }
}

/**
 * Refresh the current session
 * 
 * @returns {Promise<{ session: any | null, error: any | null }>}
 */
export async function refreshSession() {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      return { session: null, error };
    }
    
    return { session: data.session, error: null };
  } catch (error) {
    console.error("Error refreshing session:", error);
    return { session: null, error };
  }
}

/**
 * Set the auth session from a URL hash - useful for handling OAuth redirects
 * or magic link authentications
 * 
 * @param {string} url The URL containing the session information
 * @returns {Promise<{ session: any | null, error: any | null }>}
 */
export async function setSessionFromUrl(url: string) {
  try {
    const supabase = createClient();
    // Extract hash from the URL
    const hash = new URL(url).hash;
    
    if (!hash) {
      return { session: null, error: new Error("No hash found in URL") };
    }
    
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      return { session: null, error };
    }
    
    return { session: data.session, error: null };
  } catch (error) {
    console.error("Error setting session from URL:", error);
    return { session: null, error };
  }
}

/**
 * Check if the user is authenticated
 * 
 * @returns {Promise<boolean>}
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const { session, error } = await getCurrentSession();
    return !!session && !error;
  } catch (error) {
    console.error("Error checking authentication:", error);
    return false;
  }
} 