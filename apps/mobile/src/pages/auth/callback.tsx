import { useEffect, useState } from "react";
import { createClient } from "@/core/lib/supabase/client";

const AuthCallback = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function handleAuthCallback() {
      try {
        setIsLoading(true);
        const supabase = createClient();

        // Get the auth code from the URL
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        // Get the app source to determine where to redirect
        const appSource = url.searchParams.get("app_source");

        if (!code) {
          console.error("[AUTH] No code found in URL");
          throw new Error("No code found in URL");
        }

        console.log("[AUTH] Processing OAuth callback with code");
        console.log("[AUTH] App source:", appSource);

        // Exchange the code for a session
        console.log("[AUTH] Exchanging code for session...");
        const { data, error } =
          await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          console.error("[AUTH] Failed to exchange code for session:", error);
          throw error;
        }

        console.log(
          "[AUTH] Session created successfully:",
          data.session ? "Session obtained" : "No session returned"
        );

        // Store any additional user data in localStorage if needed
        if (data.session?.user) {
          const user = data.session.user;
          console.log("[AUTH] Storing user data in localStorage");
          localStorage.setItem("userId", user.id);
          localStorage.setItem("userName", user.email || "microsoft-user");
          localStorage.setItem("userRole", "user");
          localStorage.setItem(
            "userDisplayName",
            user.user_metadata?.name || user.email || "User"
          );
        }

        // Determine where to redirect based on app_source
        const isProduction = window.location.hostname.includes("rathburn");
        const redirectUrl = isProduction
          ? appSource === "mobile"
            ? "https://mobile.rathburn.app/"
            : "https://rathburn.app/"
          : "/";

        // Redirect to the appropriate page
        console.log("[AUTH] Redirecting to:", redirectUrl);
        window.location.href = redirectUrl;
      } catch (err) {
        console.error("[AUTH] Error in auth callback:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        setIsLoading(false);
      }
    }

    handleAuthCallback();
  }, []);

  // If there was an error, show it
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-teal-500 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 space-y-6">
          <h2 className="text-xl font-bold text-gray-800 text-center">
            Authentication Error
          </h2>
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button
            onClick={() => (window.location.href = "/sign-in")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition duration-150"
          >
            Go back to login
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-teal-500 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 space-y-6">
        <h2 className="text-xl font-bold text-gray-800 text-center">
          Processing Login
        </h2>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        </div>
        <p className="text-center text-gray-600">
          Please wait while we complete your authentication...
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;
