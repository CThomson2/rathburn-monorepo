import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps } from "class-variance-authority";
// Use the full path to the specific module to avoid resolution issues
import {
  createButtonVariants,
  webButtonVariants,
} from "../../../../../packages/ui/src/components/button";

import { cn } from "@/lib/utils";

// Re-export the button variants with web-specific settings
export const buttonVariants = webButtonVariants;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

// Export the Button component with web-specific defaults
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    // Map standard sizes to web-specific sizes if needed
    const webSize =
      size === "default"
        ? "web-default"
        : size === "sm"
          ? "web-sm"
          : size === "lg"
            ? "web-lg"
            : size === "icon"
              ? "web-icon"
              : size;

    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size: webSize, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
