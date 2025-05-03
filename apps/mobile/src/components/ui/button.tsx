import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps } from "class-variance-authority";
// Use the full path to the specific module to avoid resolution issues
import {
  createButtonVariants,
  mobileButtonVariants,
} from "../../../../../packages/ui/src/components/button";

import { cn } from "@/lib/utils";

// Re-export the button variants with mobile-specific settings
export const buttonVariants = mobileButtonVariants;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

// Export the Button component with mobile-specific defaults
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
