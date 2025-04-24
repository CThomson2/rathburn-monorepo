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
} from "lucide-react";
import { cn } from "@/lib/utils";

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
 * If the `onNavigate` prop is provided, the menu will call the provided function
 * with the `id` of the item that was clicked. If not, the menu will navigate to the
 * `path` prop of the item if it exists, or to the root path if it doesn't.
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

  const navItems: NavItem[] = [
    { id: "stats", label: "Stats", icon: <BarChart size={20} /> },
    { id: "logs", label: "Logs", icon: <List size={20} /> },
    {
      id: "tasks",
      label: "Tasks",
      icon: <ClipboardCheck size={20} />,
      path: "/",
    },
    { id: "search", label: "Search", icon: <Search size={20} /> },
  ];

  const toggleMenu = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    if (onMenuToggle) {
      onMenuToggle(newIsOpen);
    }
  };

  // const handleScan = () => {
  //   // If menu is open, close it, otherwise navigate to scan
  //   if (isOpen) {
  //     setIsOpen(false);
  //   } else {
  //     navigate("/scan");
  //   }
  // };

  const handleNavigation = (item: NavItem) => {
    setIsOpen(false);
    if (onMenuToggle) {
      onMenuToggle(false);
    }
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
      {/* Darkened overlay when menu is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 z-70 transition-opacity duration-300"
          onClick={() => {
            setIsOpen(false);
            if (onMenuToggle) {
              onMenuToggle(false);
            }
          }}
        />
      )}

      {/* Main floating button and menu */}
      <div className="fixed bottom-4 left-4">
        {/* Menu items that appear when toggled */}
        <div
          className={cn(
            "flex flex-col-reverse gap-4 mb-4 items-start transition-all duration-300",
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

        {/* Main toggle/scan button */}
        <button
          onClick={toggleMenu}
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-300",
            isOpen ? "bg-red-500 rotate-45" : "bg-blue-600"
          )}
          aria-label={isOpen ? "Close menu" : "Scan or open menu"}
        >
          <Scan size={24} />
        </button>
      </div>
    </>
  );
};

export default FloatingNavMenu;
