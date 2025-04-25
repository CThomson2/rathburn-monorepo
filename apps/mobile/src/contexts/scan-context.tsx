import { createContext } from "react";

// Create a context for sharing the scanned drums state
interface ScanContextType {
  scannedDrums: string[];
  handleDrumScan: (scannedValue: string) => void;
  resetScannedDrums: () => void;
}

export const ScanContext = createContext<ScanContextType>({
  scannedDrums: [],
  handleDrumScan: () => {},
  resetScannedDrums: () => {},
});
