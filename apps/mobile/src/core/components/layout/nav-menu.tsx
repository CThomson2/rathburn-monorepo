import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Scan,
  User,
  BarChart,
  Settings,
  Package,
  List,
  Search,
  ClipboardCheck,
  History,
  Menu,
} from "lucide-react";
import { cn } from "@/core/lib/utils";
import { FloatingNavBase } from "./nav-base";
import { useAuth } from "@/core/hooks/use-auth";
import { useDebugLogStore } from "@/core/stores/debug-log-store";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
}

interface FloatingNavMenuProps {
  onNavigate?: (itemId: string) => void;
  onMenuToggle?: (isOpen: boolean) => void;
}

/**
 * A floating navigation menu that can be toggled open and closed.
 *
 * @remarks
 *
 * The menu is rendered as a series of buttons that appear when the menu is toggled
 * open. The menu can be closed by clicking outside of it or by clicking on one of
 * the buttons. The buttons are rendered as a column of icons with labels that
 * appear when the menu is open. The main toggle button is rendered as a large
 * button with a rotating icon that changes depending on whether the menu is open
 * or closed.
 *
 * Uses FloatingNavBase as the foundation button component.
 *
 * @param onNavigate - An optional function that will be called with the `id` of
 * the item that was clicked.
 * @param onMenuToggle - An optional function that will be called with the current
 * open state when the menu is toggled.
 */
const FloatingNavMenu = ({
  onNavigate,
  onMenuToggle,
}: FloatingNavMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { toggleLogPanel, isLogPanelVisible } = useDebugLogStore();

  const navItems: NavItem[] = [
    { id: "logout", label: "Log Out", icon: <User size={20} /> },
    { id: "logs", label: "Logs", icon: <List size={20} /> },
    {
      id: "history",
      label: "History",
      icon: <History size={20} />,
      path: "/history",
    },
    { id: "search", label: "Search", icon: <Search size={20} /> },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings size={20} />,
    },
  ];

  const toggleMenu = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    if (onMenuToggle) {
      onMenuToggle(newIsOpen);
    }
  };

  const handleNavigation = (item: NavItem) => {
    setIsOpen(false);
    if (onMenuToggle) {
      onMenuToggle(false);
    }

    console.log(`FloatingNavMenu: Navigating to ${item.id}`);

    if (item.id === "logout") {
      signOut();
    } else if (item.id === "logs") {
      toggleLogPanel();
    } else if (onNavigate) {
      onNavigate(item.id);
    } else if (item.path) {
      navigate(item.path);
    } else {
      // Default for items without path
      navigate("/");
    }
  };

  return (
    <>
      {/* Darkened overlay when menu is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 z-40 transition-opacity duration-300"
          onClick={() => {
            setIsOpen(false);
            if (onMenuToggle) {
              onMenuToggle(false);
            }
          }}
        />
      )}

      {/* Menu items that appear when toggled */}
      <div
        className={cn(
          "fixed bottom-24 left-4 z-50 flex flex-col-reverse gap-4 mb-4 items-start transition-all duration-300",
          isOpen
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-10 pointer-events-none"
        )}
      >
        {navItems.map((item, index) => (
          <div key={item.id} className="flex items-center">
            <button
              onClick={() => handleNavigation(item)}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg transform group",
                location.pathname === (item.path || "/") && item.id !== "scan"
                  ? "bg-blue-600 text-white"
                  : item.id === "logs" && isLogPanelVisible
                    ? "bg-yellow-500 text-black"
                    : "bg-white text-gray-700 hover:bg-gray-100",
                isOpen ? "scale-100" : "scale-75",
                // Add staggered animation delay
                `transition-transform duration-300 delay-${index * 75}`
              )}
              aria-label={item.label}
            >
              {item.icon}
            </button>

            {/* Label that appears when menu is open */}
            <span
              className={cn(
                "ml-3 text-white font-medium bg-gray-800 bg-opacity-75 px-3 py-1 rounded-lg text-sm whitespace-nowrap transition-all duration-300",
                isOpen
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-4 pointer-events-none",
                `delay-${100 + index * 75}`
              )}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Main toggle button using FloatingNavBase */}
      <FloatingNavBase
        onClick={toggleMenu}
        isActive={isOpen}
        rotateOnActive={true}
        baseColor="bg-blue-600"
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        <Menu size={24} />
      </FloatingNavBase>
    </>
  );
};

export default FloatingNavMenu;
