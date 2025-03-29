"use client";

/**
 * Sonner is a toast notification library for React that provides elegant,
 * customizable toast notifications.
 *
 * This file wraps the Sonner Toaster component with our application's theme
 * and styling preferences. The Toaster component acts as a container for all
 * toast notifications in the application, while individual toasts are created
 * using the toast() function imported from sonner.
 *
 * Usage:
 * 1. Place <Toaster /> once in your application layout
 * 2. Import { toast } from "sonner" where you need to show notifications
 * 3. Call toast("Your message") to display a toast
 */

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
