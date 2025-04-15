"use client";

import { useEffect, useState } from "react";
import dynamic from 'next/dynamic';
import { useRouter } from "next/navigation";

// Import environment variable
const IS_DATA_EXPLORER_ENABLED = process.env.NEXT_PUBLIC_ENABLE_DATA_EXPLORER === 'true';

// Dynamically import the actual component only if enabled
const DynamicSpreadsheetView = IS_DATA_EXPLORER_ENABLED 
  ? dynamic(() => import('./spreadsheet-view'), { ssr: false })
  : () => <DisabledFeatureMessage />;

function DisabledFeatureMessage() {
  return (
    <div className="flex flex-col items-center justify-center h-[50vh] text-center p-4">
      <h2 className="text-2xl font-bold mb-2">Data Explorer</h2>
      <p className="text-muted-foreground mb-4">
        This feature is not available in the current build.
      </p>
      <p className="text-sm text-muted-foreground">
        Contact your administrator for more information.
      </p>
    </div>
  );
}

/**
 * Feature-flagged wrapper for the Data Explorer component
 * This component will:
 * 1. Check if the feature is enabled via env variable
 * 2. Redirect to home if not enabled and redirect is true
 * 3. Otherwise show either the component or a disabled message
 */
export default function FeatureFlaggedExplorer({
  redirectIfDisabled = false,
}: {
  redirectIfDisabled?: boolean;
}) {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    
    // Redirect if feature is disabled and redirect flag is true
    if (redirectIfDisabled && !IS_DATA_EXPLORER_ENABLED) {
      router.replace('/');
    }
  }, [router, redirectIfDisabled]);

  // During server rendering or before client-side effect runs
  if (!isClient) {
    return null;
  }
  
  // Show nothing during redirect
  if (redirectIfDisabled && !IS_DATA_EXPLORER_ENABLED) {
    return null;
  }
  
  return <DynamicSpreadsheetView />;
}