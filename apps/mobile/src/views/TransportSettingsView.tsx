"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/core/components/ui/card";
import { Button } from "@/core/components/ui/button";
import { Switch } from "@/core/components/ui/switch";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Save, Trash, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/core/hooks/use-auth";

/**
 * TransportSettingsView is a component that provides a user interface for configuring
 * transport-related settings. It allows users to save and reset settings such as
 * bulk registration warnings, default email addresses, and default export paths.
 * The settings are stored in localStorage and loaded on component mount. The component
 * also displays device information including model, screen size, app version, and device ID.
 */
export function TransportSettingsView() {
  const { user, signOut } = useAuth();

  // Settings state
  const [showBulkWarning, setShowBulkWarning] = useState(true);
  const [defaultEmailAddress, setDefaultEmailAddress] = useState("");
  const [defaultExportPath, setDefaultExportPath] = useState("");

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("transportSettings");
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setShowBulkWarning(settings.showBulkWarning ?? true);
        setDefaultEmailAddress(settings.defaultEmailAddress ?? "");
        setDefaultExportPath(settings.defaultExportPath ?? "");
      } catch (error) {
        console.error("Failed to parse settings:", error);
      }
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = () => {
    const settings = {
      showBulkWarning,
      defaultEmailAddress,
      defaultExportPath,
    };

    localStorage.setItem("transportSettings", JSON.stringify(settings));

    toast.success("Settings Saved", {
      description: "Your preferences have been updated",
    });
  };

  // Clear all settings
  const clearSettings = () => {
    if (confirm("Are you sure you want to reset all settings to default?")) {
      localStorage.removeItem("transportSettings");
      setShowBulkWarning(true);
      setDefaultEmailAddress("");
      setDefaultExportPath("");

      toast.success("Settings Reset", {
        description: "All settings have been reset to default values",
      });
    }
  };

  return (
    <div className="w-full">
      <div className="px-6 py-4">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
          Transport Settings
        </h2>
      </div>

      <div className="px-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Scan Settings</CardTitle>
            <CardDescription>
              Configure how the scanning process behaves
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Bulk Warning Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="bulk-warning">Bulk Registration Warning</Label>
                <p className="text-sm text-muted-foreground">
                  Show confirmation dialog when using bulk registration
                </p>
              </div>
              <Switch
                id="bulk-warning"
                checked={showBulkWarning}
                onCheckedChange={setShowBulkWarning}
              />
            </div>

            {/* Default Email */}
            <div className="space-y-2">
              <Label htmlFor="default-email">Default Email Address</Label>
              <Input
                id="default-email"
                type="email"
                placeholder="example@company.com"
                value={defaultEmailAddress}
                onChange={(e) => setDefaultEmailAddress(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Used as the default recipient when sending scan history
              </p>
            </div>

            {/* Default Export Path */}
            {/* <div className="space-y-2">
              <Label htmlFor="export-path">CSV Export Location</Label>
              <Input
                id="export-path"
                placeholder="/exports"
                value={defaultExportPath}
                onChange={(e) => setDefaultExportPath(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Default location for exported CSV files (when supported by
                device)
              </p>
            </div> */}
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={clearSettings}
              className="flex items-center gap-1"
            >
              <Trash className="h-4 w-4" />
              Reset
            </Button>

            <Button onClick={saveSettings} className="flex items-center gap-1">
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Device Information</CardTitle>
            <CardDescription>
              Information about the current device
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Device Model</p>
                <p className="text-sm text-muted-foreground">
                  {/* Detect Honeywell device model if possible */}
                  Honeywell CK67 (detected)
                </p>
              </div>

              <div>
                <p className="text-sm font-medium">Screen Size</p>
                <p className="text-sm text-muted-foreground">361 × 601</p>
              </div>

              <div>
                <p className="text-sm font-medium">App Version</p>
                <p className="text-sm text-muted-foreground">1.0.0</p>
              </div>

              <div>
                <p className="text-sm font-medium">Device ID</p>
                <p className="text-sm text-muted-foreground">HDWCK67-0123</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Button variant="ghost" type="submit" onClick={signOut}>
          <LogOut size={16} />
        </Button>
      </div>
    </div>
  );
}
