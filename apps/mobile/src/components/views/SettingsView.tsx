import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/providers/theme-provider";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Monitor, Bell, Info, Mail, Lock, Save } from "lucide-react";

/**
 * Settings view component
 * Contains application settings such as theme, notifications, etc.
 */
export function SettingsView() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="w-full">
      <div className="px-6 py-4">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
          Settings
        </h2>
      </div>

      <div className="px-4 space-y-6">
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

            <div className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer">
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
  );
}
