import React from "react";
import { Book, Users, Camera, Trophy, Settings } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BottomNavBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  toggleScanner: () => void;
  scannerActive: boolean;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  setActiveTab,
  toggleScanner,
  scannerActive,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isScanView = location.pathname === "/scan";

  const navItems = [
    { id: "stats", icon: Book, label: "Stats" },
    { id: "team", icon: Users, label: "Team" },
    { id: "scan", icon: Camera, label: "Scan" },
    { id: "achievements", icon: Trophy, label: "Achievements" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  const handleNavigation = (itemId: string) => {
    if (itemId === "scan") {
      // Navigate to scan page or back to home based on current location
      if (isScanView) {
        navigate("/");
      } else {
        navigate("/scan");
      }
    } else {
      setActiveTab(itemId);
      // Always go back to home for other tabs
      if (isScanView) {
        navigate("/");
      }
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 pb-2 px-4 z-50">
      <div className="relative bg-navBar rounded-2xl px-2 py-1 flex items-center justify-between">
        {/* Bottom navigation items */}
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavigation(item.id)}
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded-full w-12 h-12 transition-all duration-200",
              (item.id === activeTab && !isScanView) ||
                (item.id === "scan" && isScanView)
                ? "text-white"
                : "text-gray-400",
              item.id === "scan" ? "transform -translate-y-3" : ""
            )}
          >
            <div
              className={cn(
                "rounded-full flex items-center justify-center",
                item.id === "scan" ? "bg-white p-3" : ""
              )}
            >
              <item.icon
                size={item.id === "scan" ? 22 : 20}
                className={item.id === "scan" ? "text-navBar" : ""}
              />
            </div>
            {item.id !== "scan" && (
              <span className="text-xs mt-1">{item.label}</span>
            )}
          </button>
        ))}

        {/* Arc cut-out effect */}
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-20 h-6 bg-navBar rounded-t-full"></div>
      </div>
    </div>
  );
};

export default BottomNavBar;
