import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/providers/theme-provider";
import { Button } from "@/components/ui/button";
import {
  Moon,
  Sun,
  Monitor,
  Bell,
  Info,
  Mail,
  Lock,
  Save,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useModal } from "@/hooks/use-modal";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { logout } from "@/services/auth";
import { toast } from "@/components/ui/use-toast";

/**
 * Settings view component
 * Contains application settings such as theme, notifications, etc.
 * Displays as a modal overlay that can be closed with an X button
 */
export function SettingsView() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { closeSettingsModal } = useModal();
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [userInfo, setUserInfo] = useState<{
    userId: string | null;
    userName: string | null;
    sessionToken: string | null;
    email: string | null;
  }>({
    userId: null,
    userName: null,
    sessionToken: null,
    email: null,
  });

  useEffect(() => {
    const fetchUserInfo = async () => {
      // Get local storage data
      let userId = localStorage.getItem("userId");
      let userName = localStorage.getItem("userName");

      // Try sessionStorage if localStorage is empty
      if (!userId || !userName) {
        console.log(
          "[SETTINGS] No data in localStorage, checking sessionStorage"
        );
        userId = sessionStorage.getItem("userId");
        userName = sessionStorage.getItem("userName");
      }

      console.log("[SETTINGS] User info from storage:", { userId, userName });

      // Get Supabase session data
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      console.log(
        "[SETTINGS] Auth session data:",
        session ? "Session found" : "No session"
      );

      // Get user data
      const { data: userData } = await supabase.auth.getUser();

      setUserInfo({
        userId,
        userName,
        sessionToken: session?.access_token || null,
        email: userData.user?.email || null,
      });

      if (!session?.access_token) {
        console.warn("[SETTINGS] No access token found in session");
      }
    };

    if (showAboutModal) {
      fetchUserInfo();
    }
  }, [showAboutModal]);

  const handleRefreshSession = async () => {
    try {
      console.log("[SETTINGS] Manually refreshing session");
      const supabase = createClient();

      // Force session refresh
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error("[SETTINGS] Session refresh error:", error);
        toast({
          title: "Session Refresh Failed",
          description: error.message,
          variant: "destructive",
        });
      } else if (data.session) {
        console.log("[SETTINGS] Session refreshed successfully");
        setUserInfo((prev) => ({
          ...prev,
          sessionToken: data.session?.access_token || null,
        }));

        toast({
          title: "Session Refreshed",
          description: "Session token has been updated",
          variant: "default",
        });
      } else {
        console.warn("[SETTINGS] No session after refresh");
        toast({
          title: "No Session Available",
          description: "Could not obtain a new session",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("[SETTINGS] Unexpected error refreshing session:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      navigate("/sign-in");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-[90vw] h-[90vh] bg-sky-100 dark:bg-gray-800 rounded-lg shadow-lg flex flex-col overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between border-b">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
            Settings
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeSettingsModal}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="px-4 py-6 space-y-6">
            {/* Appearance Section */}
            <div>
              <h3 className="text-md font-medium mb-2 text-gray-800 dark:text-gray-100">
                Appearance
              </h3>
              <Separator className="my-3" />

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Theme
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Choose your preferred theme or set it to follow your system
                    settings.
                  </p>

                  <div className="flex flex-wrap gap-4">
                    <Button
                      variant={theme === "light" ? "default" : "outline"}
                      className="flex items-center gap-2"
                      onClick={() => setTheme("light")}
                    >
                      <Sun className="h-4 w-4" />
                      <span>Light</span>
                    </Button>

                    <Button
                      variant={theme === "dark" ? "default" : "outline"}
                      className="flex items-center gap-2"
                      onClick={() => setTheme("dark")}
                    >
                      <Moon className="h-4 w-4" />
                      <span>Dark</span>
                    </Button>

                    <Button
                      variant={theme === "system" ? "default" : "outline"}
                      className="flex items-center gap-2"
                      onClick={() => setTheme("system")}
                    >
                      <Monitor className="h-4 w-4" />
                      <span>System</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Notifications Section */}
            <div>
              <h3 className="text-md font-medium mb-2 text-gray-800 dark:text-gray-100">
                Notifications
              </h3>
              <Separator className="my-3" />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm">Push Notifications</span>
                  </div>
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full p-1 cursor-pointer">
                    <div className="bg-white dark:bg-gray-400 w-4 h-4 rounded-full"></div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm">Email Alerts</span>
                  </div>
                  <div className="w-11 h-6 bg-blue-500 rounded-full p-1 cursor-pointer">
                    <div className="bg-white w-4 h-4 rounded-full ml-auto"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Section */}
            <div>
              <h3 className="text-md font-medium mb-2 text-gray-800 dark:text-gray-100">
                Account
              </h3>
              <Separator className="my-3" />

              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Lock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm">Change Password</span>
                  </div>
                </div>

                <div
                  className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer"
                  onClick={() => setShowAboutModal(true)}
                >
                  <div className="flex items-center gap-3">
                    <Info className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm">About</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Save className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm">Export Data</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Transport settings section with navigation */}
            <div>
              <h3 className="text-md font-medium mb-2 text-gray-800 dark:text-gray-100">
                Transport
              </h3>
              <Separator className="my-3" />

              <div className="space-y-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Configure transport-related settings and preferences.
                </p>
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => {
                    closeSettingsModal();
                    navigate("/transport-settings");
                  }}
                >
                  Transport Settings
                </Button>
              </div>
            </div>

            <div className="pt-6">
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleLogout}
              >
                Log Out
              </Button>
            </div>

            <div className="text-center text-xs text-gray-400 dark:text-gray-500 pt-6 pb-10">
              Version 1.0.0
            </div>
          </div>
        </div>
      </div>

      {/* About Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-[85vw] max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                About
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAboutModal(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  User Information
                </h4>
                <Separator className="my-2" />

                <div className="space-y-2 mt-3">
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      User ID:
                    </span>
                    <p className="text-sm font-mono break-all">
                      {userInfo.userId || "Not found"}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Username:
                    </span>
                    <p className="text-sm font-mono break-all">
                      {userInfo.userName || "Not found"}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Email:
                    </span>
                    <p className="text-sm font-mono break-all">
                      {userInfo.email || "Not available"}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Session Token:
                    </span>
                    {userInfo.sessionToken ? (
                      <div className="mt-1">
                        <p className="text-sm font-mono break-all">
                          {`${userInfo.sessionToken.substring(0, 20)}...`}
                        </p>
                        <div className="mt-2 flex justify-between">
                          <span className="text-xs text-green-500">
                            Token available
                          </span>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              navigator.clipboard.writeText(
                                userInfo.sessionToken || ""
                              );
                              toast({
                                title: "Copied to clipboard",
                                description: "Session token copied",
                                variant: "default",
                                duration: 2000,
                              });
                            }}
                            className="text-xs text-blue-500 hover:text-blue-600"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-1">
                        <p className="text-sm font-mono break-all">
                          Not available
                        </p>
                        <p className="text-xs text-amber-500 mt-1">
                          Note: Session token should be available when logged
                          in. If missing, try refreshing.
                        </p>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRefreshSession();
                          }}
                          className="mt-2 text-xs bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded"
                        >
                          Refresh Session
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Application
                </h4>
                <Separator className="my-2" />

                <div className="space-y-2 mt-3">
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Version:
                    </span>
                    <p className="text-sm">1.0.0</p>
                  </div>

                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Build:
                    </span>
                    <p className="text-sm">2023.05.15</p>
                  </div>
                </div>
              </div>
            </div>

            <Button
              className="w-full mt-6"
              onClick={() => setShowAboutModal(false)}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
