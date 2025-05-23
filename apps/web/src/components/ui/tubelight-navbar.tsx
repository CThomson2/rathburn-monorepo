"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface NavItem {
  name: string;
  url: string;
  icon: LucideIcon;
}

interface NavBarProps {
  items: NavItem[];
  className?: string;
  isLoading?: boolean;
}

/**
 * A responsive navigation bar for Tubelight.
 * Can be used for view switching with animations.
 *
 * @param {{ items: NavItem[]; className?: string; isLoading?: boolean }} props
 * @param {NavItem[]} props.items - Navigation items to display
 * @param {string} [props.className] - Additional CSS classes
 * @param {boolean} [props.isLoading] - Whether the page is currently loading
 *
 * @returns {JSX.Element}
 *
 * @example
 * <NavBar
 *   items={[
 *     { name: "Transport", url: "/transport", icon: ForkliftIcon },
 *     { name: "Production", url: "/production", icon: AtomIcon },
 *   ]}
 *   className="bg-background"
 *   isLoading={isNavigating}
 * />
 */
export function NavBar({ items, className, isLoading = false }: NavBarProps) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  // Find the active item based on the current pathname
  const getActiveItem = () => {
    // Direct match or starts with the url (for nested routes)
    return (
      items.find(
        (item) =>
          pathname === item.url ||
          (item.url !== "/" && pathname.startsWith(item.url))
      )?.name || items[0]?.name
    );
  };

  const [activeTab, setActiveTab] = useState(getActiveItem);

  // Update active tab when pathname changes
  useEffect(() => {
    setActiveTab(getActiveItem());
  }, [pathname]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      className={cn(
        "fixed bottom-0 sm:top-0 left-1/2 -translate-x-1/2 z-50 mb-6 sm:pt-6",
        className
      )}
    >
      <div className="flex items-center gap-3 bg-background/5 border border-border backdrop-blur-lg py-1 px-1 rounded-full shadow-lg">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.name;
          const shouldShowSkeleton = isLoading && isActive;

          return (
            <Link
              key={item.name}
              href={item.url}
              onClick={() => setActiveTab(item.name)}
              className={cn(
                "relative cursor-pointer text-sm font-semibold px-6 py-2 rounded-full transition-colors",
                "text-foreground/80 hover:text-primary",
                isActive && "bg-muted text-primary",
                shouldShowSkeleton && "pointer-events-none"
              )}
            >
              {shouldShowSkeleton ? (
                <>
                  <span className="hidden md:inline">
                    <Skeleton className="h-4 w-20" />
                  </span>
                  <span className="md:hidden">
                    <Skeleton className="h-5 w-5 rounded-full" />
                  </span>
                </>
              ) : (
                <>
                  <span className="hidden md:inline">{item.name}</span>
                  <span className="md:hidden">
                    <Icon size={18} strokeWidth={2.5} />
                  </span>
                </>
              )}
              {isActive && !shouldShowSkeleton && (
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
            </Link>
          );
        })}
      </div>
    </div>
  );
}
