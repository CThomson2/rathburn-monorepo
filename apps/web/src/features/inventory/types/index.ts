// export interface ReproStock {
//   repro_drum_id: number;
//   date_created: string;
//   material: string;
//   capacity: number;
//   current_volume: number;
//   created_at: string;
//   updated_at: string;
//   status: string;
//   volume_status: string;
//   location: string | null;
//   drum_code: string | null;
// }

// New interface for drum inventory that maps to the view vw_drum_inventory
export interface DrumInventory {
  id: string;
  code: string;
  name: string;
  chGroup: string;
  newStock: number; // maps to raw_drums
  reproStock: number; // maps to repro_drums
  threshold: number;
  total: number; // calculated from newStock + reproStock
  category: string; // maps to ch_group
  groupColour: {
    new: string;
    repro: string;
  };
}
