import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { executeMiddleware, checkAuth } from '@/middleware';
import { Session } from '@supabase/supabase-js';

/**
 * Custom hook that implements the middleware functionality
 * 
 * This hook:
 * 1. Runs the authentication middleware on every route change
 * 2. Returns the current auth state and loading status
 * 3. Handles redirects automatically
 * 
 * @returns Authentication state and loading status
 */
export function useMiddleware() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const runMiddleware = async () => {
      setIsLoading(true);
      
      try {
        console.log(`[useMiddleware] Running middleware for path: ${location.pathname}`);
        
        // Check auth status first
        const result = await checkAuth(location.pathname);
        
        // Only update state if component is still mounted
        if (isMounted) {
          setIsAuthenticated(result.authenticated);
          setSession(result.session);
          
          // Execute middleware (handles redirects if needed)
          await executeMiddleware(location.pathname, navigate, location);
        }
      } catch (error) {
        console.error('[useMiddleware] Error in middleware:', error);
        // On error, consider user not authenticated
        if (isMounted) {
          setIsAuthenticated(false);
          setSession(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    runMiddleware();
    
    // Cleanup function to prevent state updates if component unmounts during async operations
    return () => {
      isMounted = false;
    };
  }, [location.pathname, navigate, location]);

  return {
    isLoading,
    isAuthenticated,
    session
  };
} 