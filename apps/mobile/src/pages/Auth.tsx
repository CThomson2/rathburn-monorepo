import {
  loginWithPasscode,
  requestPasscodeReset,
  createMobilePasscode,
} from "@/core/services/auth";
import { useAuth } from "@/core/hooks/use-auth";
import { useState, useEffect } from "react";
import MicrosoftSvg from "/svg/microsoft.svg";

/**
 * A login screen component that accepts a username and 4-digit passcode.
 * It displays a lockout message and disables the form if the user has
 * entered an invalid username or passcode 5 times in a row. The lockout
 * timer resets after 5 minutes.
 *
 * If the user clicks the "Forgot passcode?" link, they are presented with
 * options to reset their passcode via email or SMS. This is a demo-only
 * feature and should be implemented with your own auth server actions.
 *
 * This component should be wrapped in a `WorkflowProvider` to provide the
 * `onSubmit` callback to sign the user in.
 */
const LoginScreen = () => {
  const [username, setUsername] = useState("");
  const [passcode, setPasscode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(
    null
  );
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);
  const [showResetOptions, setShowResetOptions] = useState(false);
  const [showCreatePasscode, setShowCreatePasscode] = useState(false);
  const [msAuthPending, setMsAuthPending] = useState(false);

  // Fields for create passcode form
  const [newUsername, setNewUsername] = useState("");
  const [newPasscode, setNewPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [userId, setUserId] = useState("");
  const { signInWithMicrosoft, signInWithEmail } = useAuth();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLocked && lockTimer > 0) {
      interval = setInterval(() => {
        setLockTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsLocked(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLocked, lockTimer]);

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
      // Validate input
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (isLocked) {
      setError(
        `Account temporarily locked. Try again in ${lockTimer} seconds.`
      );
      return;
    }

    if (!username.trim()) {
      setError("Please enter your username");
      return;
    }

    if (passcode.length !== 4 || !/^\d+$/.test(passcode)) {
      setError("Please enter a valid 4-digit passcode");
      return;
    }

    // Use the real authentication service
    try {
      setIsLoading(true);
      const result = await loginWithPasscode(username, passcode);

      if (result.success) {
        // Successful login - redirect to main app or perform other actions
        window.location.href = "/"; // Redirect to the main app page
      } else {
        // Handle failed login
        if (result.locked_until) {
          setIsLocked(true);
          setLockTimer(result.locked_until || 300);
          setError("Too many failed attempts. Account temporarily locked.");
        } else {
          setError(result.message || "Invalid username or passcode");
          setAttemptsRemaining(result.attempts_remaining || null);

          if (attemptsRemaining !== null) {
            setError(
              `${result.message || "Invalid username or passcode"}. ${result.attempts_remaining} attempts remaining.`
            );
          }
        }
      }
    } catch (err) {
      setError("An error occurred during login. Please try again.");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasscodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d{0,4}$/.test(value)) {
      setPasscode(value);
      setError("");
    }
  };

  const handleForgotPasscode = () => {
    setShowResetOptions(true);
    setShowCreatePasscode(false);
  };

  const handleCreateNewPasscode = () => {
    setShowCreatePasscode(true);
    setShowResetOptions(false);
  };

  const handleResetBack = () => {
    setShowResetOptions(false);
    setShowCreatePasscode(false);
  };

  const handleResetRequest = async (username: string) => {
    setError("");
    setIsLoading(true);

    try {
      const result = await requestPasscodeReset(username);

      if (result.success) {
        setMessage(result.message);
        // Return to login screen after a delay
        setTimeout(() => {
          setShowResetOptions(false);
          setMessage("");
        }, 3000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePasscode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");

    // Validation
    if (!newUsername.trim()) {
      setError("Please enter a username");
      return;
    }

    if (!userId.trim()) {
      setError("Please enter your user ID");
      return;
    }

    if (!/^\d{4}$/.test(newPasscode)) {
      setError("Passcode must be exactly 4 digits");
      return;
    }

    if (newPasscode !== confirmPasscode) {
      setError("Passcodes do not match");
      return;
    }

    // Create passcode
    setIsLoading(true);
    try {
      const result = await createMobilePasscode(
        newUsername,
        newPasscode,
        userId
      );

      if (result.success) {
        setMessage(result.message);
        // Go back to login after success
        setTimeout(() => {
          setShowCreatePasscode(false);
          setNewUsername("");
          setNewPasscode("");
          setConfirmPasscode("");
          setUserId("");
          setMessage("");
        }, 3000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (showResetOptions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-teal-500 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 space-y-6">
          <div className="flex items-center">
            <button
              onClick={handleResetBack}
              className="mr-2 text-gray-500"
              title="Go back to login screen"
            >
              <span>←</span>
            </button>
            <h2 className="text-xl font-bold text-gray-800">Reset Passcode</h2>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {message && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <p className="text-sm text-green-700">{message}</p>
            </div>
          )}

          <p className="text-gray-600">
            Enter your username below. If found, a reset link will be sent to
            your associated email.
          </p>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="reset-username"
                className="block text-sm font-medium text-gray-700"
              >
                Username
              </label>
              <input
                type="text"
                id="reset-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your username"
                disabled={isLoading}
              />
            </div>

            <button
              onClick={() => handleResetRequest(username)}
              disabled={!username.trim() || isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition duration-150 disabled:bg-gray-400"
            >
              {isLoading ? "Processing..." : "Send Reset Link"}
            </button>

            <p className="text-sm text-gray-500 text-center mt-4">
              If you need immediate assistance, please contact your supervisor.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (showCreatePasscode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-teal-500 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 space-y-6">
          <div className="flex items-center">
            <button
              onClick={handleResetBack}
              className="mr-2 text-gray-500"
              title="Go back to login screen"
            >
              <span>←</span>
            </button>
            <h2 className="text-xl font-bold text-gray-800">
              Create Mobile Passcode
            </h2>
          </div>

          <p className="text-gray-600">
            If you already have a Supabase account, you can create a passcode
            for the mobile app. You'll need your Supabase user ID to complete
            this process.
          </p>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {message && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <p className="text-sm text-green-700">{message}</p>
            </div>
          )}

          <form onSubmit={handleCreatePasscode} className="space-y-6">
            <div>
              <label
                htmlFor="new-username"
                className="block text-sm font-medium text-gray-700"
              >
                Username
              </label>
              <input
                type="text"
                id="new-username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Choose a username"
                disabled={isLoading}
              />
            </div>

            <div>
              <label
                htmlFor="user-id"
                className="block text-sm font-medium text-gray-700"
              >
                Supabase User ID
              </label>
              <input
                type="text"
                id="user-id"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Your Supabase User ID"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">
                This is the UUID from your Supabase account
              </p>
            </div>

            <div>
              <label
                htmlFor="new-passcode"
                className="block text-sm font-medium text-gray-700"
              >
                4-Digit Passcode
              </label>
              <input
                type="password"
                id="new-passcode"
                value={newPasscode}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d{0,4}$/.test(value)) {
                    setNewPasscode(value);
                  }
                }}
                className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter 4-digit passcode"
                maxLength={4}
                inputMode="numeric"
                disabled={isLoading}
              />
            </div>

            <div>
              <label
                htmlFor="confirm-passcode"
                className="block text-sm font-medium text-gray-700"
              >
                Confirm Passcode
              </label>
              <input
                type="password"
                id="confirm-passcode"
                value={confirmPasscode}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d{0,4}$/.test(value)) {
                    setConfirmPasscode(value);
                  }
                }}
                className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Confirm 4-digit passcode"
                maxLength={4}
                inputMode="numeric"
                disabled={isLoading}
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={handleResetBack}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                {isLoading ? "Creating..." : "Create Passcode"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

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
                disabled={isLocked || isLoading}
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
                <button
                  type="button"
                  onClick={handleForgotPasscode}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your password"
                disabled={isLocked || isLoading}
              />
            </div>

            <div>
              <button
                type="button"
                onClick={handleSignInWithEmail}
                className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  isLocked || isLoading
                    ? "bg-gray-400"
                    : "bg-blue-600 hover:bg-blue-700"
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                disabled={isLocked || isLoading}
              >
                <span className="mr-2 h-5 w-5">➡️</span>
                {isLocked
                  ? `Locked (${lockTimer}s)`
                  : isLoading
                    ? "Signing in..."
                    : "Sign in"}
              </button>
            </div>
          </form>

          <div className="text-center border-t pt-4">
            <p className="text-sm text-gray-600 mb-2">
              First time using the mobile app?
            </p>
            <button
              onClick={handleCreateNewPasscode}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Create Mobile Passcode
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-white text-opacity-80 text-sm">
          Contact your supervisor if you need help signing in
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
