import { useState, useCallback } from 'react';

interface AuthUser {
  id: string;
  name: string;
  email?: string;
}

/**
 * Hook for managing user authentication state
 */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const login = useCallback((userData: AuthUser, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('auth_token', authToken);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
  }, []);

  // Initialize from localStorage on mount
  useState(() => {
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      setToken(storedToken);
      // In a real app, you would validate the token and fetch user data
    }
  });

  return {
    user,
    token,
    setUser,
    setToken,
    login,
    logout,
    isLoggedIn: !!user && !!token,
  };
} 