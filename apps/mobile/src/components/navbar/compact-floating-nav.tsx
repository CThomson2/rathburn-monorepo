import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Scan, User, BarChart, Settings, Package, X, Plus } from "lucide-react";
import { cn } from "@/core/lib/utils";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
}

interface CompactFloatingNavProps {
  onNavigate?: (itemId: string) => void;
}

/**
 * A more compact floating navigation menu for smaller screens
 * Provides a main action button that expands to reveal navigation options
 */
export default function CompactFloatingNav({
  onNavigate,
}: CompactFloatingNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navItems: NavItem[] = [
    { id: "stats", label: "Stats", icon: <BarChart size={16} /> },
    { id: "team", label: "Team", icon: <User size={16} /> },
    {
      id: "inventory",
      label: "Inventory",
      icon: <Package size={16} />,
      path: "/inventory",
    },
    { id: "settings", label: "Settings", icon: <Settings size={16} /> },
  ];

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleNavigation = (item: NavItem) => {
    setIsOpen(false);
    if (onNavigate) {
      onNavigate(item.id);
    } else if (item.path) {
      navigate(item.path);
    } else {
      navigate("/");
    }
  };

  return (
    <>
      {/* Semi-transparent overlay when menu is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 z-40 transition-opacity duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Main floating button and menu */}
      <div className="fixed bottom-4 right-4 z-50">
        {/* Menu items that appear when toggled */}
        <div
          className={cn(
            "absolute bottom-full right-0 mb-2 flex flex-col gap-2 transition-all duration-200",
            isOpen
              ? "opacity-100 scale-100"
              : "opacity-0 scale-75 pointer-events-none"
          )}
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item)}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center shadow-md transform transition-all duration-200",
                location.pathname === (item.path || "/") && item.id !== "scan"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              )}
              aria-label={item.label}
            >
              {item.icon}
            </button>
          ))}
        </div>

        {/* Main toggle button */}
        <button
          onClick={toggleMenu}
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-300",
            isOpen ? "bg-red-500 rotate-45" : "bg-blue-600"
          )}
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          {isOpen ? <X size={20} /> : <Plus size={20} />}
        </button>
      </div>
    </>
  );
}
