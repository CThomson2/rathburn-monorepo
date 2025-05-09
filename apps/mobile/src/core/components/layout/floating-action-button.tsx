import { LucideIcon } from "lucide-react";
import { cn } from "@/core/lib/utils";

interface FloatingActionButtonProps {
  icon: LucideIcon;
  onClick: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  color?: "primary" | "secondary" | "danger";
  label: string;
}

/**
 * Floating Action Button (FAB) component
 *
 * A standalone circular button that floats above the UI
 * Used for the primary action on a screen
 */
export function FloatingActionButton({
  icon: Icon,
  onClick,
  className,
  size = "md",
  color = "primary",
  label,
}: FloatingActionButtonProps) {
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-14 h-14",
    lg: "w-16 h-16",
  };

  const iconSizes = {
    sm: 18,
    md: 24,
    lg: 28,
  };

  const colorClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "bg-purple-600 hover:bg-purple-700 text-white",
    danger: "bg-red-500 hover:bg-red-600 text-white",
  };

  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        "rounded-full flex items-center justify-center shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95",
        sizeClasses[size],
        colorClasses[color],
        className
      )}
    >
      <Icon size={iconSizes[size]} />
      <span className="sr-only">{label}</span>
    </button>
  );
}
