

// New interface for drum inventory that maps to the view vw_drum_inventory
export interface DrumInventory {
  id: string;
  code: string;
  name: string;
  category: string; // maps to view ch_group field
  newStock: number; // maps to raw_drums
  reproStock: number; // maps to repro_drums
  threshold: number;
  total: number; // calculated from newStock + reproStock
}
