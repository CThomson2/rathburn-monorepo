import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Scan, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface NavItem {
  name: string;
  path: string;
  icon: LucideIcon;
}

interface IntegratedNavProps {
  navLinks: NavItem[];
  onScan?: () => void;
}

/**
 * IntegratedNav component combines a horizontal swipeable tab bar
 * with a floating action button for scanning
 *
 * - The top section contains a horizontal navbar for main views
 * - The floating action button (FAB) provides quick access to the scan feature
 * - A theme toggle is included in the top right corner
 */
export function IntegratedNav({ navLinks, onScan }: IntegratedNavProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleScan = () => {
    if (onScan) {
      onScan();
    } else {
      navigate("/scan");
    }
  };

  return (
    <>
      {/* Top tab bar for main navigation */}
      <div className="fixed top-0 left-0 right-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-2 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 overflow-x-auto scrollbar-hide">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              const Icon = link.icon;

              return (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className={cn(
                    "flex items-center justify-center px-3 py-2 rounded-md transition-colors whitespace-nowrap",
                    isActive
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/30"
                  )}
                >
                  <Icon className="h-4 w-4 mr-1.5" />
                  <span className="text-sm font-medium">{link.name}</span>
                </button>
              );
            })}
          </div>

          <ThemeToggle className="ml-2" />
        </div>
      </div>

      {/* Floating action button for scan */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={handleScan}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
          aria-label="Scan"
        >
          <Scan size={20} />
        </button>
      </div>
    </>
  );
}
