/**
 * Utility for color management in the inventory dashboard
 */

// Chemical group type
export type ChemicalGroup = "Hydrocarbons" | "Gen Solvents" | "Aromatics";

// Harmonious color palette with semantic meanings
export const colorPalette = {
  // Primary colors for New Drums (vibrant, fresh)
  new: {
    Hydrocarbons: "#0284c7", // Strong blue for primary hydrocarbons
    "Gen Solvents": "#dc2626", // Strong red for general solvents
    Aromatics: "#4338ca", // Strong indigo for aromatics
  },
  // Secondary colors for Repro Drums (more subdued version of each primary color)
  repro: {
    Hydrocarbons: "#0369a1", // Darker blue for hydrocarbons repro
    "Gen Solvents": "#b91c1c", // Darker red for general solvents repro
    Aromatics: "#3730a3", // Darker indigo for aromatics repro
  },
  // UI Elements
  ui: {
    threshold: "#737373", // Neutral gray for threshold lines
    lowStock: "#f59e0b", // Amber for low stock alerts
    background: "#f8fafc", // Light gray background
    cardBg: "#ffffff", // White card background
    text: {
      primary: "#1e293b", // Dark slate for primary text
      secondary: "#64748b", // Slate for secondary text
      muted: "#94a3b8", // Light slate for muted text
    },
    border: "#e2e8f0", // Light gray border
  },
};

// Helper function to determine bar color based on chemical group and drum type
export const getBarColor = (chemGroup: string, isRepro: boolean): string => {
  const group = (chemGroup as ChemicalGroup) || "Gen Solvents";
  return isRepro
    ? colorPalette.repro[group as ChemicalGroup] ||
        colorPalette.repro["Gen Solvents"]
    : colorPalette.new[group as ChemicalGroup] ||
        colorPalette.new["Gen Solvents"];
};