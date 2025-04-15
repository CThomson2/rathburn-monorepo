import { useAuth as useSupabaseAuth } from "@/lib/supabase/client-auth";

/**
 * Hook for managing authentication state and operations
 *
 * This is a wrapper around the Supabase auth functionality that provides:
 * - Current authenticated user state
 * - Loading state while auth is being determined
 * - Authentication operations (sign in, sign up, sign out)
 * - Real-time auth state updates with automatic UI refreshing
 *
 * @example
 * ```tsx
 * function ProfilePage() {
 *   const { user, loading, signOut } = useAuth();
 *
 *   if (loading) return <div>Loading...</div>
 *
 *   if (!user) {
 *     // Redirect to login or show login form
 *     return <div>Please sign in</div>
 *   }
 *
 *   return (
 *     <div>
 *       <h1>Welcome {user.email}</h1>
 *       <button onClick={signOut}>Sign Out</button>
 *     </div>
 *   )
 * }
 * ```
 *
 * @returns Auth state and methods
 */
export function useAuth() {
  return useSupabaseAuth();
}
