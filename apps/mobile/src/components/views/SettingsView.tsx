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
import { useModal } from "@/contexts/modal-context";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client-auth";

/**
 * Settings view component
 * Contains application settings such as theme, notifications, etc.
 * Displays as a modal overlay that can be closed with an X button
 */
export function SettingsView() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { closeSettingsModal } = useModal();
  const [showAuthInfo, setShowAuthInfo] = useState(false);
  const [authInfo, setAuthInfo] = useState<any>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  const checkAuthStatus = async () => {
    setIsLoadingAuth(true);
    try {
      // Get Supabase auth session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      // Get the user data
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      // Get localStorage auth data
      const localStorageData = {
        userId: localStorage.getItem("userId"),
        userName: localStorage.getItem("userName"),
        userRole: localStorage.getItem("userRole"),
        userDisplayName: localStorage.getItem("userDisplayName")
      };
      
      // Combine all auth information
      setAuthInfo({
        supabaseSession: sessionData,
        supabaseUser: userData,
        localStorage: localStorageData,
        sessionError: sessionError?.message,
        userError: userError?.message
      });
      
      setShowAuthInfo(true);
    } catch (error) {
      console.error("Error checking auth status:", error);
      setAuthInfo({
        error: error instanceof Error ? error.message : "Unknown error occurred"
      });
      setShowAuthInfo(true);
    } finally {
      setIsLoadingAuth(false);
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
                  onClick={checkAuthStatus}
                >
                  <div className="flex items-center gap-3">
                    <Info className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm">About & Auth Status</span>
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

            {/* Auth Info Display */}
            {showAuthInfo && (
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-medium mb-2 text-gray-800 dark:text-gray-200">Authentication Status</h4>
                
                {isLoadingAuth ? (
                  <div className="flex justify-center my-4">
                    <div className="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                  </div>
                ) : (
                  <div className="space-y-3 text-sm">
                    <div>
                      <h5 className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Supabase Auth</h5>
                      <p className="text-gray-700 dark:text-gray-300">
                        Session: {authInfo?.supabaseSession?.session ? "Active" : "None"}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        User ID: {authInfo?.supabaseUser?.user?.id || "Not logged in"}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        Email: {authInfo?.supabaseUser?.user?.email || "None"}
                      </p>
                    </div>
                    
                    <div>
                      <h5 className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Local Storage Auth</h5>
                      <p className="text-gray-700 dark:text-gray-300">
                        User ID: {authInfo?.localStorage?.userId || "None"}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        Username: {authInfo?.localStorage?.userName || "None"}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        Role: {authInfo?.localStorage?.userRole || "None"}
                      </p>
                    </div>
                    
                    {(authInfo?.sessionError || authInfo?.userError || authInfo?.error) && (
                      <div>
                        <h5 className="text-xs uppercase tracking-wider text-red-500 mb-1">Errors</h5>
                        {authInfo?.sessionError && <p className="text-red-500">{authInfo.sessionError}</p>}
                        {authInfo?.userError && <p className="text-red-500">{authInfo.userError}</p>}
                        {authInfo?.error && <p className="text-red-500">{authInfo.error}</p>}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowAuthInfo(false)}
                    className="w-full"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}

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
              <Button variant="destructive" className="w-full">
                Log Out
              </Button>
            </div>

            <div className="text-center text-xs text-gray-400 dark:text-gray-500 pt-6 pb-10">
              Version 1.0.0
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
