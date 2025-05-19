import { useState, useEffect } from "react";
import { useAuth } from "@/core/hooks/use-auth";
import MicrosoftSvg from "/svg/microsoft.svg";

/**
 * Login screen component for the mobile app
 *
 * This component provides:
 * - Email/password authentication
 * - Microsoft OAuth authentication
 * - Error and loading states
 */
const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [msAuthPending, setMsAuthPending] = useState(false);

  const { signInWithMicrosoft, signInWithEmail } = useAuth();

  const handleSignInWithMicrosoft = async () => {
    setError("");
    setMessage("Redirecting to Microsoft login...");
    setMsAuthPending(true);

    try {
      await signInWithMicrosoft();
    } catch (err) {
      console.error("[AUTH] Unexpected error during Microsoft sign-in:", err);
      setError("An error occurred during sign in. Please try again.");
      setMsAuthPending(false);
    }
  };

  const handleSignInWithEmail = async (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      if (!email.trim()) {
        setError("Please enter your email");
        setIsLoading(false);
        return;
      }

      if (!password.trim()) {
        setError("Please enter your password");
        setIsLoading(false);
        return;
      }

      console.log("[AUTH] Attempting to sign in with email:", email);

      try {
        const data = await signInWithEmail(email, password);

        if (data) {
          setMessage("Sign in successful! Redirecting...");
          window.location.href = "/";
          console.log("[AUTH] Email sign-in successful. User:", data?.user?.id);
          // Redirect will happen automatically due to navigation in the auth hook
        }
      } catch (authError: unknown) {
        const errorMessage =
          authError instanceof Error
            ? authError.message
            : "Failed to sign in. Please check your credentials.";
        setError(errorMessage);
        console.error("[AUTH] Email sign-in error:", authError);
      }
    } catch (err) {
      console.error("[AUTH] Unexpected error during email sign-in:", err);
      setError("An error occurred during sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-teal-500 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-10">
        <div className="text-center">
          <h1 className="text-white text-3xl font-bold">
            Inventory Management
          </h1>
          <div className="inline-block bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg mt-2">
            <p className="text-white text-lg">Rathburn Chemicals</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
          <h2 className="text-xl font-bold text-gray-800 text-center">
            Sign in to continue
          </h2>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="h-5 w-5 text-red-500">⚠️</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {message && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="h-5 w-5 text-green-500">✓</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">{message}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            <div>
              <button
                type="button"
                onClick={handleSignInWithMicrosoft}
                disabled={msAuthPending || isLoading}
                className="w-full bg-white text-black border border-gray-600 hover:border-black hover:bg-gray-300 flex justify-center items-center py-3 px-4 rounded-md shadow-sm transition duration-150 disabled:opacity-70"
              >
                <img
                  src={MicrosoftSvg}
                  alt="Microsoft"
                  className="mr-2 h-5 w-5"
                />
                {msAuthPending ? "Connecting..." : "Sign in with Microsoft"}
              </button>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mt-4"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email"
                disabled={isLoading}
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <a
                  href="https://rathburn.app/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Forgot password?
                </a>
              </div>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your password"
                disabled={isLoading}
              />
            </div>

            <div>
              <button
                type="button"
                onClick={handleSignInWithEmail}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
                disabled={isLoading}
              >
                <span className="mr-2 h-5 w-5">➡️</span>
                {isLoading ? "Signing in..." : "Sign in"}
              </button>
            </div>
          </form>

          <div className="text-center border-t pt-4">
            <p className="text-sm text-gray-600">
              Need help? Contact your system administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
