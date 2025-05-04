import React from "react";
import { cn } from "@/lib/utils";

interface FloatingNavBaseProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean;
  activeColor?: string;
  baseColor?: string;
  rotateOnActive?: boolean;
  children: React.ReactNode;
}

/**
 * Base component for floating action buttons in the app
 *
 * Provides consistent styling, positioning and behavior for buttons
 * in the floating navigation system. Can be customized for different
 * button types while maintaining visual consistency.
 *
 * @param isActive - Whether the button is in active state
 * @param activeColor - Background color when button is active
 * @param baseColor - Default background color
 * @param rotateOnActive - Whether to rotate the button when active
 * @param children - Content to render inside the button
 * @param className - Additional CSS classes
 */
const FloatingNavBase = React.forwardRef<
  HTMLButtonElement,
  FloatingNavBaseProps
>(
  (
    {
      isActive = false,
      baseColor = "bg-blue-600",
      rotateOnActive = false,
      children,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-300",
          isActive && rotateOnActive && "rotate-90",
          baseColor,
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

FloatingNavBase.displayName = "FloatingNavBase";

export { FloatingNavBase };
