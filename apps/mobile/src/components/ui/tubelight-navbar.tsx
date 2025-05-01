import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  value: string;
  icon: LucideIcon;
}

interface NavBarProps {
  items: NavItem[];
  activeView?: string;
  onViewChange?: (viewName: string) => void;
  className?: string;
  showLabels?: boolean;
}

/**
 * A responsive navigation bar for Tubelight.
 * Can be used for view switching with animations.
 *
 * @param {{ items: NavItem[]; activeView?: string; onViewChange?: (viewName: string) => void; className?: string; showLabels?: boolean }} props
 * @param {NavItem[]} props.items - Navigation items to display
 * @param {string} [props.activeView] - Currently active view value
 * @param {function} [props.onViewChange] - Callback when view is changed
 * @param {string} [props.className] - Additional CSS classes
 * @param {boolean} [props.showLabels] - Whether to show text labels next to icons
 *
 * @returns {JSX.Element}
 *
 * @example
 * <NavBar
 *   items={[
 *     { name: "Transport", value: "transport", icon: ForkliftIcon },
 *     { name: "Production", value: "production", icon: AtomIcon },
 *   ]}
 *   activeView="transport"
 *   onViewChange={(view) => setCurrentView(view)}
 *   className="bg-background"
 *   showLabels={false}
 * />
 */
export function NavBar({
  items,
  activeView,
  onViewChange,
  className,
  showLabels = false,
}: NavBarProps) {
  const [activeTab, setActiveTab] = useState(activeView || items[0].value);

  useEffect(() => {
    if (activeView) {
      setActiveTab(activeView);
    }
  }, [activeView]);

  const handleTabChange = (item: NavItem) => {
    console.log(`Tab change requested: ${item.name} (${item.value})`);
    setActiveTab(item.value);
    if (onViewChange) {
      onViewChange(item.name);
    }
  };

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-40 flex justify-center mb-10 mt-4",
        className
      )}
    >
      <div className="flex items-center gap-2 bg-background/5 border border-border backdrop-blur-lg py-1 px-1 rounded-full shadow-lg mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.value;

          return (
            <button
              key={item.value}
              onClick={() => handleTabChange(item)}
              className={cn(
                "relative cursor-pointer text-sm font-semibold px-4 py-1.5 rounded-full transition-colors",
                "text-foreground/80 hover:text-primary dark:text-foreground/60 dark:hover:text-primary",
                isActive && "bg-muted text-primary dark:bg-muted/20"
              )}
              title={item.name}
            >
              {showLabels && <span className="mr-1.5">{item.name}</span>}
              <Icon size={18} strokeWidth={2} />
              {isActive && (
                <motion.div
                  layoutId="lamp"
                  className="absolute inset-0 w-full bg-primary/5 rounded-full -z-10"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full">
                    <div className="absolute w-12 h-6 bg-primary/20 rounded-full blur-md -top-2 -left-2" />
                    <div className="absolute w-8 h-6 bg-primary/20 rounded-full blur-md -top-1" />
                    <div className="absolute w-4 h-4 bg-primary/20 rounded-full blur-sm top-0 left-2" />
                  </div>
                </motion.div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
