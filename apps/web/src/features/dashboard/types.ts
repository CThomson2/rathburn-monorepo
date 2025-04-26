export type Category = "Hydrocarbons" | "Gen Solvents" | "Aromatics" | "default";

export interface DrumInventory {
  id: string;
  code: string;
  name: string;
  category: Category;
  newStock: number;
  reproStock: number;
  threshold: number;
  total: number;
}

export interface ChartDrumInventory {
  chemical: string;
  code: string;
  category: Category;
  newDrums: number;
  reproDrums: number;
  threshold: number;
  criticalThreshold: number;
  total: number;
  unit: string;
}

export interface ChemicalInventoryLocation {
  name: string;
  quantity: number;
}

export interface ChemicalItem {
  id: string;
  name: string;
  formula: string;
  casNumber: string;
  category: Category;
  hazardLevel: "low" | "medium" | "high";
  storageConditions: string;
  totalQuantity: number;
  unit: string;
  locations: ChemicalInventoryLocation[];
  lastUpdated: string;
  expiryDate: string;
  supplier: string;
  notes?: string;
  msdsUrl?: string;
  coaUrl?: string;
} 