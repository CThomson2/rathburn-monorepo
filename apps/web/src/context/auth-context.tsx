import { ReactNode, createContext, useContext } from "react";
import { useAuth as useSupabaseAuth } from "@/hooks/use-auth";

// Define the shape of the auth context
export type AuthContextType = ReturnType<typeof useSupabaseAuth>;

// Create context with default values
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provider component for authentication context
 *
 * Wraps the application with authentication state and methods
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useSupabaseAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use authentication context
 *
 * @example
 * ```tsx
 * function UserProfile() {
 *   const { user, signOut } = useAuthContext();
 *
 *   if (!user) return null;
 *
 *   return (
 *     <div>
 *       <p>Hello, {user.email}</p>
 *       <button onClick={signOut}>Sign Out</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
