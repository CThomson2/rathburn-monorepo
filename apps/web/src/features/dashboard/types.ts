export type Category = "Hydrocarbons" | "Gen Solvents" | "Aromatics";

export interface DrumInventory {
  id: string;
  code: string;
  name: string;
  category: Category;
  newStock: number;
  reproStock: number;
  pending_stock: number;
  processing_stock: number;
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
  formula: string | null;
  casNumber: string;
  category: Category;
  hazardLevel: "low" | "medium" | "high";
  storageConditions: Record<string, any> | string | null;
  totalQuantity: number;
  threshold: number;
  unit: string;
  locations: ChemicalInventoryLocation[];
  lastUpdated: string | null;
  default_expiry_date: string | null;
  supplier: string | null;
  notes?: string;
  msdsUrl?: string;
  coaUrl?: string;
} 