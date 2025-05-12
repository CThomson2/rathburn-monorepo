import { useState } from "react";
import { MapPin } from "lucide-react";
import { FloatingNavBase } from "../layout/nav-base";
import { cn } from "@/core/lib/utils";
import { Database } from "@/core/types/supabase";

type Location = Database["inventory"]["Enums"]["location_type"];

interface LocationButtonProps {
  onToggle?: (isOpen: boolean) => void;
  onLocationChange?: (location: Location) => void;
  activeLocation: Location | null;
}

/**
 * Location selection button component that displays a dropdown menu
 * of available locations when clicked.
 *
 * @param onToggle Optional callback when the menu is toggled
 * @param onLocationChange Callback when a location is selected
 * @param activeLocation Currently selected location
 */
export function LocationButton({
  onToggle,
  onLocationChange,
  activeLocation,
}: LocationButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Available locations from the database enum
  const locations: Location[] = ["os_stock", "os_lab", "ns_stock", "ns_lab"];

  // Maps location types to readable labels
  const locationLabels: Record<Location, string> = {
    os_stock: "OS Stock",
    os_lab: "OS Lab",
    ns_stock: "NS Stock",
    ns_lab: "NS Lab",
  };

  const handleToggle = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    if (onToggle) {
      onToggle(newIsOpen);
    }
  };

  const handleLocationSelect = (location: Location) => {
    setIsOpen(false);
    if (onToggle) {
      onToggle(false);
    }
    if (onLocationChange) {
      onLocationChange(location);
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
            if (onToggle) {
              onToggle(false);
            }
          }}
        />
      )}

      {/* Location menu items that appear when toggled */}
      <div
        className={cn(
          "fixed bottom-24 right-4 z-50 flex flex-col-reverse gap-4 mb-4 items-end transition-all duration-300",
          isOpen
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-10 pointer-events-none"
        )}
      >
        {locations.map((location, index) => (
          <div key={location} className="flex items-center">
            {/* Label that appears when menu is open */}
            <span
              className={cn(
                "mr-3 text-white font-medium bg-gray-800 bg-opacity-75 px-3 py-1 rounded-lg text-sm whitespace-nowrap transition-all duration-300",
                isOpen
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 translate-x-4 pointer-events-none",
                `delay-${100 + index * 75}`
              )}
            >
              {locationLabels[location]}
            </span>

            <button
              onClick={() => handleLocationSelect(location)}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg transform group",
                activeLocation === location
                  ? "bg-green-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100",
                isOpen ? "scale-100" : "scale-75",
                // Add staggered animation delay
                `transition-transform duration-300 delay-${index * 75}`
              )}
              aria-label={`Set location to ${locationLabels[location]}`}
            >
              <MapPin size={20} />
            </button>
          </div>
        ))}
      </div>

      {/* Main toggle button using FloatingNavBase */}
      <FloatingNavBase
        onClick={handleToggle}
        isActive={isOpen}
        rotateOnActive={false}
        activeColor="bg-green-500"
        baseColor={activeLocation ? "bg-green-600" : "bg-blue-600"}
        aria-label={isOpen ? "Close location menu" : "Open location menu"}
      >
        <MapPin size={24} />
      </FloatingNavBase>
    </>
  );
}
