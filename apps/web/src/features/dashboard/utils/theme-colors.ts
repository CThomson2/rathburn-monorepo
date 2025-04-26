/**
 * Enhanced theme-aware color utilities for the chemical inventory dashboard
 * Compatible with ShadcnUI theme system using CSS variables
 */
import { cva } from "class-variance-authority";
import { useTheme } from "next-themes";
import { Category } from "../types";
// Color definitions that work with ShadcnUI theme system
export type ThemeColorScheme = {
  // Base UI colors
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;

  // Chemical category colors
  categories: {
    [key in Category]: {
      base: string;
      light: string;
      dark: string;
      gradient: string;
    };
  };

  // Chart colors
  chart: {
    grid: string;
    axis: string;
    text: string;
    tooltip: {
      border: string;
      background: string;
    };
  };

  // Status colors
  status: {
    success: string;
    warning: string;
    error: string;
    info: string;
    successBackground: string;
    warningBackground: string;
    errorBackground: string;
    infoBackground: string;
  };
};

// Define theme-aware color classes using Tailwind and CSS variables
export const colorScheme: ThemeColorScheme = {
  // Base UI colors (using ShadcnUI CSS variables)
  background: "bg-background",
  foreground: "text-foreground",
  card: "bg-card",
  cardForeground: "text-card-foreground",
  popover: "bg-popover",
  popoverForeground: "text-popover-foreground",
  primary: "bg-primary text-primary-foreground",
  primaryForeground: "text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  secondaryForeground: "text-secondary-foreground",
  muted: "bg-muted text-muted-foreground",
  mutedForeground: "text-muted-foreground",
  accent: "bg-accent text-accent-foreground",
  accentForeground: "text-accent-foreground",
  destructive: "bg-destructive text-destructive-foreground",
  destructiveForeground: "text-destructive-foreground",
  border: "border-border",
  input: "bg-background border-input",
  ring: "ring-ring",

  // Chemical category colors
  categories: {
    // Hydrocarbons - Blue family
    Hydrocarbons: {
      base: "hsl(var(--blue-9))",
      light: "hsl(var(--blue-7))",
      dark: "hsl(var(--blue-11))",
      gradient: "from-blue-500 to-blue-700",
    },
    // General Solvents - Green family
    "Gen Solvents": {
      base: "hsl(var(--green-9))",
      light: "hsl(var(--green-7))",
      dark: "hsl(var(--green-11))",
      gradient: "from-green-500 to-green-700",
    },
    // Aromatics - Red family
    Aromatics: {
      base: "hsl(var(--red-9))",
      light: "hsl(var(--red-7))",
      dark: "hsl(var(--red-11))",
      gradient: "from-red-500 to-red-700",
    },
    // Default fallback
    default: {
      base: "hsl(var(--slate-9))",
      light: "hsl(var(--slate-7))",
      dark: "hsl(var(--slate-11))",
      gradient: "from-slate-500 to-slate-700",
    },
  },

  // Chart colors
  chart: {
    grid: "hsl(var(--muted))",
    axis: "hsl(var(--muted-foreground))",
    text: "hsl(var(--foreground))",
    tooltip: {
      border: "hsl(var(--border))",
      background: "hsl(var(--card))",
    },
  },

  // Status colors
  status: {
    success: "hsl(var(--success))",
    warning: "hsl(var(--warning))",
    error: "hsl(var(--destructive))",
    info: "hsl(var(--info))",
    successBackground: "hsl(var(--success) / 0.1)",
    warningBackground: "hsl(var(--warning) / 0.1)",
    errorBackground: "hsl(var(--destructive) / 0.1)",
    infoBackground: "hsl(var(--info) / 0.1)",
  },
};

/**
 * React hook to get the current color scheme based on the active theme
 */
export function useColorScheme() {
  // We're using a single color scheme because it's using CSS variables from ShadcnUI
  // that automatically adjust based on the theme
  return colorScheme;
}

/**
 * Get the appropriate color for a chemical category
 */
export function getCategoryColor(
  category: Category,
  variant: "base" | "light" | "dark" = "base"
): string {
  const normalizedCategory = category || "default";
  const categoryColors = colorScheme.categories[normalizedCategory] ?? 
                         colorScheme.categories.default;
  
  return categoryColors[variant];
}

/**
 * Get a CSS gradient string for a chemical category
 */
export function getCategoryGradient(category: Category): string {
  const normalizedCategory = category || "default";
  return colorScheme.categories[normalizedCategory]?.gradient || 
         colorScheme.categories.default.gradient;
}

/**
 * Get class names for a status badge
 */
export const statusBadgeVariants = cva("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", {
  variants: {
    variant: {
      success: "bg-success/10 text-success-foreground",
      warning: "bg-warning/10 text-warning-foreground",
      error: "bg-destructive/10 text-destructive-foreground",
      info: "bg-info/10 text-info-foreground",
      default: "bg-primary/10 text-primary-foreground",
    },
    outline: {
      true: "border border-current bg-transparent",
      false: "",
    },
  },
  defaultVariants: {
    variant: "default",
    outline: false,
  },
});

/**
 * Get color variant based on inventory status (compared to threshold)
 */
export function getInventoryStatusVariant(
  current: number, 
  threshold: number, 
  criticalThreshold: number
): "success" | "warning" | "error" {
  if (current <= criticalThreshold) return "error";
  if (current <= threshold) return "warning";
  return "success";
}

/**
 * Get style object for a bar chart based on category and status
 */
export function getBarStyle(
  category: Category, 
  current: number, 
  threshold: number, 
  criticalThreshold: number,
  isRepro: boolean = false
): React.CSSProperties {
  const statusVariant = getInventoryStatusVariant(current, threshold, criticalThreshold);
  const baseColor = getCategoryColor(category, isRepro ? "light" : "base");
  
  // Mix the category color with the status color
  let fillColor = baseColor;
  
  if (statusVariant === "error") {
    fillColor = isRepro ? "var(--destructive-light)" : "var(--destructive)";
  } else if (statusVariant === "warning") {
    fillColor = isRepro ? "var(--warning-light)" : "var(--warning)";
  }
  
  return {
    fill: fillColor,
    stroke: "none",
  };
}

/**
 * Get CSS variables for charts as a style object
 * This allows for directly applying the style to component containers
 */
export function getChartCssVariables(): React.CSSProperties {
  return {
    "--chart-grid": "hsl(var(--muted))",
    "--chart-axis": "hsl(var(--muted-foreground))",
    "--chart-text": "hsl(var(--foreground))",
    "--chart-tooltip-border": "hsl(var(--border))",
    "--chart-tooltip-bg": "hsl(var(--card))",
    
    // Category colors
    "--chart-hydrocarbon": "hsl(var(--blue-9))",
    "--chart-solvent": "hsl(var(--green-9))",
    "--chart-aromatic": "hsl(var(--red-9))",
    
    // Status colors
    "--chart-success": "hsl(var(--success))",
    "--chart-warning": "hsl(var(--warning))",
    "--chart-error": "hsl(var(--destructive))",
  } as React.CSSProperties; // Cast to React.CSSProperties for custom properties
}