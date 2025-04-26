"use client";

import { useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Custom hook to track navigation state changes in Next.js App Router
 * 
 * @returns {boolean} isNavigating - Whether a navigation is in progress
 */
export function useNavigationLoading(): boolean {
  const [isNavigating, setIsNavigating] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Reset navigation state when pathname or search params change
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname, searchParams]);
  
  // We need to manually track client-side navigation for App Router
  useEffect(() => {
    const handleAnchorClick = (event: MouseEvent) => {
      // Check if the click is on an anchor element
      const target = event.target as HTMLElement;
      const anchor = target.closest('a');
      
      if (
        anchor && 
        anchor.href && 
        anchor.href.startsWith(window.location.origin) && 
        !anchor.target && 
        !anchor.download && 
        !anchor.rel?.includes('external')
      ) {
        // This is an internal link navigation - set loading state
        const linkPathname = new URL(anchor.href).pathname;
        
        // Only set navigating if we're actually changing pages
        if (linkPathname !== pathname) {
          setIsNavigating(true);
        }
      }
    };

    // Handle button clicks within the application that might trigger navigation
    const handleButtonClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const button = target.closest('button');
      
      // If this button has a data attribute indicating it's a navigation button
      if (button && button.dataset.navUrl) {
        setIsNavigating(true);
      }
    };
    
    // Listen for clicks on document to detect navigation attempts
    document.addEventListener('click', handleAnchorClick);
    document.addEventListener('click', handleButtonClick);
    
    return () => {
      document.removeEventListener('click', handleAnchorClick);
      document.removeEventListener('click', handleButtonClick);
    };
  }, [pathname]);
  
  return isNavigating;
} 