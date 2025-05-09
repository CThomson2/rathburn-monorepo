/**
 * Theme Provider Component
 *
 * This component provides theme switching functionality for the Vite React application.
 * It manages light/dark mode themes and persists the user's theme preference.
 * The provider allows child components to access and modify the current theme through the useTheme hook.
 */

"use client";

import * as React from "react";
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

/**
 * ThemeProvider Component
 *
 * This component manages and provides theme switching functionality for its child components.
 * It initializes and maintains the current theme state using localStorage to persist user preference.
 * The component also updates the document's root element class to apply the selected theme.
 *
 * Props:
 * - children: The child components that can access and modify the current theme.
 * - defaultTheme: The initial theme to use if no preference is stored in localStorage.
 * - storageKey: The key used in localStorage to store the user's theme preference.
 *
 * The available themes are:
 * - "light": Applies the light mode theme.
 * - "dark": Applies the dark mode theme.
 * - "system": Follows the system's theme preference.
 *
 * This component provides a context that allows child components to access the current theme
 * and a function to update the theme.
 */
export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  useEffect(() => {
    const root = window.document.documentElement;

    // Remove all theme classes
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider value={value} {...props}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
