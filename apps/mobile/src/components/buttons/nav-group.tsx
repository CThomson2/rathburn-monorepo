import { useState } from "react";
import { cn } from "@/lib/utils";
import { StocktakeButton } from "./scan-button";
import FloatingNavMenu from "./nav-menu";
import { LocationButton } from "./location";
import { Database } from "@/types/supabase";

type Location = Database["inventory"]["Enums"]["location_type"];

interface FloatingNavGroupProps {
  onMenuNavigate?: (itemId: string) => void;
  onMenuToggle?: (isOpen: boolean) => void;
  onLocationChange?: (location: Location) => void;
  activeLocation?: Location | null;
  isStockTakeActive: boolean;
}

/**
 * Floating navigation group component
 * Renders a full-width section at the bottom of the app view
 * Contains multiple navigation buttons in a consistent layout
 *
 * Currently includes:
 * - FloatingNavMenu: Main navigation menu on the left
 * - StocktakeButton: Stock take button that moves from center to right when active
 * - LocationButton: Location selection button on the right
 */
export function FloatingNavGroup({
  onMenuNavigate,
  onMenuToggle,
  onLocationChange,
  activeLocation = null,
  isStockTakeActive,
}: FloatingNavGroupProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);

  const handleMenuToggle = (isOpen: boolean) => {
    setIsMenuOpen(isOpen);
    if (onMenuToggle) {
      onMenuToggle(isOpen);
    }
  };

  const handleLocationToggle = (isOpen: boolean) => {
    setIsLocationOpen(isOpen);
    // Optionally close menu if location is opening
    if (isOpen && isMenuOpen) {
      setIsMenuOpen(false);
      if (onMenuToggle) {
        onMenuToggle(false);
      }
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 z-20">
      {/* Background frame with curved edges */}
      <div className="absolute inset-0 bg-background border-t border-border rounded-t-3xl shadow-lg" />

      {/* Button container */}
      <div className="fixed bottom-3 left-0 right-0 z-30 flex justify-between items-center px-6">
        {/* Left position - Menu button */}
        <div className="flex-1 flex justify-start">
          <FloatingNavMenu
            onNavigate={onMenuNavigate}
            onMenuToggle={handleMenuToggle}
          />
        </div>

        {/* Center position - Stocktake button with transition */}
        <div className="flex-1 flex">
          <div
            className={cn(
              "transition-all duration-500 ease-in-out transform",
              isStockTakeActive
                ? "translate-x-1/2 ml-auto mr-0"
                : "translate-x-0 mx-auto"
            )}
          >
            <StocktakeButton />
          </div>
        </div>

        {/* Right position - Location toggle button */}
        <div className="flex-1 flex justify-end">
          <LocationButton
            onToggle={handleLocationToggle}
            onLocationChange={onLocationChange}
            activeLocation={activeLocation}
          />
        </div>
      </div>
    </div>
  );
}
