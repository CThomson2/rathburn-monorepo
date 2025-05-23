import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import { NavBar } from "@/core/components/ui/tubelight-navbar";
import { cn } from "@/core/lib/utils";
import { ThemeToggle } from "@/core/components/ui/theme-toggle";

interface NavItem {
  name: string;
  value: string;
  icon: LucideIcon;
}

interface TopNavbarProps {
  navLinks: NavItem[];
  activeView: string;
  onViewChange: (viewName: string) => void;
  extraActions?: React.ReactNode[];
}

/**
 * Top navigation bar for view switching
 * Allows switching between different views without changing routes
 */
const TopNavbar = ({
  navLinks,
  activeView,
  onViewChange,
  extraActions,
}: TopNavbarProps) => {
  const [time, setTime] = useState<string>("");
  const [activeNavItem, setActiveNavItem] = useState<string>(navLinks[0].value);

  // Find the display name for the active view
  const getActiveDisplayName = () => {
    const activeItem = navLinks.find((item) => item.value === activeView);
    return activeItem ? activeItem.name : navLinks[0].name;
  };

  useEffect(() => {
    // Update time every minute
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center w-full px-4 pt-2">
      <div className="flex justify-between items-center w-full mb-1">
        <div className="text-sm font-medium text-foreground/70">{time}</div>
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          {extraActions}
        </div>
      </div>
      <NavBar
        items={navLinks}
        activeView={activeView}
        onViewChange={onViewChange}
        // className="bg-background"
        showLabels={false}
      />
    </div>
    // <div className="flex items-center justify-center px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
    //   <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide">
    //     {navLinks.map((link) => {
    //       const isActive = activeView === link.name;
    //       const Icon = link.icon;

    //       return (
    //         <button
    //           key={link.name}
    //           onClick={() => onViewChange(link.name)}
    //           className={cn(
    //             "flex items-center px-4 py-2 rounded-full transition-colors",
    //             isActive
    //               ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
    //               : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/30"
    //           )}
    //         >
    //           <Icon className="mr-2 h-4 w-4" />
    //           <span className="text-sm font-medium">{link.name}</span>
    //         </button>
    //       );
    //     })}
    //   </div>
    // </div>
  );
};

export default TopNavbar;
