import { useState, useEffect } from "react";
import { LogIn, AlertCircle, ChevronLeft } from "lucide-react";
import { loginWithPasscode } from "@/services/auth";
import React from "react";

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
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(
    null
  );
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);
  const [showResetOptions, setShowResetOptions] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

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
        window.location.href = "/dashboard"; // Or use your routing mechanism
      } else {
        // Handle failed login
        if (result.locked) {
          setIsLocked(true);
          setLockTimer(result.lockTimeRemaining || 300);
          setError("Too many failed attempts. Account temporarily locked.");
        } else {
          setError(result.message || "Invalid username or passcode");
          setAttemptsRemaining(result.attemptsRemaining || null);

          if (attemptsRemaining !== null) {
            setError(
              `${result.message || "Invalid username or passcode"}. ${result.attemptsRemaining} attempts remaining.`
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
  };

  const handleResetBack = () => {
    setShowResetOptions(false);
  };

  const handleResetRequest = (method: string) => {
    // This would be implemented with your auth server actions
    setError("");
    setShowResetOptions(false);
    return alert(
      `Reset link sent via ${method}. This would integrate with your existing auth system.`
    );
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
              {React.createElement(ChevronLeft, { size: 24 })}
            </button>
            <h2 className="text-xl font-bold text-gray-800">Reset Passcode</h2>
          </div>

          <p className="text-gray-600">
            Select how you would like to receive your passcode reset link:
          </p>

          <div className="space-y-3">
            <button
              onClick={() => handleResetRequest("email")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition duration-150"
            >
              Send Email to work@example.com
            </button>

            <button
              onClick={() => handleResetRequest("SMS")}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition duration-150"
            >
              Send SMS to (***) ***-5678
            </button>

            <p className="text-sm text-gray-500 text-center mt-4">
              If you need immediate assistance, please contact your supervisor.
            </p>
          </div>
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
                  {React.createElement(AlertCircle, {
                    className: "h-5 w-5 text-red-500",
                  })}
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your username"
                disabled={isLocked || isLoading}
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="passcode"
                  className="block text-sm font-medium text-gray-700"
                >
                  4-Digit Passcode
                </label>
                <button
                  type="button"
                  onClick={handleForgotPasscode}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Forgot passcode?
                </button>
              </div>
              <input
                type="password"
                id="passcode"
                value={passcode}
                onChange={handlePasscodeChange}
                className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter 4-digit passcode"
                maxLength={4}
                inputMode="numeric"
                disabled={isLocked || isLoading}
              />
            </div>

            <div>
              <button
                type="submit"
                className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  isLocked || isLoading
                    ? "bg-gray-400"
                    : "bg-blue-600 hover:bg-blue-700"
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                disabled={isLocked || isLoading}
              >
                {React.createElement(LogIn, { className: "mr-2 h-5 w-5" })}
                {isLocked
                  ? `Locked (${lockTimer}s)`
                  : isLoading
                    ? "Signing in..."
                    : "Sign in"}
              </button>
            </div>
          </form>
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
