import { LucideIcon } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface TabItem {
  name: string;
  path: string;
  icon: LucideIcon;
}

interface BottomTabBarProps {
  tabs: TabItem[];
  showFloatingButton?: boolean;
  className?: string;
}

/**
 * Modern bottom tab bar navigation component
 *
 * Provides a fixed bottom navigation with icons and labels
 * Can be configured to leave space for a floating action button
 */
export function BottomTabBar({
  tabs,
  showFloatingButton = false,
  className,
}: BottomTabBarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-40",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center justify-around h-16",
          showFloatingButton && "px-12"
        )}
      >
        {tabs.map((tab, index) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;

          // If we need to make room for a floating button in the middle
          if (showFloatingButton && index === Math.floor(tabs.length / 2)) {
            return <div key="spacer" className="w-16" aria-hidden="true" />;
          }

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full px-1",
                isActive
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-500 dark:text-gray-400"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 mb-1",
                  isActive && "text-blue-600 dark:text-blue-400"
                )}
              />
              <span className="text-xs font-medium">{tab.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
