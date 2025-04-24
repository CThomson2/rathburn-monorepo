import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/providers/theme-provider";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Monitor } from "lucide-react";

/**
 * Settings page component
 *
 * Contains various application settings including theme selection
 */
export default function Settings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-medium mb-2">Appearance</h2>
          <Separator className="my-4" />

          <div className="space-y-4">
            <div>
              <h3 className="text-md font-medium mb-2">Theme</h3>
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
                  <Sun className="h-5 w-5" />
                  <span>Light</span>
                </Button>

                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  className="flex items-center gap-2"
                  onClick={() => setTheme("dark")}
                >
                  <Moon className="h-5 w-5" />
                  <span>Dark</span>
                </Button>

                <Button
                  variant={theme === "system" ? "default" : "outline"}
                  className="flex items-center gap-2"
                  onClick={() => setTheme("system")}
                >
                  <Monitor className="h-5 w-5" />
                  <span>System</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Additional settings sections can be added here */}
      </div>
    </div>
  );
}
